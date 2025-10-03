-- Database initialization script for CatCar Wash Service
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create additional schemas if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Set timezone
SET timezone = 'UTC';

-- Create any initial tables or data here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE catcar_wash_db TO catcar_wash_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO catcar_wash_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO catcar_wash_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO catcar_wash_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO catcar_wash_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO catcar_wash_user;
