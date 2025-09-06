import { Injectable, Logger } from '@nestjs/common';
import { DeviceStatus, DeviceType, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ItemNotFoundException } from 'src/errors';
import {
  UpdateDeviceBasicDto,
  CreateDeviceDto,
  SearchDeviceDto,
  UpdateDeviceConfigsDto,
  SetDeviceStateDto,
} from './dtos/index';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { AuthenticatedUser, PaginatedResult } from 'src/types/internal.type';

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
});

export type DeviceRow = Prisma.tbl_devicesGetPayload<{ select: typeof devicePublicSelect }>;

const ALLOWED = ['id', 'name', 'type', 'status', 'owner', 'register'] as const;

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('DevicesService initialized');
  }

  async searchDevices(q: SearchDeviceDto, user?: AuthenticatedUser): Promise<PaginatedResult<DeviceRow>> {
    const pairs = parseKeyValueOnly(q.query ?? '', ALLOWED);
    const ands: Prisma.tbl_devicesWhereInput['AND'] = [];

    // Add permission-based filtering for USER role
    if (user?.permission?.name === PermissionType.USER) {
      ands.push({ owner_id: user.id });
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
          ands.push({ owner: { fullname: { contains: value, mode: 'insensitive' } } });
          break;
        case 'register':
          ands.push({ registered_by: { name: { contains: value, mode: 'insensitive' } } });
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
          console.log(v);
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

    const [data, total] = await Promise.all([
      this.prisma.tbl_devices.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: {
          [q.sort_by ?? 'created_at']: q.sort_order ?? 'desc',
        },
        select: devicePublicSelect,
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
    const device: DeviceRow | null = await this.prisma.tbl_devices.findUnique({
      where,
      select: devicePublicSelect,
    });
    if (!device) {
      throw new ItemNotFoundException('Device not found');
    }
    return device;
  }

  async createDevice(data: CreateDeviceDto): Promise<DeviceRow> {
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

    const device = await this.prisma.tbl_devices.create({
      data: {
        name: data.name,
        type: data.type,
        information: data.information,
        configs: data.configs as any,
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
    const device: DeviceRow | null = await this.prisma.tbl_devices.findUnique({
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
    }

    const device: DeviceRow = await this.prisma.tbl_devices.update({
      where: { id },
      data: {
        configs: updatedConfigs,
      },
      select: devicePublicSelect,
    });

    return device;
  }

  async setDeviceState(id: string, data: SetDeviceStateDto, user?: AuthenticatedUser): Promise<void> {
    // First, check if device exists and verify permissions
    const where: Prisma.tbl_devicesWhereUniqueInput = { id };
    // Add permission-based filtering for USER role - they can only update their own devices
    if (user?.permission?.name === PermissionType.USER) {
      where.owner_id = user.id;
    }
    const existingDevice = await this.prisma.tbl_devices.findUnique({
      where,
      select: { id: true, owner_id: true },
    });
    if (!existingDevice) {
      throw new ItemNotFoundException('Device not found or access denied');
    }
    // Update the device status
    await this.prisma.tbl_devices.update({
      where: { id },
      data: {
        status: data.status,
      },
    });
  }
}
