import { Injectable, Logger } from '@nestjs/common';
import { DeviceStatus, DeviceType, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ItemNotFoundException } from 'src/errors';
import { UpdateDeviceBasicDto, CreateDeviceDto, SearchDeviceDto, UpdateDeviceConfigsDto } from './dtos/index';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { AuthenticatedUser, DeviceInfo, PaginatedResult } from 'src/types/internal.type';

export const devicePublicSelect = Prisma.validator<Prisma.tbl_devicesSelect>()({
  id: true,
  name: true,
  type: true,
  status: true,
  information: true,
  configs: true,
  created_at: true,
  updated_at: true,
  owner: {
    select: {
      id: true,
      fullname: true,
      email: true,
    },
  },
  registered_by: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  last_state: {
    select: {
      state_data: true,
    },
  },
});

export const deviceWithoutRefSelect = Prisma.validator<Prisma.tbl_devicesSelect>()({
  id: true,
  name: true,
  type: true,
  status: true,
  information: true,
  configs: false,
  created_at: true,
  updated_at: true,
});

type DeviceRowBase = Prisma.tbl_devicesGetPayload<{ select: typeof devicePublicSelect }>;
type DeviceWithoutRefRowBase = Prisma.tbl_devicesGetPayload<{ select: typeof deviceWithoutRefSelect }>;

// export type DeviceRow = Omit<DeviceRowBase, 'created_at' | 'updated_at'> & {
//   created_at?: string;
//   updated_at?: string;
// };

export type DeviceRow = DeviceRowBase;
export type DeviceWithoutRefRow = DeviceWithoutRefRowBase;

const ALLOWED = ['id', 'name', 'type', 'status', 'owner', 'register', 'search'] as const;

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('DevicesService initialized');
  }

  private getDeviceType(firmware_version: string): { type: DeviceType; default_name: string } {
    //TODO: Verify that the device exists and get devic type
    const tag = firmware_version.split('_')[0];
    if (tag.includes('carwash')) {
      return { type: DeviceType.WASH, default_name: 'เครื่องล้างรถเครื่อใหม่' };
    } else if (tag.includes('helmet')) {
      return { type: DeviceType.DRYING, default_name: 'เครื่องอบแห้งหมวกกันน็อคเครื่อใหม่' };
    } else {
      throw new ItemNotFoundException('Invalid firmware version');
    }
  }

  async searchDevices(
    q: SearchDeviceDto,
    user?: AuthenticatedUser,
  ): Promise<PaginatedResult<DeviceRow | DeviceWithoutRefRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', ALLOWED);
    const ands: Prisma.tbl_devicesWhereInput['AND'] = [];

    // Add permission-based filtering for USER role
    if (user?.permission?.name === PermissionType.USER) {
      ands.push({ owner_id: user.id });
    }

    // Handle general search - search both id and name fields
    const search = pairs.find((p) => p.key === 'search')?.value;
    if (search) {
      if (q.exclude_all_ref_table) {
        // If excluding ref tables, only search in device fields
        ands.push({
          OR: [{ id: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }],
        });
      } else {
        // Include owner search when ref tables are included
        ands.push({
          OR: [
            { id: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { owner: { fullname: { contains: search, mode: 'insensitive' } } },
          ],
        });
      }
    }

    for (const { key, value } of pairs) {
      switch (key) {
        case 'id':
          ands.push({ id: { contains: value, mode: 'insensitive' } });
          break;
        case 'name':
          ands.push({ name: { contains: value, mode: 'insensitive' } });
          break;
        case 'owner':
          ands.push({ owner: { id: value } });
          break;
        case 'register':
          ands.push({ registered_by: { id: value } });
          break;
        case 'type': {
          const v = value.toUpperCase();
          if (v === DeviceType.WASH || v === DeviceType.DRYING) {
            ands.push({ type: v as DeviceType });
          }
          break;
        }
        case 'status': {
          const v = value.toUpperCase();
          if (v === DeviceStatus.DEPLOYED || v === DeviceStatus.DISABLED) {
            ands.push({ status: v as DeviceStatus });
          }
          break;
        }
      }
    }

    const where: Prisma.tbl_devicesWhereInput | undefined = ands.length ? { AND: ands } : undefined;

    const safePage = Math.max(1, Number(q.page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(q.limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    // Choose select based on exclude_all_ref_table parameter
    const selectQuery = q.exclude_all_ref_table ? deviceWithoutRefSelect : devicePublicSelect;

    const [data, total] = await Promise.all([
      this.prisma.tbl_devices.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          [q.sort_by ?? 'created_at']: q.sort_order ?? 'desc',
        },
        select: selectQuery,
      }),
      this.prisma.tbl_devices.count({ where }),
    ]);

    return {
      items: data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findById(id: string, user?: AuthenticatedUser): Promise<DeviceRow> {
    const where: Prisma.tbl_devicesWhereUniqueInput = { id };

    // Add permission-based filtering for USER role
    if (user?.permission?.name === PermissionType.USER) {
      where.owner_id = user.id;
    }
    const device: DeviceRowBase | null = await this.prisma.tbl_devices.findUnique({
      where,
      select: devicePublicSelect,
    });
    if (!device) {
      throw new ItemNotFoundException('Device not found');
    }

    return device;
  }

  async intialDevice(information: DeviceInfo): Promise<DeviceRow> {
    //TODO: Verify that the device exists and get devic type
    const { type, default_name } = this.getDeviceType(information.firmware_version);

    // Check if device with the same chip_id already exists
    const existingDevice = await this.prisma.tbl_devices.findFirst({
      where: {
        information: {
          path: ['chip_id'],
          equals: information.chip_id,
        },
      },
      select: devicePublicSelect,
    });

    // If device with same chip_id exists, return it
    if (existingDevice) {
      this.logger.log(`Device with chip_id ${information.chip_id} already exists, returning existing device`);
      return existingDevice;
    }

    const tempDeviceId = `device-${information.chip_id}`;

    // Create new device if chip_id doesn't exist
    const device = await this.prisma.tbl_devices.create({
      data: {
        id: tempDeviceId,
        type: type,
        name: default_name,
        information: information,
        owner_id: 'device-intial',
        register_by_id: 'device-intial',
        status: DeviceStatus.DEPLOYED,
      },
      select: devicePublicSelect,
    });
    return device;
  }

  async assignDeviceToEmployee(data: CreateDeviceDto): Promise<DeviceRow> {
    // Verify that the owner exists
    const owner = await this.prisma.tbl_users.findUnique({
      where: { id: data.owner_id },
      select: { id: true },
    });
    if (!owner) {
      throw new ItemNotFoundException('Device owner not found');
    }

    // Verify that the employee (register_by) exists
    const emp = await this.prisma.tbl_emps.findUnique({
      where: { id: data.register_by },
      select: { id: true },
    });
    if (!emp) {
      throw new ItemNotFoundException('Employee not found');
    }

    // Upsert (insert or update) a device record based on the provided data
    const device = await this.prisma.tbl_devices.upsert({
      where: { id: data.id },
      update: {
        name: data.name,
        owner_id: data.owner_id,
        register_by_id: data.register_by,
      },
      create: {
        id: data.id,
        name: data.name,
        type: data.type,
        owner_id: data.owner_id,
        register_by_id: data.register_by,
      },
      select: devicePublicSelect,
    });
    return device;
  }

  async updateBasicById(id: string, data: UpdateDeviceBasicDto): Promise<DeviceRow> {
    // Use updateMany to check if any record was updated
    const updateResult = await this.prisma.tbl_devices.updateMany({
      where: { id },
      data: {
        ...data,
      },
    });

    if (updateResult.count === 0) {
      throw new ItemNotFoundException('Device not found');
    }

    // Get the updated device
    const device: DeviceRowBase | null = await this.prisma.tbl_devices.findUnique({
      where: { id },
      select: devicePublicSelect,
    });

    if (!device) {
      throw new ItemNotFoundException('Device not found');
    }

    return device;
  }

  async updateConfigsById(id: string, data: UpdateDeviceConfigsDto): Promise<DeviceRow> {
    // Check if device exists and get current configs
    const existingDevice = await this.prisma.tbl_devices.findUnique({
      where: { id },
      select: { id: true, type: true, configs: true },
    });
    if (!existingDevice) {
      throw new ItemNotFoundException('Device not found');
    }

    // Merge new values with existing configs
    let updatedConfigs = existingDevice.configs as any;
    if (data.configs) {
      // Update system configs
      if (data.configs.system) {
        updatedConfigs = {
          ...updatedConfigs,
          system: {
            ...updatedConfigs?.system,
            ...data.configs.system,
          },
        };
      }

      // Update sale configs - only update values, preserve unit and description
      if (data.configs.sale) {
        updatedConfigs = {
          ...updatedConfigs,
          sale: {
            ...updatedConfigs?.sale,
          },
        };

        // Update only the value for each parameter
        Object.keys(data.configs.sale).forEach((key) => {
          if (data.configs?.sale?.[key] !== undefined) {
            // Check if the parameter exists in the current config
            if (updatedConfigs.sale[key]) {
              updatedConfigs.sale[key] = {
                ...updatedConfigs.sale[key],
                value: data.configs.sale[key],
              };
            } else {
              // If parameter doesn't exist, log a warning but don't add it
              throw new ItemNotFoundException(
                `Parameter '${key}' not found in device type '${existingDevice.type}' configuration`,
              );
            }
          }
        });
      }

      // Update pricing configs
      if (data.configs.pricing) {
        updatedConfigs = {
          ...updatedConfigs,
          pricing: { ...updatedConfigs?.pricing },
        };

        // Update only the value for each parameter
        Object.keys(data.configs.pricing).forEach((key) => {
          if (data.configs?.pricing?.[key] !== undefined) {
            // Check if the parameter exists in the current config
            if (updatedConfigs.pricing[key]) {
              updatedConfigs.pricing[key] = {
                ...updatedConfigs.pricing[key],
                value: data.configs.pricing[key],
              };
            } else {
              // If parameter doesn't exist, log a warning but don't add it
              throw new ItemNotFoundException(
                `Parameter '${key}' not found in device type '${existingDevice.type}' pricing configuration`,
              );
            }
          }
        });
      }
    }

    const device: DeviceRowBase = await this.prisma.tbl_devices.update({
      where: { id },
      data: {
        configs: updatedConfigs,
      },
      select: devicePublicSelect,
    });

    return device;
  }
}
