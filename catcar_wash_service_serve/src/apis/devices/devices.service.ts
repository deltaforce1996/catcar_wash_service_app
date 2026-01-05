import { Injectable, Logger, Inject, forwardRef, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { PromotionsService } from '../promotions/promotions.service';

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
export class DevicesService implements OnModuleDestroy {
  private readonly logger = new Logger(DevicesService.name);
  private readonly deviceAckTimeoutSeconds: number;

  // Config Queue Configuration
  private readonly CONFIG_QUEUE_MAX_SIZE = 1000;
  private readonly CONFIG_PROCESS_INTERVAL_MS = 1000;
  private readonly CONFIG_BATCH_SIZE = 10;
  private readonly CONFIG_MAX_RETRIES = 1;

  // Config Queue State
  private configQueue: Array<{
    deviceId: string;
    config: CommandConfig;
    timestamp: number;
    attempts: number;
  }> = [];
  private isProcessingConfigQueue = false;
  private configQueueInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mqttCommandManager: MqttCommandManagerService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PromotionsService))
    private readonly promotionsService: PromotionsService,
  ) {
    this.deviceAckTimeoutSeconds = this.configService.get<number>('device.ackTimeoutSeconds', 15);
    this.startConfigQueueProcessing();
    this.logger.log('DevicesService initialized with config queue processing');
  }

  onModuleDestroy() {
    if (this.configQueueInterval) {
      clearInterval(this.configQueueInterval);
      this.configQueueInterval = null;
    }
    if (this.configQueue.length > 0) {
      this.logger.warn(`Service destroying with ${this.configQueue.length} pending config commands`);
    }
    this.logger.log('DevicesService config queue processing stopped');
  }

  /**
   * Start config queue interval processing
   */
  private startConfigQueueProcessing(): void {
    this.configQueueInterval = setInterval(() => {
      void this.processConfigQueue();
    }, this.CONFIG_PROCESS_INTERVAL_MS);
    this.logger.log('Config queue processing started');
  }

  /**
   * Add config to queue for background processing
   * ถ้ามี config สำหรับ device เดียวกันใน queue แล้ว จะแทนที่ด้วย config ใหม่ (deduplicate)
   */
  private enqueueConfig(deviceId: string, config: CommandConfig): boolean {
    // ตรวจสอบว่ามี config สำหรับ device นี้ใน queue แล้วหรือไม่
    const existingIndex = this.configQueue.findIndex((item) => item.deviceId === deviceId);

    if (existingIndex !== -1) {
      // แทนที่ config เก่าด้วยใหม่ (deduplicate)
      this.configQueue[existingIndex] = {
        deviceId,
        config,
        timestamp: Date.now(),
        attempts: 0,
      };
      this.logger.debug(`Config updated for device ${deviceId} (deduplicated), queue size: ${this.configQueue.length}`);
      return true;
    }

    if (this.configQueue.length >= this.CONFIG_QUEUE_MAX_SIZE) {
      this.logger.warn(`Config queue full (${this.CONFIG_QUEUE_MAX_SIZE}), dropping config for device ${deviceId}`);
      return false;
    }

    this.configQueue.push({
      deviceId,
      config,
      timestamp: Date.now(),
      attempts: 0,
    });

    this.logger.debug(`Config queued for device ${deviceId}, queue size: ${this.configQueue.length}`);
    return true;
  }

  /**
   * Process config queue with retry logic
   */
  private async processConfigQueue(): Promise<void> {
    if (this.configQueue.length === 0 || this.isProcessingConfigQueue) {
      return;
    }

    this.isProcessingConfigQueue = true;

    try {
      const batch = this.configQueue.splice(0, this.CONFIG_BATCH_SIZE);
      const retryItems: typeof this.configQueue = [];

      for (const item of batch) {
        try {
          const result = await this.mqttCommandManager.applyConfig(item.deviceId, item.config);

          if (result.status === 'SUCCESS') {
            this.logger.log(`Config sent successfully to device ${item.deviceId}`);
          } else {
            // TIMEOUT or FAILED - check if should retry
            item.attempts++;

            if (item.attempts < this.CONFIG_MAX_RETRIES) {
              this.logger.warn(
                `Config send failed for device ${item.deviceId} (attempt ${item.attempts}/${this.CONFIG_MAX_RETRIES}): ${result.error ?? result.status}`,
              );
              retryItems.push(item);
            } else {
              this.logger.error(
                `Config send failed for device ${item.deviceId} after ${this.CONFIG_MAX_RETRIES} attempts, dropping: ${result.error ?? result.status}`,
              );
            }
          }
        } catch (error) {
          item.attempts++;

          if (item.attempts < this.CONFIG_MAX_RETRIES) {
            this.logger.warn(
              `Config send error for device ${item.deviceId} (attempt ${item.attempts}/${this.CONFIG_MAX_RETRIES}): ${error.message}`,
            );
            retryItems.push(item);
          } else {
            this.logger.error(
              `Config send error for device ${item.deviceId} after ${this.CONFIG_MAX_RETRIES} attempts, dropping: ${error.message}`,
            );
          }
        }
      }

      // Add retry items back to queue
      if (retryItems.length > 0) {
        this.configQueue.push(...retryItems);
      }
    } finally {
      this.isProcessingConfigQueue = false;
    }
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

  private async generateNewDeviceId(): Promise<string> {
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

    return `DEVICE-${nextNumber.toString().padStart(7, '0')}-${randomSuffix}`;
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

    // Check if device with the same chip_id AND mac_address already exists
    const existingDevice = await this.prisma.tbl_devices.findFirst({
      where: {
        AND: [
          {
            information: {
              path: ['chip_id'],
              equals: information.chip_id,
            },
          },
          {
            information: {
              path: ['mac_address'],
              equals: information.mac_address,
            },
          },
        ],
      },
      orderBy: {
        created_at: 'desc',
      },
      select: devicePublicSelect,
    });

    // If device with same chip_id and mac_address exists, check if type matches
    if (existingDevice) {
      if (existingDevice.type === type) {
        // Type matches, return existing device
        this.logger.log(
          `Device with chip_id ${information.chip_id} and mac_address ${information.mac_address} already exists, returning existing device`,
        );
        return existingDevice;
      } else {
        // Type changed, create new device with new ID
        this.logger.log(
          `Device with chip_id ${information.chip_id} and mac_address ${information.mac_address} exists but type changed from ${existingDevice.type} to ${type}, creating new device`,
        );
        // Fall through to create new device
      }
    }

    // Generate new device ID
    const tempDeviceId = await this.generateNewDeviceId();

    // Create new device
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
      select: { id: true, type: true, configs: true, status: true },
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
            } else if (key === 'promotion_start' || key === 'promotion_end') {
              // Auto-initialize missing promotion timing fields
              updatedConfigs.pricing[key] = {
                value: data.configs.pricing[key],
                unit: 'timestamp',
                description: key === 'promotion_start' ? 'เริ่มโปรโมชั่น' : 'สิ้นสุดโปรโมชั่น',
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

    // Validate promotion timestamps
    if (updatedConfigs?.pricing) {
      const promotionStart = updatedConfigs.pricing.promotion_start?.value;
      const promotionEnd = updatedConfigs.pricing.promotion_end?.value;

      if (promotionStart && promotionEnd && promotionStart !== 0 && promotionEnd !== 0) {
        // Check if start < end
        if (promotionStart >= promotionEnd) {
          throw new BadRequestException('promotion_start must be less than promotion_end');
        }

        // Check if dates are in the future
        // const now = Date.now();
        // if (promotionStart < now) {
        //   throw new BadRequestException('promotion_start must be in the future');
        // }
        // if (promotionEnd < now) {
        //   throw new BadRequestException('promotion_end must be in the future');
        // }
      }
    }

    // Convert structured config back to raw CommandConfig format for MQTT
    const rawConfig = this.convertToRawConfig(
      updatedConfigs,
      existingDevice.type,
      data.status ?? existingDevice.status,
    );

    // Send config to device and wait for ACK before updating DB
    const result = await this.mqttCommandManager.applyConfig(id, rawConfig);

    // Only update DB if device ACK is successful
    if (result.status === 'SUCCESS') {
      const device: DeviceRowBase = await this.prisma.tbl_devices.update({
        where: { id },
        data: {
          configs: updatedConfigs,
          status: data.status,
        },
        select: devicePublicSelect,
      });
      return device;
    } else if (result.status === 'TIMEOUT') {
      throw new BadRequestException(`Device did not respond within ${this.deviceAckTimeoutSeconds} seconds`);
    } else {
      throw new BadRequestException(result.error ?? 'Config update failed');
    }
  }

  /**
   * Convert structured config (stored in DB) back to raw CommandConfig format for MQTT
   */
  private convertToRawConfig(structuredConfig: any, deviceType: DeviceType, status: DeviceStatus): CommandConfig {
    // console.log('status', status);
    const config: CommandConfig = {
      machine: {
        ACTIVE: status === DeviceStatus.DEPLOYED ? true : false,
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
        PROMOTION_START: structuredConfig.pricing?.promotion_start?.value ?? 0,
        PROMOTION_END: structuredConfig.pricing?.promotion_end?.value ?? 0,
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
        PROMOTION_START: structuredConfig.pricing?.promotion_start?.value ?? 0,
        PROMOTION_END: structuredConfig.pricing?.promotion_end?.value ?? 0,
      };
    }

    return config;
  }

  /**
   * Fire-and-forget version: ส่ง config ไป device แบบไม่รอ ACK แล้ว update DB ทันที
   * ใช้สำหรับ promotion update ที่ไม่ต้องการรอ device ตอบกลับ
   */
  async updateConfigsByIdNoWait(id: string, data: UpdateDeviceConfigsDto): Promise<DeviceRow> {
    // Check if device exists and get current configs
    const existingDevice = await this.prisma.tbl_devices.findUnique({
      where: { id },
      select: { id: true, type: true, configs: true, status: true },
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
            } else if (key === 'promotion_start' || key === 'promotion_end') {
              // Auto-initialize missing promotion timing fields
              updatedConfigs.pricing[key] = {
                value: data.configs.pricing[key],
                unit: 'timestamp',
                description: key === 'promotion_start' ? 'เริ่มโปรโมชั่น' : 'สิ้นสุดโปรโมชั่น',
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

    // Convert structured config back to raw CommandConfig format for MQTT
    const rawConfig = this.convertToRawConfig(
      updatedConfigs,
      existingDevice.type,
      data.status ?? existingDevice.status,
    );

    // Fire-and-forget: ส่ง config ไป device แบบไม่รอ ACK
    this.mqttCommandManager.applyConfig(id, rawConfig).catch((error) => {
      this.logger.warn(`Fire-and-forget config update for device ${id} failed: ${error.message}`);
    });

    // Update DB immediately without waiting for device ACK
    const device: DeviceRowBase = await this.prisma.tbl_devices.update({
      where: { id },
      data: {
        configs: updatedConfigs,
        status: data.status,
      },
      select: devicePublicSelect,
    });

    return device;
  }

  async syncConfigsById(device_id: string, data: SyncDeviceConfigsDto): Promise<void> {
    // Get device with owner_id
    const device = await this.prisma.tbl_devices.findUnique({
      where: { id: device_id },
      select: { id: true, type: true, owner_id: true, status: true },
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

    // Get active promotion from DB and override in config
    let dbPromotion = 0;
    let promotionStart = 0;
    let promotionEnd = 0;

    if (device.owner_id) {
      const activePromotion = await this.promotionsService.getActivePromotionForUser(device.owner_id);
      if (activePromotion) {
        dbPromotion = activePromotion.discount_percent;
        promotionStart = activePromotion.start_date.getTime();
        promotionEnd = activePromotion.end_date.getTime();
      }
    }

    // Override promotion in structuredConfig with DB values
    if (structuredConfig.pricing) {
      if (structuredConfig.pricing.promotion) {
        structuredConfig.pricing.promotion = {
          ...structuredConfig.pricing.promotion,
          value: dbPromotion,
        };
      }

      // Update or create promotion_start
      if (structuredConfig.pricing.promotion_start) {
        structuredConfig.pricing.promotion_start = {
          ...structuredConfig.pricing.promotion_start,
          value: promotionStart,
        };
      } else {
        structuredConfig.pricing.promotion_start = {
          value: promotionStart,
          unit: 'timestamp',
          description: 'เริ่มโปรโมชั่น',
        };
      }

      // Update or create promotion_end
      if (structuredConfig.pricing.promotion_end) {
        structuredConfig.pricing.promotion_end = {
          ...structuredConfig.pricing.promotion_end,
          value: promotionEnd,
        };
      } else {
        structuredConfig.pricing.promotion_end = {
          value: promotionEnd,
          unit: 'timestamp',
          description: 'สิ้นสุดโปรโมชั่น',
        };
      }
    }

    // Update configs in database
    await this.prisma.tbl_devices.update({
      where: { id: device_id },
      data: {
        configs: structuredConfig,
      },
    });

    // Convert to raw CommandConfig format
    const rawConfig = this.convertToRawConfig(structuredConfig, device.type, device.status);

    // Queue MQTT command for background processing (with retry)
    this.enqueueConfig(device_id, rawConfig);

    // Return immediately without data
  }
}
