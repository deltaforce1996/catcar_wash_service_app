import { PrismaClient, PermissionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

  const userPermission = await prisma.tbl_permissions.findUnique({
    where: { name: PermissionType.USER },
  });

  if (!userPermission) {
    throw new Error('User permission not found');
  }

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

  const devicesUser = await prisma.tbl_devices.createMany({
    data: [
      {
        name: 'Device 1',
        type: 'WARP',
        status: 'DEPLOYED',
        owner_id: user.id,
        register_by_id: technician.id,
      },
      {
        name: 'Device 2',
        type: 'WAP',
        status: 'DISABLED',
        owner_id: user.id,
        register_by_id: technician.id,
      },
      {
        name: 'Device 3',
        type: 'WARP',
        status: 'DEPLOYED',
        owner_id: user.id,
        register_by_id: technician.id,
      },
    ],
  });

  const devicesUser2 = await prisma.tbl_devices.createMany({
    data: [
      {
        name: 'Device 4',
        type: 'WARP',
        status: 'DISABLED',
        owner_id: user2.id,
        register_by_id: technician.id,
      },
      {
        name: 'Device 5',
        type: 'WAP',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
      },
      {
        name: 'Device 6',
        type: 'WARP',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
      },
      {
        id: '1234567890',
        name: 'Device 7',
        type: 'WAP',
        status: 'DEPLOYED',
        owner_id: user2.id,
        register_by_id: technician.id,
      },
    ],
  });

  console.log(`SuperAdmin employee created with ID: ${superAdmin.id}`);
  console.log(`Technician employee created with ID: ${technician.id}`);
  console.log(`User created with ID: ${user.id}`);
  console.log(`User 2 created with ID: ${user2.id}`);
  console.log(`Devices created: ${devicesUser.count}`);
  console.log(`Devices created: ${devicesUser2.count}`);
  console.log('Database seeding completed successfully!');
};

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
