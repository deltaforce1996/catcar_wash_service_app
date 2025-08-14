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

  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);

  const hashedPasswordTechnician = await bcrypt.hash('Technician123!', 12);

  const superAdmin = await prisma.tbl_emps.upsert({
    where: { email: 'superadmin@catcarwash.com' },
    update: {
      name: 'Super Admin',
      phone: '+1234567890',
      line: '@superadmin',
      password: hashedPassword,
      address: 'System Address',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@catcarwash.com',
      phone: '+1234567890',
      line: '@superadmin',
      password: hashedPassword,
      address: 'System Address',
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
      password: hashedPasswordTechnician,
      address: 'System Address',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
    create: {
      name: 'Technician',
      email: 'technician@catcarwash.com',
      phone: '+1234567890',
      line: '@technician',
      password: hashedPasswordTechnician,
      address: 'System Address',
      permission_id: adminPermission.id,
      status: 'ACTIVE',
    },
  });

  console.log(`SuperAdmin employee created with ID: ${superAdmin.id}`);
  console.log(`Technician employee created with ID: ${technician.id}`);
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
