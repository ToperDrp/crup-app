-- PostgreSQL Schema for sales_db

-- 1. Create Database (usually done outside the script or with a specific client command)
-- CREATE DATABASE sales_db;

-- 2. Create User 'admin' and set password 'admin'
-- Note: In PostgreSQL, users/roles are global. You might need to connect as a superuser to create roles.
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
      CREATE USER admin WITH PASSWORD 'admin';
   END IF;
END
$do$;

-- 3. Grant privileges to 'admin' user on sales_db
-- You need to connect to sales_db first to grant privileges on tables.
-- GRANT ALL PRIVILEGES ON DATABASE sales_db TO admin;

-- 4. Connect to sales_db (if not already connected)
-- \c sales_db;

-- 5. Create 'users' table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- 6. Create 'sales' table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_date TIMESTAMP NOT NULL,
    table_number INT NOT NULL,
    customer_count INT NOT NULL,
    buffet_type VARCHAR(50) NOT NULL,
    price_per_person INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_amount INT NOT NULL
);

-- 7. Grant privileges on tables to admin user (run after tables are created)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- 8. (Optional) Describe tables (PostgreSQL equivalent)
-- \d sales;
-- \d users;
