# Prisma + SQL Migration Guide

> ขั้นตอนแบบเป็นไฟล์ **3 ชุด**: 1) Create base tables → 2) Create partitioned table(s) → 3) Create view
>
> ตัวอย่างนี้ใช้ **PostgreSQL** และ **Prisma** (Node.js)

---

## ✅ Prerequisites

* Node.js 18+
* PostgreSQL 13+
* `psql` CLI (แนะนำ)

```bash
npm i -D prisma
npm i @prisma/client
npx prisma init
```

ตั้งค่าไฟล์ `.env`

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

---

## 📁 โครงสร้างโปรเจกต์ (แนะนำ)

```
project/
 ├─ prisma/
 │   ├─ migrations/                 # โฟลเดอร์ migration ของ Prisma
 │   ├─ raw-sql/                    # เก็บ SQL 3 ขั้นตอน
 │   │   ├─ 01_create_tables.sql
 │   │   ├─ 02_create_partitions.sql
 │   │   └─ 03_create_views.sql
 │   └─ schema.prisma
 └─ README.md
```

> เราจะคุมสคีมาด้วย **raw SQL** แล้วให้ Prisma รู้จักเฉพาะ base tables/views ผ่าน `schema.prisma`

---

## 1) Create Base Tables — `prisma/raw-sql/01_create_tables.sql`

```sql
-- Users & Events (ตัวอย่าง)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  amount NUMERIC(12,2) NOT NULL,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events (user_id);
```

---

## 2) Create Partitioned Table — `prisma/raw-sql/02_create_partitions.sql`

> Prisma ยังไม่รองรับการประกาศ partition โดยตรง เราจะใช้ **native SQL**

```sql
-- ตารางหลักแบบ Partitioned (ตามช่วงเวลา)
CREATE TABLE IF NOT EXISTS event_logs (
  id BIGSERIAL,
  user_id INT,
  amount NUMERIC(12,2),
  event_type TEXT,
  created_at TIMESTAMP NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- ตัวอย่าง: สร้างพาร์ทิชันรายเดือน (สิงหาคม 2025)
CREATE TABLE IF NOT EXISTS event_logs_2025_08
  PARTITION OF event_logs
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- ดัชนีแนะนำ (สร้างบน parent ถ้าเหมาะสม หรือแต่ละ partition ตามเคส)
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs (user_id);
```

> เคล็ดลับ: เขียนสคริปต์ SQL/PLpgSQL เพื่อสร้างพาร์ทิชันล่วงหน้าทุกเดือน (optional)

```sql
-- ฟังก์ชันสร้างพาร์ทิชันรายเดือนอัตโนมัติ (ตัวอย่าง)
CREATE OR REPLACE FUNCTION ensure_event_logs_month(year int, month int) RETURNS void AS $$
DECLARE
  start_date date := make_date(year, month, 1);
  end_date   date := (make_date(year, month, 1) + interval '1 month');
  part_name  text := format('event_logs_%s_%s', year, to_char(start_date, 'MM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF event_logs FOR VALUES FROM (%L) TO (%L);',
    part_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

ใช้ฟังก์ชัน:

```sql
SELECT ensure_event_logs_month(2025, 9);
```

---

## 3) Create Views — `prisma/raw-sql/03_create_views.sql`

```sql
-- มุมมองยอดรวมรายวัน
CREATE OR REPLACE VIEW daily_summary AS
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS total_events,
  SUM(amount) AS total_amount
FROM event_logs
GROUP BY DATE(created_at)
ORDER BY day;

-- มุมมองยอดรวมรายเดือน
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_events,
  SUM(amount) AS total_amount
FROM event_logs
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;

-- (ทางเลือก) Materialized View
-- CREATE MATERIALIZED VIEW mv_monthly_summary AS
-- SELECT DATE_TRUNC('month', created_at) AS month,
--        COUNT(*) AS total_events,
--        SUM(amount) AS total_amount
-- FROM event_logs
-- GROUP BY 1;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_summary;
```

---

## ⚙️ Apply SQL (สองทางเลือก)

### ทางเลือก A: ใช้ `psql` ตรง ๆ (ง่ายและชัดเจน)

```bash
psql "$DATABASE_URL" -f prisma/raw-sql/01_create_tables.sql
psql "$DATABASE_URL" -f prisma/raw-sql/02_create_partitions.sql
psql "$DATABASE_URL" -f prisma/raw-sql/03_create_views.sql
```

### ทางเลือก B: รวมกับ Prisma Migrate (เก็บประวัติการเปลี่ยนแปลง)

1. สร้าง migration ว่าง

```bash
npx prisma migrate dev --create-only --name init_base
```

2. เปิดโฟลเดอร์ที่ Prisma สร้าง เช่น `prisma/migrations/20250829120000_init_base/` แล้ววาง SQL จากไฟล์ `01/02/03` ลงใน `migration.sql` ตามลำดับหรือแยกเป็นหลาย ๆ migration ตามใจเหมาะ

3. รัน

```bash
npx prisma migrate dev
```

> บนเซิร์ฟเวอร์/Production ให้ใช้

```bash
npx prisma migrate deploy
```

---

## 🧩 Prisma Schema (ให้ Prisma รู้จักเฉพาะตารางหลัก/วิว)

`prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id         Int      @id @default(autoincrement())
  email      String   @unique
  created_at DateTime @default(now())
  events     Event[]
}

model Event {
  id         BigInt   @id @default(autoincrement())
  user_id    Int
  amount     Decimal  @db.Decimal(12, 2)
  event_type String
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id])
}
```

> หมายเหตุ
>
> * Prisma ไม่จำเป็นต้องรู้จัก **partitioned parent** แยกต่างหาก ถ้าคุณ query ผ่านวิวหรือผ่านตารางหลักที่ประกาศไว้ในสคีมา
> * ถ้าใช้ **VIEW** กับ Prisma ให้ประกาศเป็น `@@ignore` ในโมเดล (หรือไม่ประกาศในสคีมา) แล้วอ่านด้วย `prisma.$queryRaw` แทนในบางเคสที่ Prisma map ไม่ครบ

ตัวอย่างการใช้ Client:

```ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.user.create({
    data: { email: 'test@example.com' }
  })

  const daily = await prisma.$queryRawUnsafe(
    'SELECT * FROM daily_summary ORDER BY day DESC LIMIT 7'
  )
  console.log(daily)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## 🔁 Working Cycle ที่แนะนำ

1. แก้ SQL ใน `raw-sql` (01 → 02 → 03)
2. ใช้ `psql` ทดสอบบนเครื่อง
3. ย้าย SQL เข้า `prisma/migrations/.../migration.sql`
4. `npx prisma migrate dev` (local) / `npx prisma migrate deploy` (prod)
5. `npx prisma generate` ทุกครั้งที่แก้ `schema.prisma`

---

## 🧠 ข้อควรระวัง & Tips

* ใช้ `IF NOT EXISTS` เพื่อ rerun ได้ปลอดภัยขึ้น
* ตั้ง **PRIMARY KEY** บน parent partitioned table ที่รวมคีย์ช่วง (เช่น `(id, created_at)`) เพื่อหลีกเลี่ยง duplicate keys ข้ามพาร์ทิชัน
* เขียนสคริปต์สร้างพาร์ทิชันล่วงหน้า (รายเดือน/รายวัน) และตั้ง cron ถ้าจำเป็น
* สำหรับ Materialized View ให้ตั้ง `REFRESH MATERIALIZED VIEW CONCURRENTLY ...` ตามรอบเวลา
* อย่าลืมดัชนีที่สอดคล้องกับคิวรีจริง โดยเฉพาะคอลัมน์ที่ใช้ใน `WHERE`/`JOIN`/`ORDER BY`

---

## 🧹 Rollback (อย่างย่อ)

```sql
DROP VIEW IF EXISTS monthly_summary;
DROP VIEW IF EXISTS daily_summary;

-- ระวัง: ลบ partition ก่อน หรือลบ parent พร้อม CASCADE (ขึ้นกับนโยบาย)
-- DROP TABLE IF EXISTS event_logs_2025_08;
-- DROP TABLE IF EXISTS event_logs CASCADE;  -- จะลบลูกทั้งหมด

DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;
```

---

## 📚 อ้างอิงสั้น ๆ

* Prisma Migrate vs db push: ใช้ **migrate** สำหรับการจัดการสคีมาแบบมีประวัติ (Production-ready)
* Partitioning (Postgres): แนะนำให้พาร์ทิชันตามคอลัมน์เวลา + ทำดัชนีที่เหมาะสม

---

> เสร็จแล้ว! คุณสามารถปรับแก้ชื่อคอลัมน์/ดัชนี/พาร์ทิชันให้ตรงกับโดเมนของระบบคุณได้เลย ✨

!(https://mikelopster.dev/posts/next-prisma/)







# Database Seeding

This directory contains the database seeding configuration for the CatCar Wash Service application.

## Seed File

The `seed.ts` file populates the database with:

1. **Permissions**: Creates the three permission types defined in the schema:
   - `ADMIN` - Full administrative access
   - `TECHNICIAN` - Technical staff access
   - `USER` - Regular user access

2. **SuperAdmin Employee**: Creates a default super administrator account with the following credentials:
   - **Email**: `superadmin@catcarwash.com`
   - **Password**: `SuperAdmin123!`
   - **Name**: Super Admin
   - **Permission**: ADMIN
   - **Status**: ACTIVE

## Running the Seed

You can run the seed in two ways:

### Method 1: Using npm script
```bash
npm run db:seed
```

### Method 2: Using Prisma CLI
```bash
npx prisma db seed
```

## Important Notes

- The seed uses `upsert` operations, so it's safe to run multiple times
- The SuperAdmin password is hashed using bcrypt with a salt rounds of 12
- Make sure to change the default SuperAdmin password after the first login
- The seed will create permissions if they don't exist, or update them if they do

## Security

⚠️ **Important**: The default SuperAdmin password (`SuperAdmin123!`) should be changed immediately after the first deployment to production.

## Running Prisma and Restarting TypeScript Server

To ensure your database and TypeScript server are up-to-date, follow these steps:

1. **Run Database Migrations:**
   - **Command:** `npx prisma migrate dev`
   - **Explanation:** คำสั่งนี้ใช้เพื่อสร้างและปรับปรุงโครงสร้างฐานข้อมูลตามที่กำหนดในไฟล์ `schema.prisma` โดยจะสร้างตารางหรือคอลัมน์ใหม่ตามที่ได้กำหนดไว้

2. **Generate Prisma Client:**
   - **Command:** `npx prisma generate`
   - **Explanation:** คำสั่งนี้ใช้เพื่อสร้างโค้ดไคลเอนต์ของ Prisma ที่จะใช้ในการเชื่อมต่อและจัดการฐานข้อมูลในโปรเจกต์ของคุณ

3. **Seed the Database:**
   - **Command:** `npm run db:seed` หรือ `npx prisma db seed`
   - **Explanation:** คำสั่งนี้ใช้เพื่อเติมข้อมูลเริ่มต้นลงในฐานข้อมูล เช่น การสร้างบัญชีผู้ดูแลระบบหรือการตั้งค่าการอนุญาตต่างๆ

4. **Restart TypeScript Server:**
   - **Command:** This step usually involves restarting your development environment or editor. In VSCode, you can do this by opening the command palette (Ctrl+Shift+P) and typing "TypeScript: Restart TS Server".

By following these steps, you ensure that your database is up-to-date and your TypeScript server is running with the latest changes.

## Database Requirements

Make sure your database is migrated and the Prisma client is generated before running the seed:

```bash
npx prisma migrate dev
npx prisma generate
```
