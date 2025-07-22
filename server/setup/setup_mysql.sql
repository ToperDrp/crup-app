-- 1. สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS sales_db;

-- 2. สร้างผู้ใช้ 'admin' และกำหนดรหัสผ่าน 'admin'
-- หมายเหตุ: 'localhost' อาจต้องเปลี่ยนเป็น '%' หากคุณต้องการเชื่อมต่อจากเครื่องอื่น
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin';

-- 3. กำหนดสิทธิ์ให้ผู้ใช้ 'admin' สามารถเข้าถึงฐานข้อมูล 'sales_db' ได้ทั้งหมด
GRANT ALL PRIVILEGES ON sales_db.* TO 'admin'@'localhost';

-- 4. รีโหลดสิทธิ์
FLUSH PRIVILEGES;

-- 5. ใช้ฐานข้อมูล sales_db
USE sales_db;

-- 6. สร้างตาราง 'users'
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 7. สร้างตาราง 'sales'
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_date DATETIME NOT NULL,
    table_number INT NOT NULL,
    customer_count INT NOT NULL,
    buffet_type VARCHAR(50) NOT NULL,
    price_per_person INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_amount INT NOT NULL
);

-- 8. (Optional) ตรวจสอบว่าตารางถูกสร้างขึ้นมาแล้ว
DESCRIBE sales;
DESCRIBE users;
