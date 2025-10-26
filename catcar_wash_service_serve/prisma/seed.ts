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
    api_key: 'S1Isu8/kUiLX8N9PK21mppKZsKkC9wpW9anyiFI1H6s=',
    HMAC_key: 'abcdefghijklmnopqrstuvwxyz',
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

  const user3 = await prisma.tbl_users.upsert({
    where: { email: 'user3@catcarwash.com' },
    update: {
      id: 'user-0003',
      fullname: 'นายวิชัย สุขสันต์',
      email: 'user3@catcarwash.com',
      phone: '+66856789012',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '234 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0003',
      fullname: 'นายวิชัย สุขสันต์',
      email: 'user3@catcarwash.com',
      phone: '+66856789012',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '234 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
      payment_info: paymentInfo,
    },
  });

  const user4 = await prisma.tbl_users.upsert({
    where: { email: 'user4@catcarwash.com' },
    update: {
      id: 'user-0004',
      fullname: 'นางสาวมาลัย ดอกไม้',
      email: 'user4@catcarwash.com',
      phone: '+66867890123',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '567/8 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร 10400',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0004',
      fullname: 'นางสาวมาลัย ดอกไม้',
      email: 'user4@catcarwash.com',
      phone: '+66867890123',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '567/8 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพมหานคร 10400',
      payment_info: paymentInfo,
    },
  });

  const user5 = await prisma.tbl_users.upsert({
    where: { email: 'user5@catcarwash.com' },
    update: {
      id: 'user-0005',
      fullname: 'นายประยุทธ์ วีรชน',
      email: 'user5@catcarwash.com',
      phone: '+66878901234',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '890 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0005',
      fullname: 'นายประยุทธ์ วีรชน',
      email: 'user5@catcarwash.com',
      phone: '+66878901234',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '890 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310',
      payment_info: paymentInfo,
    },
  });

  const user6 = await prisma.tbl_users.upsert({
    where: { email: 'user6@catcarwash.com' },
    update: {
      id: 'user-0006',
      fullname: 'นางอรุณี สว่างใจ',
      email: 'user6@catcarwash.com',
      phone: '+66889012345',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '101/5 ถนนวิภาวดี แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0006',
      fullname: 'นางอรุณี สว่างใจ',
      email: 'user6@catcarwash.com',
      phone: '+66889012345',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '101/5 ถนนวิภาวดี แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
      payment_info: paymentInfo,
    },
  });

  const user7 = await prisma.tbl_users.upsert({
    where: { email: 'user7@catcarwash.com' },
    update: {
      id: 'user-0007',
      fullname: 'นายสุรชัย กล้าหาญ',
      email: 'user7@catcarwash.com',
      phone: '+66890123456',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าองค์กร',
      address: '345 ถนนสาทร แขวงยานนาวา เขตสาทร กรุงเทพมหานคร 10120',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0007',
      fullname: 'นายสุรชัย กล้าหาญ',
      email: 'user7@catcarwash.com',
      phone: '+66890123456',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าองค์กร',
      address: '345 ถนนสาทร แขวงยานนาวา เขตสาทร กรุงเทพมหานคร 10120',
      payment_info: paymentInfo,
    },
  });

  const user8 = await prisma.tbl_users.upsert({
    where: { email: 'user8@catcarwash.com' },
    update: {
      id: 'user-0008',
      fullname: 'นางสาวปิยะนุช หวานใจ',
      email: 'user8@catcarwash.com',
      phone: '+66801234567',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '678/12 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0008',
      fullname: 'นางสาวปิยะนุช หวานใจ',
      email: 'user8@catcarwash.com',
      phone: '+66801234567',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '678/12 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240',
      payment_info: paymentInfo,
    },
  });

  const user9 = await prisma.tbl_users.upsert({
    where: { email: 'user9@catcarwash.com' },
    update: {
      id: 'user-0009',
      fullname: 'นายธนา เศรษฐี',
      email: 'user9@catcarwash.com',
      phone: '+66812345670',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '999 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพมหานคร 10250',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0009',
      fullname: 'นายธนา เศรษฐี',
      email: 'user9@catcarwash.com',
      phone: '+66812345670',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '999 ถนนศรีนครินทร์ แขวงหนองบอน เขตประเวศ กรุงเทพมหานคร 10250',
      payment_info: paymentInfo,
    },
  });

  const user10 = await prisma.tbl_users.upsert({
    where: { email: 'user10@catcarwash.com' },
    update: {
      id: 'user-0010',
      fullname: 'นางชนิดา สดใส',
      email: 'user10@catcarwash.com',
      phone: '+66823456701',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '456/7 ถนนงามวงศ์วาน แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0010',
      fullname: 'นางชนิดา สดใส',
      email: 'user10@catcarwash.com',
      phone: '+66823456701',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '456/7 ถนนงามวงศ์วาน แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210',
      payment_info: paymentInfo,
    },
  });

  const user11 = await prisma.tbl_users.upsert({
    where: { email: 'user11@catcarwash.com' },
    update: {
      id: 'user-0011',
      fullname: 'นายณัฐพล เจริญกิจ',
      email: 'user11@catcarwash.com',
      phone: '+66834567012',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าธุรกิจ',
      address: '123 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพมหานคร 10250',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0011',
      fullname: 'นายณัฐพล เจริญกิจ',
      email: 'user11@catcarwash.com',
      phone: '+66834567012',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าธุรกิจ',
      address: '123 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพมหานคร 10250',
      payment_info: paymentInfo,
    },
  });

  const user12 = await prisma.tbl_users.upsert({
    where: { email: 'user12@catcarwash.com' },
    update: {
      id: 'user-0012',
      fullname: 'นางสาวศิริพร แสงทอง',
      email: 'user12@catcarwash.com',
      phone: '+66845670123',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '789 ถนนบางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0012',
      fullname: 'นางสาวศิริพร แสงทอง',
      email: 'user12@catcarwash.com',
      phone: '+66845670123',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '789 ถนนบางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260',
      payment_info: paymentInfo,
    },
  });

  const user13 = await prisma.tbl_users.upsert({
    where: { email: 'user13@catcarwash.com' },
    update: {
      id: 'user-0013',
      fullname: 'นายพิพัฒน์ มั่นคง',
      email: 'user13@catcarwash.com',
      phone: '+66856701234',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '234/9 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0013',
      fullname: 'นายพิพัฒน์ มั่นคง',
      email: 'user13@catcarwash.com',
      phone: '+66856701234',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '234/9 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
      payment_info: paymentInfo,
    },
  });

  const user14 = await prisma.tbl_users.upsert({
    where: { email: 'user14@catcarwash.com' },
    update: {
      id: 'user-0014',
      fullname: 'นางจริยา ยิ้มแย้ม',
      email: 'user14@catcarwash.com',
      phone: '+66867012345',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '567 ถนนอโศก แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0014',
      fullname: 'นางจริยา ยิ้มแย้ม',
      email: 'user14@catcarwash.com',
      phone: '+66867012345',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '567 ถนนอโศก แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110',
      payment_info: paymentInfo,
    },
  });

  const user15 = await prisma.tbl_users.upsert({
    where: { email: 'user15@catcarwash.com' },
    update: {
      id: 'user-0015',
      fullname: 'นายสมบูรณ์ ร่ำรวย',
      email: 'user15@catcarwash.com',
      phone: '+66878123456',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าองค์กร',
      address: '890/11 ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0015',
      fullname: 'นายสมบูรณ์ ร่ำรวย',
      email: 'user15@catcarwash.com',
      phone: '+66878123456',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าองค์กร',
      address: '890/11 ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
      payment_info: paymentInfo,
    },
  });

  const user16 = await prisma.tbl_users.upsert({
    where: { email: 'user16@catcarwash.com' },
    update: {
      id: 'user-0016',
      fullname: 'นางสาวรัตนา มณีดี',
      email: 'user16@catcarwash.com',
      phone: '+66889123450',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '101 ถนนพระราม 2 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร 10150',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0016',
      fullname: 'นางสาวรัตนา มณีดี',
      email: 'user16@catcarwash.com',
      phone: '+66889123450',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '101 ถนนพระราม 2 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร 10150',
      payment_info: paymentInfo,
    },
  });

  const user17 = await prisma.tbl_users.upsert({
    where: { email: 'user17@catcarwash.com' },
    update: {
      id: 'user-0017',
      fullname: 'นายวสันต์ ชาญฉลาด',
      email: 'user17@catcarwash.com',
      phone: '+66890123457',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '345/8 ถนนติวานนท์ แขวงตลาดขวัญ เขตเมืองนนทบุรี นนทบุรี 11000',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0017',
      fullname: 'นายวสันต์ ชาญฉลาด',
      email: 'user17@catcarwash.com',
      phone: '+66890123457',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '345/8 ถนนติวานนท์ แขวงตลาดขวัญ เขตเมืองนนทบุรี นนทบุรี 11000',
      payment_info: paymentInfo,
    },
  });

  const user18 = await prisma.tbl_users.upsert({
    where: { email: 'user18@catcarwash.com' },
    update: {
      id: 'user-0018',
      fullname: 'นางพิมพ์ใจ อารีย์',
      email: 'user18@catcarwash.com',
      phone: '+66801234568',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '678 ถนนบรมราชชนนี แขวงบางบำหรุ เขตบางพลัด กรุงเทพมหานคร 10700',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0018',
      fullname: 'นางพิมพ์ใจ อารีย์',
      email: 'user18@catcarwash.com',
      phone: '+66801234568',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าใหม่',
      address: '678 ถนนบรมราชชนนี แขวงบางบำหรุ เขตบางพลัด กรุงเทพมหานคร 10700',
      payment_info: paymentInfo,
    },
  });

  const user19 = await prisma.tbl_users.upsert({
    where: { email: 'user19@catcarwash.com' },
    update: {
      id: 'user-0019',
      fullname: 'นายอนุชา บุญมี',
      email: 'user19@catcarwash.com',
      phone: '+66812345671',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '999/7 ถนนกาญจนาภิเษก แขวงบางแค เขตบางแค กรุงเทพมหานคร 10160',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0019',
      fullname: 'นายอนุชา บุญมี',
      email: 'user19@catcarwash.com',
      phone: '+66812345671',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้า VIP',
      address: '999/7 ถนนกาญจนาภิเษก แขวงบางแค เขตบางแค กรุงเทพมหานคร 10160',
      payment_info: paymentInfo,
    },
  });

  const user20 = await prisma.tbl_users.upsert({
    where: { email: 'user20@catcarwash.com' },
    update: {
      id: 'user-0020',
      fullname: 'นางสาวสุภาพร แสงเดือน',
      email: 'user20@catcarwash.com',
      phone: '+66823456702',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าธุรกิจ',
      address: '456 ถนนประชาชื่น แขวงตลิ่งชัน เขตตลิ่งชัน กรุงเทพมหานคร 10170',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0020',
      fullname: 'นางสาวสุภาพร แสงเดือน',
      email: 'user20@catcarwash.com',
      phone: '+66823456702',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าธุรกิจ',
      address: '456 ถนนประชาชื่น แขวงตลิ่งชัน เขตตลิ่งชัน กรุงเทพมหานคร 10170',
      payment_info: paymentInfo,
    },
  });

  const user21 = await prisma.tbl_users.upsert({
    where: { email: 'user21@catcarwash.com' },
    update: {
      id: 'user-0021',
      fullname: 'นายธีรพล สุขเกษม',
      email: 'user21@catcarwash.com',
      phone: '+66834567013',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '123/4 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0021',
      fullname: 'นายธีรพล สุขเกษม',
      email: 'user21@catcarwash.com',
      phone: '+66834567013',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าประจำ',
      address: '123/4 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210',
      payment_info: paymentInfo,
    },
  });

  const user22 = await prisma.tbl_users.upsert({
    where: { email: 'user22@catcarwash.com' },
    update: {
      id: 'user-0022',
      fullname: 'นางวรรณา บุญเลิศ',
      email: 'user22@catcarwash.com',
      phone: '+66845670124',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '789/10 ถนนเทพารักษ์ แขวงบางปลา เขตบางพลี สมุทรปราการ 10540',
      payment_info: paymentInfo,
    },
    create: {
      id: 'user-0022',
      fullname: 'นางวรรณา บุญเลิศ',
      email: 'user22@catcarwash.com',
      phone: '+66845670124',
      password: hashedPassword,
      permission_id: userPermission.id,
      status: 'ACTIVE',
      custom_name: 'ลูกค้าทั่วไป',
      address: '789/10 ถนนเทพารักษ์ แขวงบางปลา เขตบางพลี สมุทรปราการ 10540',
      payment_info: paymentInfo,
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
  console.log(`User 3 created with ID: ${user3.id}`);
  console.log(`User 4 created with ID: ${user4.id}`);
  console.log(`User 5 created with ID: ${user5.id}`);
  console.log(`User 6 created with ID: ${user6.id}`);
  console.log(`User 7 created with ID: ${user7.id}`);
  console.log(`User 8 created with ID: ${user8.id}`);
  console.log(`User 9 created with ID: ${user9.id}`);
  console.log(`User 10 created with ID: ${user10.id}`);
  console.log(`User 11 created with ID: ${user11.id}`);
  console.log(`User 12 created with ID: ${user12.id}`);
  console.log(`User 13 created with ID: ${user13.id}`);
  console.log(`User 14 created with ID: ${user14.id}`);
  console.log(`User 15 created with ID: ${user15.id}`);
  console.log(`User 16 created with ID: ${user16.id}`);
  console.log(`User 17 created with ID: ${user17.id}`);
  console.log(`User 18 created with ID: ${user18.id}`);
  console.log(`User 19 created with ID: ${user19.id}`);
  console.log(`User 20 created with ID: ${user20.id}`);
  console.log(`User 21 created with ID: ${user21.id}`);
  console.log(`User 22 created with ID: ${user22.id}`);
  console.log(`Device Initial System User created with ID: ${deviceInitialUser.id}`);
  console.log(`Device Initial System Employee created with ID: ${deviceInitialEmp.id}`);
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
