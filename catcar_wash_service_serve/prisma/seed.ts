import { PrismaClient, PermissionType, EventType, DeviceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DeviceDryingConfig } from '../src/shared/device-drying-config';
import { DeviceWashConfig } from '../src/shared/device-wash-config';
import { randomInt } from 'crypto';

const prisma = new PrismaClient();

/**
 * Generates realistic device state data based on device type
 */
const generateDeviceState = (deviceType: DeviceType): any => {
  const now = Date.now();
  const timestamp = now + randomInt(-300000, 300000); // ±5 minutes from now
  console.log(`Device type: ${deviceType}`);
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
  // console.log('starting...');
  // const payloads = generateDeviceEvents(['device-0001'], EventType.PAYMENT, 2);
  // console.log(JSON.stringify(payloads, null, 2));
  await generate();
};

const generate = async () => {
  console.log('Starting database seeding...');

  // Seed permissions
  console.log('Seeding permissions...');

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
    console.log(`Permission ${permission.name} created/updated`);
  }

  // Get the ADMIN permission for the SuperAdmin
  const adminPermission = await prisma.tbl_permissions.findUnique({
    where: { name: PermissionType.ADMIN },
  });

  if (!adminPermission) {
    throw new Error('Admin permission not found');
  }

  // Create SuperAdmin employee
  console.log('Creating SuperAdmin employee...');

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

  const technician = await prisma.tbl_emps.upsert({
    where: { email: 'technician@catcarwash.com' },
    update: {
      id: 'technician-0001',
      name: 'นายสมคิด ช่างเทคนิค',
      phone: '+66823456789',
      line: '@technician_th',
      password: hashedPassword,
      address: '456 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
      permission_id: adminPermission.id,
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
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
  });

  const paymentInfo = {
    merchant_id: 'catcarwash',
    api_key: 'vNp7Pg8oJmFMs2ImOVZjHgYoxAzSmfDDfqeZw+eKr9E=',
  };

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

  const washConfig = new DeviceWashConfig({
    hp_water: 10,
    foam: 10,
    air: 10,
    water: 10,
    vacuum: 10,
    black_tire: 10,
    wax: 10,
    air_conditioner: 10,
    parking_fee: 10,
    promotion: 10,
    on_time: '00:00',
    off_time: '23:59',
    coin: true,
    promptpay: true,
    bank_note: true,
  });

  const dryingConfig = new DeviceDryingConfig({
    blow_dust: 10,
    sterilize: 10,
    uv: 10,
    ozone: 10,
    drying: 10,
    perfume: 10,
    start_service_fee: 10,
    promotion: 10,
    on_time: '00:00',
    off_time: '23:59',
    coin: true,
    promptpay: true,
    bank_note: true,
  });

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
          description: 'เครื่องล้างรถอัตโนมัติสำหรับรถยนต์ขนาดเล็กและกลาง',
          mac_address: '00:1B:44:11:3A:B7',
          chip_id: 'ESP32-001',
          model: 'CarWash Pro v2.1',
          firmware_version: '2.1.3',
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
          description: 'เครื่องเป่าลมและทำความสะอาดภายในรถยนต์',
          mac_address: '00:1B:44:11:3A:B8',
          chip_id: 'ESP32-002',
          model: 'AirBlow Standard v1.5',
          firmware_version: '1.5.2',
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
          description: 'เครื่องเป่าลมและทำความสะอาดภายในรถยนต์ พร้อมระบบฆ่าเชื้อ',
          mac_address: '00:1B:44:11:3A:B9',
          chip_id: 'ESP32-003',
          model: 'AirBlow Pro v2.0',
          firmware_version: '1.0.0',
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
          description: 'เครื่องล้างรถอัตโนมัติสำหรับรถยนต์ขนาดใหญ่',
          mac_address: '00:1B:44:11:3A:BA',
          chip_id: 'ESP32-004',
          model: 'CarWash XL v2.0',
          firmware_version: '2.0.1',
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
          description: 'เครื่องเป่าลมและทำความสะอาดภายในรถยนต์ พร้อมระบบน้ำหอม',
          mac_address: '00:1B:44:11:3A:BB',
          chip_id: 'ESP32-005',
          model: 'AirBlow Premium v2.1',
          firmware_version: '2.1.0',
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
          description: 'เครื่องล้างรถอัตโนมัติพร้อมระบบขัดเงา',
          mac_address: '00:1B:44:11:3A:BC',
          chip_id: 'ESP32-006',
          model: 'CarWash Shine v2.2',
          firmware_version: '2.2.1',
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
          description: 'เครื่องล้างรถอัตโนมัติพร้อมระบบขัดยาง',
          mac_address: '00:1B:44:11:3A:BD',
          chip_id: 'ESP32-007',
          model: 'CarWash Tire v2.1',
          firmware_version: '2.1.2',
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
  const logs_events = generateDeviceEvents(deviceIds, EventType.PAYMENT, 5);
  const newLogsEvents = await prisma.tbl_devices_events.createMany({
    data: logs_events,
  });

  // Generate device states (historical data)
  const device_states = generateDeviceStates(deviceIds, deviceTypes, 10); // 10 state records per device
  const newDeviceStates = await prisma.tbl_devices_state.createMany({
    data: device_states,
  });

  // Generate device last states (current state)
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

  console.log(`SuperAdmin employee created with ID: ${superAdmin.id}`);
  console.log(`Technician employee created with ID: ${technician.id}`);
  console.log(`User created with ID: ${user.id}`);
  console.log(`User 2 created with ID: ${user2.id}`);
  console.log(`Devices created: ${devicesUser.count}`);
  console.log(`Devices created: ${devicesUser2.count}`);
  console.log(`Logs events created: ${newLogsEvents.count}`);
  console.log(`Device states created: ${newDeviceStates.count}`);
  console.log(`Device last states created: ${device_last_states.length}`);
  console.log('Database seeding completed successfully!');

  void setTimeout(() => {
    void (async () => {
      console.log('Refreshing materialized views...');
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_day`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_month`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_year`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_hour`;
      console.log('Materialized views refreshed successfully!');
    })();
  }, 5000);
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
          2: 0,
          5: 0,
          10: 0,
        },
        bank: {
          20: 0,
          50: 0,
          300: 0,
          500: 0,
          1000: 0,
        },
        qr: { net_amount: 0, ref1: 'REF001', ref2: 'REF002', transaction_id: '1234567890' },
      };

      const totalAmount =
        Object.entries(payload.coin as Record<string, number>).reduce((acc, [k, v]) => acc + Number(k) * v, 0) +
        Object.entries(payload.bank as Record<string, number>).reduce((acc, [k, v]) => acc + Number(k) * v, 0) +
        (payload.qr as { net_amount: number }).net_amount;

      payload['total_amount'] = totalAmount;
      payload['status'] = 'SUCCESS'; // SUCCESS, FAILED, CANCELLED

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
