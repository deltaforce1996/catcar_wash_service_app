import { PrismaClient, PermissionType, EventType, DeviceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DeviceDryingConfig } from '../src/shared/device-drying-config';
import { DeviceWashConfig } from '../src/shared/device-wash-config';
import { DeviceRow } from '../src/apis/devices/devices.service';
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
    { name: PermissionType.ADMIN },
    { name: PermissionType.TECHNICIAN },
    { name: PermissionType.USER },
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
      name: 'Super Admin',
      phone: '+1234567890',
      line: '@superadmin',
      password: hashedPassword,
      address: 'CATCAR WASH SERVICE',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@catcarwash.com',
      phone: '+1234567890',
      line: '@superadmin',
      password: hashedPassword,
      address: 'CATCAR WASH SERVICE',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
  });

  const technician = await prisma.tbl_emps.upsert({
    where: { email: 'technician@catcarwash.com' },
    update: {
      name: 'Technician',
      phone: '+1234567890',
      line: '@technician',
      password: hashedPassword,
      address: 'CATCAR WASH SERVICE',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
    create: {
      name: 'Technician',
      email: 'technician@catcarwash.com',
      phone: '+1234567890',
      line: '@technician',
      password: hashedPassword,
      address: 'CATCAR WASH SERVICE',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
  });

  const user = await prisma.tbl_users.upsert({
    where: { email: 'user@catcarwash.com' },
    update: {
      fullname: 'User',
      phone: '+1234567890',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
    },
    create: {
      fullname: 'User',
      email: 'user@catcarwash.com',
      phone: '+1234567890',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
    },
  });

  const user2 = await prisma.tbl_users.upsert({
    where: { email: 'user2@catcarwash.com' },
    update: {
      fullname: 'User 2',
      email: 'user2@catcarwash.com',
      phone: '+1234567890',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
    },
    create: {
      fullname: 'User 2',
      email: 'user2@catcarwash.com',
      phone: '+1234567890',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
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
        name: 'Device 1',
        type: 'WASH',
        status: 'DEPLOYED',
        owner_id: user.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
      },
      {
        name: 'Device 2',
        type: 'DRYING',
        status: 'DISABLED',
        owner_id: user.id,
        register_by_id: technician.id,
        configs: dryingConfig.configs || {},
      },
      {
        name: 'Device 3',
        type: 'DRYING',
        status: 'DEPLOYED',
        owner_id: user.id,
        register_by_id: technician.id,
        configs: dryingConfig.configs || {},
      },
    ],
  });

  const devicesUser2 = await prisma.tbl_devices.createMany({
    data: [
      {
        name: 'Device 4',
        type: 'WASH',
        status: 'DISABLED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
      },
      {
        name: 'Device 5',
        type: 'DRYING',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: dryingConfig.configs || {},
      },
      {
        name: 'Device 6',
        type: 'WASH',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
      },
      {
        name: 'Device 7',
        type: 'WASH',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
        configs: washConfig.configs || {},
      },
    ],
  });

  const devices: DeviceRow[] = await prisma.tbl_devices.findMany({
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
      const timestemp = now + randomOffset;

      const payload = {
        type: type,
        timestemp: timestemp,
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
        qr: { net_amount: 0, ref1: null, ref2: null, transaction_id: '1234567890' },
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
