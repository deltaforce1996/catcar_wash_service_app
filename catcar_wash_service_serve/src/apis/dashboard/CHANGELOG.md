# Dashboard API Changelog

## [2025-08-30] - Data Scope Update

### Changed
- **Monthly Data Scope**: เปลี่ยนจากกรองตามวันที่เฉพาะ เป็นแสดงข้อมูลของทั้งปี
- **Daily Data Scope**: เปลี่ยนจากกรองตามวันที่เฉพาะ เป็นแสดงข้อมูลของทั้งปี
- **Date Filter**: ใช้กับ hourly data เท่านั้น
- **SQL Queries**: ลบ date condition ออกจาก monthly และ daily queries

### Technical Details
- ลบ `buildDateCondition` ออกจาก `getMonthlyRevenue` และ `getDailyRevenue`
- Monthly และ Daily data จะแสดงข้อมูลของทั้งปีเสมอ
- Hourly data ยังคงใช้ date filter เพื่อกรองตามวันที่เฉพาะ

## [2025-08-30] - Complete Range Data & Remove Yearly Data

### Added
- **Complete Range Data**: แสดงข้อมูลครบทุกช่วงเวลา
  - **เดือน**: แสดงข้อมูลครบทุกเดือน (01-12) ถ้าไม่มีข้อมูลจะแสดงเป็น 0
  - **วัน**: แสดงข้อมูลครบทุกวัน (01-31) ถ้าไม่มีข้อมูลจะแสดงเป็น 0
  - **ชั่วโมง**: แสดงข้อมูลครบทุกชั่วโมง (00-23) ถ้าไม่มีข้อมูลจะแสดงเป็น 0
- **Zero Values**: ถ้าไม่มีข้อมูลในช่วงเวลานั้น จะแสดงเป็น 0 เพื่อให้ label ครบถ้วน
- **Improved Data Format**: เปลี่ยนจาก `date` เป็น `month`, `day`, `hour` ในรูปแบบ string ที่มี leading zero

### Changed
- **Removed Yearly Data**: ลบข้อมูลรายปีออกจาก response
- **Data Structure**: เปลี่ยนโครงสร้างข้อมูลจาก `date` เป็น `month`, `day`, `hour`
- **SQL Queries**: ใช้ `generate_series` และ `LEFT JOIN` เพื่อสร้าง complete range
- **Response Format**: อัปเดต response format ให้สอดคล้องกับการเปลี่ยนแปลง

### Technical Details
- ใช้ PostgreSQL `generate_series` function เพื่อสร้าง complete range
- ใช้ `EXTRACT` function เพื่อดึงข้อมูลเดือน วัน และชั่วโมง
- ใช้ `LEFT JOIN` เพื่อรวมข้อมูลที่มีอยู่กับ complete range
- ใช้ `padStart(2, '0')` เพื่อเพิ่ม leading zero

## [2025-08-30] - Hourly Data & Date Filter Change

### Added
- **Hourly Revenue Data**: เพิ่มข้อมูลรายได้รายชั่วโมง
- **Hourly Percentage Change**: คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงรายชั่วโมง
- **New `/summary` Endpoint**: สร้าง endpoint ใหม่สำหรับ dashboard summary
- **DashboardFilterDto**: DTO สำหรับ validation และ transformation ของ filter parameters
- **Complete Filtering System**: ระบบกรองข้อมูลที่ครอบคลุม

### Changed
- **Date Filter**: เปลี่ยนจาก `start_date`/`end_date` range เป็น single `date` parameter
- **Response Format**: ปรับปรุง response format ให้มีโครงสร้างที่ชัดเจน
- **Percentage Change Calculation**: ปรับปรุงการคำนวณเปอร์เซ็นต์การเปลี่ยนแปลง

### Removed
- **`/overview` Endpoint**: ลบ endpoint เดิมออก
- **`getDashboardOverview` Method**: ลบ method เดิมออก
- **Date Range Filtering**: ลบการกรองแบบช่วงเวลาออก

### Technical Details
- ใช้ `$queryRaw` สำหรับ raw SQL queries
- ใช้ materialized views: `mv_device_payments_year`, `mv_device_payments_month`, `mv_device_payments_day`, `mv_device_payments_hour`
- ใช้ `class-validator` และ `class-transformer` สำหรับ validation
- ใช้ `generate_series` สำหรับสร้าง complete range

## [2025-08-30] - Initial Implementation

### Added
- **Dashboard Summary API**: API สำหรับดึงข้อมูลสรุป Dashboard
- **Filtering Capabilities**: สามารถกรองตาม user_id, device_id, status, และ date
- **Percentage Change Calculation**: คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงเทียบกับช่วงเวลาเดียวกันในอดีต
- **Chart Data Support**: สามารถรวมข้อมูลสำหรับแสดงกราฟได้
- **JWT Authentication**: ระบบ authentication (ถูกปิดใช้งานชั่วคราว)

### Features
- **Flexible Filtering**: กรองข้อมูลตาม user_id, device_id, device_status, payment_status, date
- **Multiple Time Periods**: รายได้รายปี รายเดือน รายวัน รายชั่วโมง
- **Percentage Change**: คำนวณการเปลี่ยนแปลงเทียบกับช่วงเวลาเดียวกันในอดีต
- **Chart Data**: ข้อมูลสำหรับแสดงกราฟเมื่อ `include_charts=true`
- **Error Handling**: ระบบจัดการข้อผิดพลาดที่ครอบคลุม

### Technical Stack
- **NestJS**: Framework สำหรับ API
- **Prisma ORM**: Database ORM
- **PostgreSQL**: Database
- **Materialized Views**: สำหรับ aggregated data
- **Class-validator**: Validation
- **Jest**: Unit testing

## [2025-08-30] - Daily Data Scope Fix

### Fixed
- **Daily Data Scope**: แก้ไขให้แสดงข้อมูลของเดือนที่เลือก ไม่ใช่ทั้งปี
- **Daily Revenue**: แก้ไขให้คำนวณยอดรวมของเดือนที่เลือก

### Technical Details
- Daily data ใช้ `buildDateCondition` เพื่อกรองตามเดือนที่เลือก
- แก้ไขปัญหาเดือน 08 มีข้อมูลขายแต่แสดงเป็น 0 ใน daily data
- Daily revenue คำนวณจากข้อมูลของเดือนที่เลือกเท่านั้น

## [2025-08-30] - Daily Revenue Calculation Update
