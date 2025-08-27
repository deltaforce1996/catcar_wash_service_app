import { PrismaClient, PermissionType, EventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DeviceDryingConfig } from '../src/shared/device-drying-config';
import { DeviceWashConfig } from '../src/shared/device-wash-config';
import { DeviceRow } from '../src/apis/devices/devices.service';
import { randomInt } from 'crypto';

const prisma = new PrismaClient();

const main = async () => {
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
        configs: dryingConfig.configs || {},
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
  const logs_events = generateDeviceEvents(deviceIds, EventType.PAYMENT, 2000);

  const newLogsEvents = await prisma.tbl_devices_events.createMany({
    data: logs_events,
  });

  console.log(`SuperAdmin employee created with ID: ${superAdmin.id}`);
  console.log(`Technician employee created with ID: ${technician.id}`);
  console.log(`User created with ID: ${user.id}`);
  console.log(`User 2 created with ID: ${user2.id}`);
  console.log(`Devices created: ${devicesUser.count}`);
  console.log(`Devices created: ${devicesUser2.count}`);
  console.log(`Logs events created: ${newLogsEvents.count}`);
  console.log('Database seeding completed successfully!');

  setTimeout(() => {
    void (async () => {
      console.log('Refreshing materialized views...');
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_day`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_month`;
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_device_payments_year`;
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
      const createdAt = new Date(timestemp);

      const payload = {
        type: type,
        timestemp: timestemp,
        coin: randomInt(1, 100),
        bank: randomInt(1, 100),
        qr: { net_amount: randomInt(1, 100) },
        type_log: type,
      };

      payloads.push({
        device_id: deviceId,
        payload: payload,
        type: type,
        created_at: createdAt,
      });
    }
  });
  return payloads;
};

void main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
