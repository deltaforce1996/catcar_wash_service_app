import { Injectable, Logger } from '@nestjs/common';
import { DeviceStatus, DeviceType, PermissionType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { BadRequestException, ItemNotFoundException } from 'src/errors';
import {
  UpdateDeviceBasicDto,
  CreateDeviceDto,
  SearchDeviceDto,
  UpdateDeviceConfigsDto,
  SyncDeviceConfigsDto,
} from './dtos/index';
import { parseKeyValueOnly } from 'src/shared/kv-parser';
import { AuthenticatedUser, DeviceInfo, PaginatedResult } from 'src/types/internal.type';
import { DeviceWashConfig } from 'src/shared/device-wash-config';
import { DeviceDryingConfig } from 'src/shared/device-drying-config';
import { MqttCommandManagerService } from 'src/services/adepters/mqtt-command-manager.service';
import { CommandConfig } from 'src/types/mqtt-command-manager.types';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttCommandManager: MqttCommandManagerService,
  ) {
    this.logger.log('DevicesService initialized');
  }

  private getDeviceType(firmware_version: string): { type: DeviceType; default_name: string } {
    //TODO: Verify that the device exists and get devic type
    const tag = firmware_version.split('_')[0];
    if (tag.includes('carwash')) {
      return { type: DeviceType.WASH, default_name: 'เครื่องล้างรถเครื่องใหม่' };
    } else if (tag.includes('helmet')) {
      return { type: DeviceType.DRYING, default_name: 'เครื่องอบแห้งหมวกกันน็อคเครื่องใหม่' };
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

    // Exclude device-initial (devices that haven't completed registration)
    ands.push({ owner_id: { not: 'device-intial' } });

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

    // Generate auto-incrementing device ID with random suffix to prevent duplicates
    const allDevices = await this.prisma.tbl_devices.findMany({
      where: {
        id: {
          startsWith: 'DEVICE-',
        },
      },
      select: {
        id: true,
      },
    });

    // Extract numbers from device IDs and find the maximum
    const deviceNumbers = allDevices
      .map((device) => {
        const match = device.id.match(/^DEVICE-(\d+)(?:-[A-Z]{4})?$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const maxNumber = deviceNumbers.length > 0 ? Math.max(...deviceNumbers) : 0;
    const nextNumber = maxNumber + 1;

    // Generate 4 random uppercase letters to prevent duplicates
    const randomSuffix = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(
      '',
    );

    const tempDeviceId = `DEVICE-${nextNumber.toString().padStart(7, '0')}-${randomSuffix}`;

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

      // Update sale configs - type-specific handling
      if (data.configs.sale) {
        if (existingDevice.type === DeviceType.WASH) {
          // WASH device: Handle value-based parameters
          updatedConfigs = {
            ...updatedConfigs,
            sale: {
              ...updatedConfigs?.sale,
            },
          };

          Object.keys(data.configs.sale).forEach((key) => {
            const saleParam = data.configs?.sale?.[key];
            if (saleParam !== undefined) {
              // Check if the parameter exists in the current config
              if (updatedConfigs.sale[key]) {
                const currentParam = updatedConfigs.sale[key];

                // Support both shorthand (number) and object format
                if (typeof saleParam === 'number') {
                  // Shorthand: "hp_water": 15
                  updatedConfigs.sale[key] = {
                    ...currentParam,
                    value: saleParam,
                  };
                } else {
                  // Object: "hp_water": { "value": 15 }
                  updatedConfigs.sale[key] = {
                    ...currentParam,
                    ...(saleParam.value !== undefined && { value: saleParam.value }),
                  };
                }
              } else {
                // If parameter doesn't exist, throw error
                throw new ItemNotFoundException(`Parameter '${key}' not found in WASH device configuration`);
              }
            }
          });
        } else if (existingDevice.type === DeviceType.DRYING) {
          // DRYING device: Handle start/end-based parameters
          updatedConfigs = {
            ...updatedConfigs,
            sale: {
              ...updatedConfigs?.sale,
            },
          };

          Object.keys(data.configs.sale).forEach((key) => {
            const saleParam = data.configs?.sale?.[key];
            if (saleParam !== undefined) {
              // Check if the parameter exists in the current config
              if (updatedConfigs.sale[key]) {
                // DRYING device requires object format with start/end
                if (typeof saleParam === 'number') {
                  throw new ItemNotFoundException(
                    `Parameter '${key}' in DRYING device requires object format with start/end, not a number`,
                  );
                }

                const currentParam = updatedConfigs.sale[key];
                updatedConfigs.sale[key] = {
                  ...currentParam,
                  ...(saleParam.start !== undefined && { start: saleParam.start }),
                  ...(saleParam.end !== undefined && { end: saleParam.end }),
                };
              } else {
                // If parameter doesn't exist, throw error
                throw new ItemNotFoundException(`Parameter '${key}' not found in DRYING device configuration`);
              }
            }
          });
        } else {
          throw new ItemNotFoundException(`Unsupported device type: ${String(existingDevice.type)}`);
        }
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
              // If parameter doesn't exist, throw error
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

    // Convert structured config back to raw CommandConfig format for MQTT
    const rawConfig = this.convertToRawConfig(device.configs as any, device.type);
    const result = await this.mqttCommandManager.applyConfig(device.id, rawConfig);
    if (result.status !== 'SUCCESS') throw new BadRequestException(result.error ?? 'Config Filed');

    return device;
  }

  /**
   * Convert structured config (stored in DB) back to raw CommandConfig format for MQTT
   */
  private convertToRawConfig(structuredConfig: any, deviceType: DeviceType): CommandConfig {
    const config: CommandConfig = {
      machine: {
        ACTIVE: structuredConfig.system?.payment_method ? true : false,
        BANKNOTE: structuredConfig.system?.payment_method?.bank_note ?? false,
        COIN: structuredConfig.system?.payment_method?.coin ?? false,
        QR: structuredConfig.system?.payment_method?.promptpay ?? false,
        ON_TIME: structuredConfig.system?.on_time ?? '00:00',
        OFF_TIME: structuredConfig.system?.off_time ?? '23:59',
        SAVE_STATE: structuredConfig.system?.save_state ?? false,
      },
    };

    if (deviceType === DeviceType.WASH) {
      // Convert WASH config
      const sale = structuredConfig.sale || {};
      config.function = {
        sec_per_baht: {
          HP_WATER: sale.hp_water?.value ?? 0,
          FOAM: sale.foam?.value ?? 0,
          AIR: sale.air?.value ?? 0,
          WATER: sale.water?.value ?? 0,
          VACUUM: sale.vacuum?.value ?? 0,
          BLACK_TIRE: sale.black_tire?.value ?? 0,
          WAX: sale.wax?.value ?? 0,
          AIR_FRESHENER: sale.air_conditioner?.value ?? 0,
          PARKING_FEE: sale.parking_fee?.value ?? 0,
        },
      };
      config.pricing = {
        PROMOTION: structuredConfig.pricing?.promotion?.value ?? 0,
      };
    } else if (deviceType === DeviceType.DRYING) {
      // Convert DRYING config
      const sale = structuredConfig.sale || {};
      config.function_start = {
        DUST_BLOW: sale.blow_dust?.start ?? 0,
        SANITIZE: sale.sterilize?.start ?? 0,
        UV: sale.uv?.start ?? 0,
        OZONE: sale.ozone?.start ?? 0,
        DRY_BLOW: sale.drying?.start ?? 0,
        PERFUME: sale.perfume?.start ?? 0,
      };
      config.function_end = {
        DUST_BLOW: sale.blow_dust?.end ?? 0,
        SANITIZE: sale.sterilize?.end ?? 0,
        UV: sale.uv?.end ?? 0,
        OZONE: sale.ozone?.end ?? 0,
        DRY_BLOW: sale.drying?.end ?? 0,
        PERFUME: sale.perfume?.end ?? 0,
      };
      config.pricing = {
        BASE_FEE: structuredConfig.pricing?.base_fee?.value ?? 0,
        PROMOTION: structuredConfig.pricing?.promotion?.value ?? 0,
        WORK_PERIOD: structuredConfig.pricing?.work_period?.value ?? 0,
      };
    }

    return config;
  }

  async syncConfigsById(device_id: string, data: SyncDeviceConfigsDto): Promise<void> {
    // Get device and check if exists
    const device = await this.prisma.tbl_devices.findUnique({
      where: { id: device_id },
      select: { id: true, type: true },
    });

    if (!device) {
      throw new ItemNotFoundException('Device not found');
    }

    // Parse configs based on device type
    let structuredConfig: any;

    if (device.type === DeviceType.WASH) {
      // Create payload structure expected by DeviceWashConfig
      const washPayload = {
        configs: {
          machine: data.configs.machine,
          pricing: {
            PROMOTION: data.configs.pricing.PROMOTION ?? 0,
          },
          function: data.configs.function!,
        },
      };
      const washConfig = new DeviceWashConfig(washPayload);
      structuredConfig = washConfig.configs;
    } else if (device.type === DeviceType.DRYING) {
      // Create payload structure expected by DeviceDryingConfig
      const dryingPayload = {
        configs: {
          machine: data.configs.machine,
          pricing: {
            BASE_FEE: data.configs.pricing.BASE_FEE ?? 0,
            PROMOTION: data.configs.pricing.PROMOTION ?? 0,
            WORK_PERIOD: data.configs.pricing.WORK_PERIOD ?? 0,
          },
          function_start: data.configs.function_start!,
          function_end: data.configs.function_end!,
        },
      };
      const dryingConfig = new DeviceDryingConfig(dryingPayload);
      structuredConfig = dryingConfig.configs;
    } else {
      throw new ItemNotFoundException(`Unsupported device type: ${String(device.type)}`);
    }

    // Update configs in database
    await this.prisma.tbl_devices.update({
      where: { id: device_id },
      data: {
        configs: structuredConfig,
      },
    });
  }
}
