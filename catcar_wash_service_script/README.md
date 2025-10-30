# Database Partitioning Scripts

> **สคริปต์สำหรับแปลงและจัดการ Partitioned Tables แบบ 60 วัน**

สคริปต์นี้ใช้สำหรับแปลงตาราง `tbl_devices_events` และ `tbl_devices_state` ให้เป็น **Partitioned Tables** เพื่อเพิ่มประสิทธิภาพในการจัดการข้อมูลขนาดใหญ่และลบข้อมูลเก่าได้ง่าย

---

## 📂 ไฟล์ที่เกี่ยวข้อง

```
catcar_wash_service_app/
├── catcar_wash_service_serve/prisma/migrations/
│   └── 520250829112611_partition_60d_devices_events_states/
│       └── migration.sql                    # Migration สำหรับแปลงตาราง
│
└── catcar_wash_service_script/
    ├── partition_60d_cron.py               # Cron script สร้าง partition ใหม่
    └── README.md                           # เอกสารนี้
```

---

## 🎯 จุดประสงค์

### ปัญหาที่แก้ไข:
- ตารางมีข้อมูลเพิ่มขึ้นเรื่อยๆ ทำให้ query ช้าลง
- การลบข้อมูลเก่าต้องใช้ `DELETE` ซึ่งช้าและกิน resources มาก
- Index ใหญ่เกินไป ทำให้ maintenance ยาก

### วิธีแก้:
- แบ่งตารางเป็น **partitions ละ 60 วัน**
- ลบข้อมูลเก่าได้ด้วยการ `DROP PARTITION` (เร็วกว่า DELETE มาก)
- แต่ละ partition มี index ขนาดเล็กกว่า query เร็วขึ้น
- สามารถ backup/restore แต่ละ partition ได้อิสระ

---

## 🔧 สคริปต์ที่ 1: Migration SQL

### ไฟล์:
```
catcar_wash_service_serve/prisma/migrations/520250829112611_partition_60d_devices_events_states/migration.sql
```

### ทำอะไร:
1. ✅ แปลง `tbl_devices_events` ให้เป็น Partitioned Table
2. ✅ ลบคอลัมน์ `type` ออก (ไม่ใช้งานแล้ว)
3. ✅ สร้าง partitions เริ่มต้นครอบคลุมข้อมูลที่มี + 60 วัน buffer
4. ✅ ตรวจสอบ row count ก่อน-หลัง copy (safety check)
5. ✅ เก็บตารางเดิมไว้เป็น backup (`tbl_devices_events_old`)

### โครงสร้างตารางใหม่:
```sql
CREATE TABLE tbl_devices_events (
  id          TEXT NOT NULL,
  device_id   TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id, created_at),  -- Composite PK รวม partition key
  FOREIGN KEY (device_id) REFERENCES tbl_devices(id)
) PARTITION BY RANGE (created_at);
```

### การตั้งชื่อ Partition:
```
tbl_devices_events_YYYYMMDD_to_YYYYMMDD

ตัวอย่าง:
- tbl_devices_events_20250101_to_20250302  (1 Jan - 2 Mar)
- tbl_devices_events_20250302_to_20250501  (2 Mar - 1 May)
- tbl_devices_events_20250501_to_20250630  (1 May - 30 Jun)
```

---

## 🤖 สคริปต์ที่ 2: Python Cron Job

### ไฟล์:
```
catcar_wash_service_script/partition_60d_cron.py
```

### ทำอะไร:
- รันเป็นประจำ (แนะนำสัปดาห์ละครั้ง)
- ตรวจสอบว่ามี partition ครอบคลุมอีก 365 วันข้างหน้าหรือไม่
- ถ้าไม่ครบ → สร้าง partition ใหม่เพิ่มอัตโนมัติ
- ใช้ advisory lock ป้องกันรันพร้อมกัน (idempotent)

### ตารางที่จัดการ:
- `tbl_devices_state`
- `tbl_devices_events`

---

## 🚀 วิธีการใช้งาน

### ขั้นตอนที่ 1: เตรียมการ

#### 1.1 Backup ฐานข้อมูล (บังคับ)
```bash
# PostgreSQL dump
pg_dump -h <host> -U <user> -d <database> -F c -f backup_before_partition.dump

# หรือ SQL format
pg_dump -h <host> -U <user> -d <database> > backup_before_partition.sql
```

#### 1.2 ตรวจสอบข้อมูลปัจจุบัน
```sql
-- จำนวนแถว
SELECT COUNT(*) FROM tbl_devices_events;

-- ช่วงวันที่
SELECT
  MIN(created_at) as oldest,
  MAX(created_at) as newest,
  COUNT(*) as total_rows
FROM tbl_devices_events;

-- ขนาดตาราง
SELECT
  pg_size_pretty(pg_total_relation_size('tbl_devices_events')) as table_size;
```

---

### ขั้นตอนที่ 2: รัน Migration

#### วิธีที่ 1: ใช้ Prisma (แนะนำ)
```bash
cd catcar_wash_service_serve
npx prisma migrate deploy
```

#### วิธีที่ 2: รัน SQL โดยตรง
```bash
psql -h <host> -U <user> -d <database> -f \
  catcar_wash_service_serve/prisma/migrations/520250829112611_partition_60d_devices_events_states/migration.sql
```

#### สิ่งที่ต้องดูขณะรัน:
```
NOTICE:  === DATA VALIDATION ===
NOTICE:  Old table row count: 1234567
NOTICE:  New table row count: 1234567
NOTICE:  Row count validation PASSED ✓
```

✅ ถ้าเห็น `PASSED ✓` = สำเร็จ
❌ ถ้าเห็น `ERROR: Row count mismatch` = มีปัญหา ต้องตรวจสอบ

---

### ขั้นตอนที่ 3: ตรวจสอบหลัง Migration

#### 3.1 ตรวจสอบว่าตารางเป็น partitioned แล้ว
```sql
SELECT
  c.relname as table_name,
  c.relkind,
  CASE c.relkind
    WHEN 'p' THEN 'Partitioned Table'
    WHEN 'r' THEN 'Regular Table'
  END as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'tbl_devices_events';

-- ผลลัพธ์ควรเป็น: relkind = 'p' (Partitioned Table)
```

#### 3.2 ดูรายการ partitions ที่สร้าง
```sql
SELECT
  child.relname as partition_name,
  pg_get_expr(child.relpartbound, child.oid) as partition_range,
  pg_size_pretty(pg_total_relation_size(child.oid)) as size
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'tbl_devices_events'
ORDER BY child.relname;
```

#### 3.3 ตรวจนับแถวอีกครั้ง
```sql
-- ตารางหลัก (ควรเท่าเดิม)
SELECT COUNT(*) FROM tbl_devices_events;

-- ตารางสำรอง (ควรเท่าเดิม)
SELECT COUNT(*) FROM tbl_devices_events_old;
```

#### 3.4 ทดสอบ Query
```sql
-- ทดสอบ SELECT
SELECT * FROM tbl_devices_events ORDER BY created_at DESC LIMIT 10;

-- ทดสอบ INSERT
INSERT INTO tbl_devices_events (id, device_id, payload, created_at)
VALUES ('test-id-001', '<device-id>', '{"test": true}', NOW());

-- ทดสอบ UPDATE
UPDATE tbl_devices_events SET payload = '{"updated": true}' WHERE id = 'test-id-001';

-- ทดสอบ DELETE
DELETE FROM tbl_devices_events WHERE id = 'test-id-001';
```

---

### ขั้นตอนที่ 4: ตั้งค่า Cron Job

#### 4.1 ติดตั้ง Dependencies
```bash
pip install psycopg2-binary
```

#### 4.2 ตั้งค่า Environment Variables
```bash
# Option 1: ใช้ DATABASE_URL
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Option 2: ใช้ individual variables
export PGHOST="localhost"
export PGPORT="5432"
export PGUSER="postgres"
export PGPASSWORD="your-password"
export PGDATABASE="catcar_wash_db"
```

#### 4.3 ทดสอบรัน Python Script ด้วยมือ
```bash
cd catcar_wash_service_script
python3 partition_60d_cron.py
```

**ผลลัพธ์ที่คาดหวัง:**
```
Partitions ensured: tbl_devices_state_20250630_to_20250829, tbl_devices_events_20250630_to_20250829
```

#### 4.4 เพิ่มใน Crontab (รันทุกวันจันทร์ 3:00 น.)
```bash
crontab -e
```

เพิ่มบรรทัด:
```cron
# สร้าง partition ใหม่ทุกวันจันทร์ 3:00 AM
0 3 * * 1 cd /path/to/catcar_wash_service_script && /usr/bin/python3 partition_60d_cron.py >> /var/log/partition_cron.log 2>&1
```

#### 4.5 หรือใช้ systemd timer (Linux)
สร้าง `/etc/systemd/system/partition-cron.service`:
```ini
[Unit]
Description=Create next partitions for devices tables

[Service]
Type=oneshot
Environment="DATABASE_URL=postgresql://user:pass@host:5432/db"
WorkingDirectory=/path/to/catcar_wash_service_script
ExecStart=/usr/bin/python3 partition_60d_cron.py
User=postgres
StandardOutput=journal
StandardError=journal
```

สร้าง `/etc/systemd/system/partition-cron.timer`:
```ini
[Unit]
Description=Run partition creation weekly

[Timer]
OnCalendar=Mon *-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl enable partition-cron.timer
sudo systemctl start partition-cron.timer
```

---

## 🗑️ การลบข้อมูลเก่า

### ลบ Partition เก่า (เร็วกว่า DELETE มาก)
```sql
-- ดูรายการ partitions ทั้งหมด
SELECT
  child.relname as partition_name,
  pg_get_expr(child.relpartbound, child.oid) as date_range
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'tbl_devices_events'
ORDER BY child.relname;

-- ลบ partition เก่า (ตัวอย่าง: ข้อมูลปี 2024)
DROP TABLE IF EXISTS tbl_devices_events_20240101_to_20240302;
DROP TABLE IF EXISTS tbl_devices_events_20240302_to_20240501;
-- ... เป็นต้น
```

### หรือใช้ Script อัตโนมัติ:
```sql
-- ลบ partitions เก่ากว่า 1 ปี
DO $$
DECLARE
  part_name TEXT;
  cutoff_date DATE := CURRENT_DATE - INTERVAL '365 days';
BEGIN
  FOR part_name IN
    SELECT child.relname
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    WHERE parent.relname = 'tbl_devices_events'
      AND to_date(substring(child.relname from '_(\d{8})_to_'), 'YYYYMMDD') < cutoff_date
  LOOP
    RAISE NOTICE 'Dropping old partition: %', part_name;
    EXECUTE format('DROP TABLE IF EXISTS %I', part_name);
  END LOOP;
END$$;
```

---

## 🛡️ Rollback (กรณีมีปัญหา)

### ถ้า Migration ล้มเหลว:

#### Scenario 1: Error ก่อน Table Swap
```sql
-- ไม่ต้องทำอะไร migration จะ rollback เอง
-- ตารางเดิมยังใช้งานได้ปกติ
```

#### Scenario 2: Error หลัง Table Swap (ตารางถูกสลับแล้ว)
```sql
BEGIN;
  -- สลับกลับ
  ALTER TABLE tbl_devices_events RENAME TO tbl_devices_events_partitioned;
  ALTER TABLE tbl_devices_events_old RENAME TO tbl_devices_events;

  -- เช็คว่าทำงานได้
  SELECT COUNT(*) FROM tbl_devices_events;
COMMIT;

-- ลบตารางใหม่ที่ไม่ใช้แล้ว (ถ้าต้องการ)
-- DROP TABLE IF EXISTS tbl_devices_events_partitioned CASCADE;
```

#### Scenario 3: ต้องการกลับไปใช้ตารางเดิม (หลังใช้งานไปแล้ว)
```sql
-- ⚠️ ข้อมูลใหม่ที่เพิ่มหลัง migration จะหายไป!
BEGIN;
  DROP TABLE IF EXISTS tbl_devices_events CASCADE;
  ALTER TABLE tbl_devices_events_old RENAME TO tbl_devices_events;

  -- สร้าง indexes กลับมา
  CREATE INDEX tbl_devices_events_device_id_idx ON tbl_devices_events(device_id);
  CREATE INDEX tbl_devices_events_created_at_idx ON tbl_devices_events(created_at);
COMMIT;
```

---

## ⚠️ ข้อควรระวัง

### 1. **Primary Key ต้องรวม Partition Key**
```sql
-- ✅ ถูกต้อง
PRIMARY KEY (id, created_at)

-- ❌ ผิด - จะ error!
PRIMARY KEY (id)
```

### 2. **Foreign Key จากตารางอื่น**
ตารางอื่นที่มี FK มาที่ `tbl_devices_events` ยังทำงานปกติ PostgreSQL จัดการให้อัตโนมัติ

### 3. **Query ที่ไม่มี created_at filter**
```sql
-- ⚠️ ช้า - scan ทุก partition
SELECT * FROM tbl_devices_events WHERE device_id = 'xxx';

-- ✅ เร็ว - scan เฉพาะ partition ที่เกี่ยวข้อง
SELECT * FROM tbl_devices_events
WHERE device_id = 'xxx'
  AND created_at >= '2025-01-01'
  AND created_at < '2025-02-01';
```

### 4. **Application Code ไม่ต้องแก้ไข**
ใช้งานตารางได้เหมือนเดิม PostgreSQL จัดการ routing ไปยัง partition ที่ถูกต้องอัตโนมัติ

### 5. **ตารางสำรอง (_old) กิน Disk Space**
```sql
-- เช็คขนาด
SELECT
  pg_size_pretty(pg_total_relation_size('tbl_devices_events_old')) as backup_size;

-- ลบเมื่อแน่ใจแล้ว (หลัง 30-90 วัน)
DROP TABLE IF EXISTS tbl_devices_events_old;
```

---

## 📊 Performance Tips

### 1. **Enable partition pruning (default on PostgreSQL 11+)**
```sql
SHOW enable_partition_pruning;  -- ควรเป็น 'on'
```

### 2. **EXPLAIN ANALYZE เพื่อดูว่า scan partition ไหนบ้าง**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM tbl_devices_events
WHERE created_at >= '2025-01-01' AND created_at < '2025-02-01';
```

### 3. **Index ใน Partition**
แต่ละ partition มี index ของตัวเอง:
- `{partition}_created_at_idx`
- `{partition}_dev_created_idx`

### 4. **Vacuum และ Analyze**
```sql
-- รันเป็นประจำ (PostgreSQL auto-vacuum จัดการให้)
VACUUM ANALYZE tbl_devices_events;
```

---

## 🔍 Monitoring และ Troubleshooting

### ตรวจสอบ Partition Coverage
```sql
SELECT
  child.relname as partition,
  pg_get_expr(child.relpartbound, child.oid) as range,
  (SELECT COUNT(*) FROM pg_catalog.pg_class c2 WHERE c2.oid = child.oid AND c2.reltuples > 0) > 0 as has_data
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'tbl_devices_events'
ORDER BY child.relname DESC
LIMIT 10;
```

### ตรวจสอบ Partition ล่าสุด
```sql
SELECT
  child.relname,
  substring(child.relname from '_to_(\d{8})$') as end_date
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'tbl_devices_events'
ORDER BY end_date DESC
LIMIT 1;
```

### Log Monitoring
```bash
# ดู cron log
tail -f /var/log/partition_cron.log

# ดู PostgreSQL log
tail -f /var/log/postgresql/postgresql-*.log | grep partition
```

---

## 📝 Checklist สำหรับ Production

- [ ] Backup ฐานข้อมูลเรียบร้อย
- [ ] ทดสอบ migration ใน staging environment
- [ ] แจ้ง downtime window (migration ใช้เวลา ~1-5 นาที ขึ้นกับขนาดข้อมูล)
- [ ] ตรวจสอบ disk space เพียงพอ (ต้องการพื้นที่ประมาณ 2x ของตารางเดิม)
- [ ] รัน migration ในช่วงที่ traffic น้อย
- [ ] ตรวจสอบ application logs หลัง migration
- [ ] Monitor query performance ใน 24-48 ชั่วโมงแรก
- [ ] ตั้ง cron job สำหรับสร้าง partition ใหม่
- [ ] วางแผนการลบ partition เก่า (retention policy)
- [ ] เก็บตาราง _old ไว้ 30-90 วัน ก่อนลบ

---

## 🆘 การขอความช่วยเหลือ

หากพบปัญหา:

1. เช็ค PostgreSQL logs
2. รัน validation queries ด้านบน
3. ติดต่อทีม DevOps/DBA
4. เตรียมข้อมูล:
   - Error messages
   - Migration output
   - `SELECT version();` (PostgreSQL version)
   - Table sizes และ row counts

---

## 📚 อ้างอิง

- [PostgreSQL Partitioning Documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Table Partitioning Best Practices](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITIONING-OVERVIEW)
- [Partition Pruning](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITION-PRUNING)

---

**เอกสารนี้สร้างโดย:** Claude Code
**วันที่อัพเดทล่าสุด:** 2025-10-30
**เวอร์ชัน:** 1.0
