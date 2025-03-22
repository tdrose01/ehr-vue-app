# Database Schema Documentation

## Overview
The EHR Vue Application uses PostgreSQL as its primary database. This document outlines the database schema, including tables, relationships, and stored procedures.

## Tables

### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### patients
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    contact_number VARCHAR(20),
    email VARCHAR(255),
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
```

### medical_records
```sql
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    provider_id INTEGER REFERENCES users(id),
    record_date TIMESTAMP WITH TIME ZONE NOT NULL,
    record_type VARCHAR(100) NOT NULL,
    description TEXT,
    diagnosis TEXT,
    treatment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_date ON medical_records(record_date);
```

### appointments
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    provider_id INTEGER REFERENCES users(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
```

### medications
```sql
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    prescriber_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medications_patient ON medications(patient_id);
```

## Stored Procedures

### get_patient_records
```sql
CREATE OR REPLACE FUNCTION get_patient_records(
    p_patient_id INTEGER,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    record_id INTEGER,
    record_date TIMESTAMP WITH TIME ZONE,
    record_type VARCHAR(100),
    description TEXT,
    provider_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id,
        mr.record_date,
        mr.record_type,
        mr.description,
        CONCAT(u.first_name, ' ', u.last_name) as provider_name
    FROM medical_records mr
    JOIN users u ON mr.provider_id = u.id
    WHERE mr.patient_id = p_patient_id
    AND (p_start_date IS NULL OR mr.record_date >= p_start_date)
    AND (p_end_date IS NULL OR mr.record_date <= p_end_date)
    ORDER BY mr.record_date DESC;
END;
$$ LANGUAGE plpgsql;
```

### get_upcoming_appointments
```sql
CREATE OR REPLACE FUNCTION get_upcoming_appointments(
    p_provider_id INTEGER DEFAULT NULL,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    appointment_id INTEGER,
    patient_name TEXT,
    appointment_date DATE,
    appointment_time TIME,
    appointment_type VARCHAR(100),
    status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        CONCAT(p.first_name, ' ', p.last_name),
        a.appointment_date,
        a.appointment_time,
        a.appointment_type,
        a.status
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE (p_provider_id IS NULL OR a.provider_id = p_provider_id)
    AND a.appointment_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days)
    ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### update_timestamp
```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_patients_timestamp
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ... (similar triggers for other tables)
```

## Indexes
Important indexes have been created on frequently queried columns and foreign keys to optimize query performance. These include:
- Email lookup for users
- Name and date of birth lookup for patients
- Patient ID and date ranges for medical records
- Date ranges for appointments
- Foreign key relationships

## Backup and Maintenance
Regular maintenance tasks are scheduled using pg_cron:
```sql
-- Daily backup at 2 AM
SELECT cron.schedule('0 2 * * *', 'pg_dump -Fc ehr_db > /backups/ehr_db_$(date +%Y%m%d).dump');

-- Weekly vacuum analyze at 3 AM on Sunday
SELECT cron.schedule('0 3 * * 0', 'VACUUM ANALYZE');
```