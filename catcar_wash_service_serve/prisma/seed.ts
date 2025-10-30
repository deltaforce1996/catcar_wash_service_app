import { PrismaClient, PermissionType, EventType, DeviceType, PaymentApiStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DeviceDryingConfig } from '../src/shared/device-drying-config';
import { DeviceWashConfig } from '../src/shared/device-wash-config';
import { randomInt } from 'crypto';

const prisma = new PrismaClient();

/**
 * Generates realistic device state data based on device type
 */
const generateDeviceState = (deviceType: DeviceType): any => {
  void deviceType;
  const now = Date.now();
  const timestamp = now + randomInt(-300000, 300000); // ±5 minutes from now
  // Return only base state data
  return {
    timestamp,
    rssi: randomInt(-80, -30), // WiFi signal strength
    uptime: randomInt(3600, 86400), // 1-24 hours uptime
    status: Math.random() > 0.1 ? 'normal' : 'error', // 90% normal, 10% error
  };
};

/**
 * Generates device state history for tbl_devices_state
 */
const generateDeviceStates = (deviceIds: string[], deviceTypes: DeviceType[], count: number): any[] => {
  console.log(`Generating ${count} state records for ${deviceIds.length} devices`);
  const states: any[] = [];

  deviceIds.forEach((deviceId, index) => {
    const deviceType = deviceTypes[index];

    for (let i = 0; i < count; i++) {
      const stateData = generateDeviceState(deviceType);
      const hashState = Buffer.from(JSON.stringify(stateData)).toString('base64');

      // Generate timestamp within the last 30 days
      const now = Date.now();
      const maxPastDays = 30;
      const maxPastMs = maxPastDays * 24 * 60 * 60 * 1000;
      const randomOffset = randomInt(-maxPastMs, 0);
      const createdAt = new Date(now + randomOffset);

      states.push({
        device_id: deviceId,
        state_data: stateData,
        hash_state: hashState,
        created_at: createdAt,
      });
    }
  });

  return states;
};

/**
 * Generates current device state for tbl_devices_last_state
 */
const generateDeviceLastStates = (deviceIds: string[], deviceTypes: DeviceType[]): any[] => {
  console.log(`Generating last state records for ${deviceIds.length} devices`);
  const lastStates: any[] = [];

  deviceIds.forEach((deviceId, index) => {
    const deviceType = deviceTypes[index];
    const stateData = generateDeviceState(deviceType);
    const hashState = Buffer.from(JSON.stringify(stateData)).toString('base64');

    lastStates.push({
      device_id: deviceId,
      state_data: stateData,
      hash_state: hashState,
    });
  });

  return lastStates;
};

const main = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('='.repeat(60));
  console.log(`Starting database seeding in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  console.log('='.repeat(60));

  await seedEssentialData();

  if (!isProduction) {
    console.log('\n' + '-'.repeat(60));
    console.log('Seeding demo data (development mode only)...');
    console.log('-'.repeat(60));
    await seedDemoData();
  } else {
    console.log('\n' + '-'.repeat(60));
    console.log('Skipping demo data in production mode');
    console.log('-'.repeat(60));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Database seeding completed successfully!');
  console.log('='.repeat(60));
};

/**
 * Seeds essential data required for both production and development
 * - Permissions
 * - Super Admin employee
 * - Technician employee
 * - System user for device initialization
 * - System employee for device registration
 */
const seedEssentialData = async () => {
  console.log('\n[Essential Data] Seeding permissions...');

  const permissions = [
    { id: 'PERM-0001', name: PermissionType.ADMIN },
    { id: 'PERM-0002', name: PermissionType.TECHNICIAN },
    { id: 'PERM-0003', name: PermissionType.USER },
  ];

  for (const permission of permissions) {
    await prisma.tbl_permissions.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
    console.log(`[Essential Data] Permission ${permission.name} created/updated`);
  }

  // Get the ADMIN permission for the SuperAdmin
  const adminPermission = await prisma.tbl_permissions.findUnique({
    where: { name: PermissionType.ADMIN },
  });

  if (!adminPermission) {
    throw new Error('Admin permission not found');
  }

  // Create SuperAdmin employee
  console.log('[Essential Data] Creating SuperAdmin employee...');

  const technicianPermission = await prisma.tbl_permissions.findUnique({
    where: { name: PermissionType.TECHNICIAN },
  });

  if (!technicianPermission) {
    throw new Error('Technician permission not found');
  }

  const hashedPassword = await bcrypt.hash('password!', 12);
  const userPermission = await prisma.tbl_permissions.findUnique({
    where: { name: PermissionType.USER },
  });

  if (!userPermission) {
    throw new Error('User permission not found');
  }

  const superAdmin = await prisma.tbl_emps.upsert({
    where: { email: 'superadmin@catcarwash.com' },
    update: {
      id: 'superadmin-0001',
      name: 'นายสมพงษ์ ผู้ดูแลระบบหลัก',
      phone: '+66812345678',
      line: '@superadmin_th',
      password: hashedPassword,
      address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
    create: {
      id: 'superadmin-0001',
      name: 'นายสมพงษ์ ผู้ดูแลระบบหลัก',
      email: 'superadmin@catcarwash.com',
      phone: '+66812345678',
      line: '@superadmin_th',
      password: hashedPassword,
      address: '123 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
  });

  console.log('[Essential Data] Creating Technician employee...');
  const technician = await prisma.tbl_emps.upsert({
    where: { email: 'technician@catcarwash.com' },
    update: {
      id: 'technician-0001',
      name: 'นายสมคิด ช่างเทคนิค',
      phone: '+66823456789',
      line: '@technician_th',
      password: hashedPassword,
      address: '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
      permission_id: technicianPermission.id,
      status: 'ACTIVE',
    },
    create: {
      id: 'technician-0001',
      name: 'นายสมคิด ช่างเทคนิค',
      email: 'technician@catcarwash.com',
      phone: '+66823456789',
      line: '@technician_th',
      password: hashedPassword,
      address: '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
      permission_id: technicianPermission.id,
      status: 'ACTIVE',
    },
  });

  // Create system user for initial device registration
  const deviceInitialUser = await prisma.tbl_users.upsert({
    where: { email: 'device-initial@system.catcarwash.com' },
    update: {
      id: 'device-intial',
      fullname: 'System - Device Initial Owner',
      email: 'device-initial@system.catcarwash.com',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ระบบ - อุปกรณ์รอการกำหนดเจ้าของ',
      address: 'System Address',
    },
    create: {
      id: 'device-intial',
      fullname: 'System - Device Initial Owner',
      email: 'device-initial@system.catcarwash.com',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ระบบ - อุปกรณ์รอการกำหนดเจ้าของ',
      address: 'System Address',
    },
  });

  // Create system employee for initial device registration
  console.log('[Essential Data] Creating system employee for device registration...');
  const deviceInitialEmp = await prisma.tbl_emps.upsert({
    where: { email: 'device-initial-emp@system.catcarwash.com' },
    update: {
      id: 'device-intial',
      name: 'System - Device Initial Registrar',
      email: 'device-initial-emp@system.catcarwash.com',
      password: hashedPassword,
      permission_id: adminPermission.id,
      status: 'ACTIVE',
      address: 'System Address',
    },
    create: {
      id: 'device-intial',
      name: 'System - Device Initial Registrar',
      email: 'device-initial-emp@system.catcarwash.com',
      password: hashedPassword,
      permission_id: adminPermission.id,
      status: 'ACTIVE',
      address: 'System Address',
    },
  });

  console.log(`[Essential Data] SuperAdmin employee: ${superAdmin.id} (${superAdmin.email})`);
  console.log(`[Essential Data] Technician employee: ${technician.id} (${technician.email})`);
  console.log(`[Essential Data] Device Initial System User: ${deviceInitialUser.id} (${deviceInitialUser.email})`);
  console.log(`[Essential Data] Device Initial System Employee: ${deviceInitialEmp.id} (${deviceInitialEmp.email})`);
  console.log('[Essential Data] ✓ Essential data seeding completed');

  return {
    superAdmin,
    technician,
    deviceInitialUser,
    deviceInitialEmp,
    adminPermission,
    userPermission,
    hashedPassword,
  };
};

/**
 * Seeds demo/development data
 * - Demo users
 * - Demo devices
 * - Device events (payment logs)
 * - Device states (historical and current)
 * - Materialized view refresh
 */
const seedDemoData = async () => {
  const hashedPassword = await bcrypt.hash('password!', 12);

  const userPermission = await prisma.tbl_permissions.findUnique({
    where: { name: PermissionType.USER },
  });

  if (!userPermission) {
    throw new Error('User permission not found');
  }

  const technician = await prisma.tbl_emps.findUnique({
    where: { email: 'technician@catcarwash.com' },
  });

  if (!technician) {
    throw new Error('Technician not found');
  }

  const paymentInfo = {
    merchant_id: 'catcarwash',
    api_key: 'S1Isu8/kUiLX8N9PK21mppKZsKkC9wpW9anyiFI1H6s=',
    HMAC_key: 'abcdefghijklmnopqrstuvwxyz',
  };

  console.log('[Demo Data] Creating demo users...');
  const user = await prisma.tbl_users.upsert({
    where: { email: 'user@catcarwash.com' },
    update: {
      id: 'user-0001',
      fullname: 'นายสมชาย ใจดี',
      phone: '+66834567890',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ VIP',
      address: '123/45 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0001',
      fullname: 'นายสมชาย ใจดี',
      email: 'user@catcarwash.com',
      phone: '+66834567890',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ VIP',
      address: '123/45 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900',
      payment_info: paymentInfo,
    },
  });

  const user2 = await prisma.tbl_users.upsert({
    where: { email: 'user2@catcarwash.com' },
    update: {
      id: 'user-0002',
      fullname: 'นางสาวสมหญิง รักดี',
      email: 'user2@catcarwash.com',
      phone: '+66845678901',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าธุรกิจ',
      address: '789 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0002',
      fullname: 'นางสาวสมหญิง รักดี',
      email: 'user2@catcarwash.com',
      phone: '+66845678901',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าธุรกิจ',
      address: '789 ถนนสุขุมวิท แขวงคลองตัน เขตวัฒนา กรุงเทพมหานคร 10110',
      payment_info: paymentInfo,
    },
  });

  console.log(`[Demo Data] User 1 created: ${user.id} (${user.email})`);
  console.log(`[Demo Data] User 2 created: ${user2.id} (${user2.email})`);

  const washConfig = new DeviceWashConfig({
    configs: {
      machine: {
        ON_TIME: '00:00',
        OFF_TIME: '23:59',
        SAVE_STATE: true,
        ACTIVE: true,
        BANKNOTE: true,
        COIN: true,
        QR: true,
      },
      pricing: {
        PROMOTION: 0,
      },
      function: {
        sec_per_baht: {
          HP_WATER: 10,
          FOAM: 10,
          AIR: 10,
          WATER: 10,
          VACUUM: 10,
          BLACK_TIRE: 10,
          WAX: 10,
          AIR_FRESHENER: 10,
          PARKING_FEE: 10,
        },
      },
    },
  });

  const dryingConfig = new DeviceDryingConfig({
    configs: {
      machine: {
        ON_TIME: '00:00',
        OFF_TIME: '23:59',
        SAVE_STATE: true,
        ACTIVE: true,
        BANKNOTE: true,
        COIN: true,
        QR: true,
      },
      pricing: {
        BASE_FEE: 10,
        PROMOTION: 0,
        WORK_PERIOD: 600,
      },
      function_start: {
        DUST_BLOW: 0,
        SANITIZE: 100,
        UV: 200,
        OZONE: 300,
        DRY_BLOW: 400,
        PERFUME: 500,
      },
      function_end: {
        DUST_BLOW: 100,
        SANITIZE: 200,
        UV: 300,
        OZONE: 400,
        DRY_BLOW: 500,
        PERFUME: 600,
      },
    },
  });

  console.log('[Demo Data] Creating demo devices...');
  const devicesUser = await prisma.tbl_devices.createMany({
    data: [
      {
        id: 'device-0000',
        name: 'เครื่องล้างรถหมายเลข 0',
        type: 'WASH',
        status: 'DEPLOYED',
        owner_id: user.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
        information: {
          chip_id: '24AB3C90',
          mac_address: '24:6F:28:AB:3C:91',
          firmware_version: 'car_wash_v1.00',
        },
      },
      {
        id: 'device-0001',
        name: 'เครื่องเป่าลมหมายเลข 1',
        type: 'DRYING',
        status: 'DISABLED',
        owner_id: user.id,
        register_by_id: technician.id,
        configs: dryingConfig.configs || {},
        information: {
          chip_id: '24AB3C91',
          mac_address: '24:6F:28:AB:3C:90',
          firmware_version: 'car_drying_v1.00',
        },
      },
      {
        id: 'device-0002',
        name: 'เครื่องเป่าลมหมายเลข 2',
        type: 'DRYING',
        status: 'DEPLOYED',
        owner_id: user.id,
        register_by_id: technician.id,
        configs: dryingConfig.configs || {},
        information: {
          chip_id: '24AB3C92',
          mac_address: '24:6F:28:AB:3C:92',
          firmware_version: 'car_drying_v1.00',
        },
      },
    ],
  });

  const devicesUser2 = await prisma.tbl_devices.createMany({
    data: [
      {
        id: 'device-0003',
        name: 'เครื่องล้างรถหมายเลข 3',
        type: 'WASH',
        status: 'DISABLED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
        information: {
          mac_address: '24:6F:28:AB:3C:93',
          chip_id: '24AB3C93',
          firmware_version: 'car_wash_v1.00',
        },
      },
      {
        id: 'device-0004',
        name: 'เครื่องเป่าลมหมายเลข 4',
        type: 'DRYING',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: dryingConfig.configs || {},
        information: {
          mac_address: '24:6F:28:AB:3C:94',
          chip_id: '24AB3C94',
          firmware_version: 'car_drying_v1.00',
        },
      },
      {
        id: 'device-0005',
        name: 'เครื่องล้างรถหมายเลข 5',
        type: 'WASH',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
        information: {
          mac_address: '24:6F:28:AB:3C:95',
          chip_id: '24AB3C95',
          firmware_version: 'car_wash_v1.00',
        },
      },
      {
        id: 'device-0006',
        name: 'เครื่องล้างรถหมายเลข 6',
        type: 'WASH',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
        information: {
          mac_address: '24:6F:28:AB:3C:96',
          chip_id: '24AB3C96',
          firmware_version: 'car_wash_v1.00',
        },
      },
    ],
  });

  const devices = await prisma.tbl_devices.findMany({
    select: {
      id: true,
      name: true,
      created_at: true,
      updated_at: true,
      status: true,
      type: true,
      information: true,
      configs: true,
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
    },
  });

  const deviceIds = devices.map((device) => device.id);
  const deviceTypes = devices.map((device) => device.type);

  // Generate device events
  console.log('[Demo Data] Generating device events (payment logs)...');
  const logs_events = generateDeviceEvents(deviceIds, EventType.PAYMENT, 5);
  const newLogsEvents = await prisma.tbl_devices_events.createMany({
    data: logs_events,
  });

  // Generate device states (historical data)
  console.log('[Demo Data] Generating device states (historical data)...');
  const device_states = generateDeviceStates(deviceIds, deviceTypes, 10); // 10 state records per device
  const newDeviceStates = await prisma.tbl_devices_state.createMany({
    data: device_states,
  });

  // Generate device last states (current state)
  console.log('[Demo Data] Generating device last states (current state)...');
  const device_last_states = generateDeviceLastStates(deviceIds, deviceTypes);

  // Insert last states using raw SQL since Prisma client might not be updated yet
  for (const lastState of device_last_states) {
    await prisma.$executeRaw`
      INSERT INTO tbl_devices_last_state (id, device_id, state_data, hash_state, updated_at)
      VALUES (gen_random_uuid(), ${lastState.device_id}, ${JSON.stringify(lastState.state_data)}::jsonb, ${lastState.hash_state}, NOW())
      ON CONFLICT (device_id) DO UPDATE SET
        state_data = EXCLUDED.state_data,
        hash_state = EXCLUDED.hash_state,
        updated_at = NOW()
    `;
  }

  console.log(`[Demo Data] Devices for user 1: ${devicesUser.count}`);
  console.log(`[Demo Data] Devices for user 2: ${devicesUser2.count}`);
  console.log(`[Demo Data] Device events (payments): ${newLogsEvents.count}`);
  console.log(`[Demo Data] Device states (historical): ${newDeviceStates.count}`);
  console.log(`[Demo Data] Device last states: ${device_last_states.length}`);

  // Refresh materialized views after a delay to ensure data is committed
  void setTimeout(() => {
    void (async () => {
      console.log('[Demo Data] Refreshing materialized views...');
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_day`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_month`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_year`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_hour`;
      console.log('[Demo Data] ✓ Materialized views refreshed successfully!');
    })();
  }, 5000);

  console.log('[Demo Data] ✓ Demo data seeding completed');
};

const generateDeviceEvents = (deviceIds: string[], type: EventType, count: number): any[] => {
  console.log(`Generating ${count} events for ${deviceIds.length} devices`);
  const payloads: any[] = [];

  // Ensure timestamps fall within partition range (120 days back to 180 days forward)
  // Use a safer range: 90 days back to 90 days forward from now
  const now = Date.now();
  const maxPastDays = 90;
  const maxFutureDays = 90;
  const maxPastMs = maxPastDays * 24 * 60 * 60 * 1000;
  const maxFutureMs = maxFutureDays * 24 * 60 * 60 * 1000;

  deviceIds.forEach((deviceId) => {
    for (let i = 0; i < count; i++) {
      // Generate random timestamp within safe partition range
      const randomOffset = randomInt(-maxPastMs, maxFutureMs);
      const timestamp = now + randomOffset;

      const payload = {
        type: type,
        timestamp: timestamp,
        coin: {
          1: randomInt(0, 10),
          2: 0.0,
          5: 0.0,
          10: 0.0,
        },
        bank: {
          20: 0.0,
          50: 0.0,
          100: 0.0,
          500: 0.0,
          1000: 0.0,
        },
        qr: { net_amount: 0.0, chargeId: 'ACB-1152-1152' },
      };

      const totalAmount =
        Object.entries(payload.coin as Record<string, number>).reduce((acc, [k, v]) => acc + Number(k) * v, 0) +
        Object.entries(payload.bank as Record<string, number>).reduce((acc, [k, v]) => acc + Number(k) * v, 0) +
        (payload.qr as { net_amount: number }).net_amount;

      payload['total_amount'] = totalAmount;
      payload['status'] = PaymentApiStatus.SUCCEEDED;

      payloads.push({
        device_id: deviceId,
        payload: payload,
      });
    }
  });
  return payloads;
};

try {
  void main();
} catch (e) {
  console.error('Error during seeding:', e);
  process.exit(1);
} finally {
  void prisma.$disconnect();
}
