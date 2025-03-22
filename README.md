# EHR Vue Application

A modern Electronic Health Records (EHR) application built with Vue.js, Express, and PostgreSQL.

## Features

- Patient management with CRUD operations
- Medical records tracking
- Appointment scheduling
- User authentication and authorization
- Real-time updates
- Responsive design

## Tech Stack

- Frontend: Vue.js 3 with Vite
- Backend: Express.js
- Database: PostgreSQL
- Authentication: JWT
- API: RESTful with proper error handling

## Prerequisites

- Node.js v22.14.0 or higher
- PostgreSQL 15.0 or higher
- npm or yarn package manager

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/tdrose01/ehr-vue-app.git
cd ehr-vue-app
```

2. Install dependencies:
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

3. Set up environment variables:
```bash
# Create .env file in server directory
cp .env.example .env

# Add the following variables
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
JWT_SECRET=your_jwt_secret
```

4. Start development servers:
```bash
# Frontend (default port: 8080)
npm run dev

# Backend (default port: 8002)
cd server
npm run start
```

## API Documentation

The API is available at `http://localhost:8002/api/` with the following endpoints:

### Patient Management
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Medical Records
- `GET /api/records` - List all records
- `GET /api/records/:id` - Get record details
- `POST /api/records` - Create new record
- `PUT /api/records/:id` - Update record
- `DELETE /api/records/:id` - Delete record

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Schema

### Patients Table
```sql
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(50),
    status VARCHAR(50),
    contact_info VARCHAR(100),
    service VARCHAR(100),
    rank VARCHAR(50),
    blood_type VARCHAR(10),
    fmpc VARCHAR(50),
    email VARCHAR(100),
    emergency_contact VARCHAR(100),
    emergency_contact_number VARCHAR(100),
    allergies TEXT
);
```

### Records Table
```sql
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    status VARCHAR(50)
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    appointment_date TIMESTAMP,
    description TEXT,
    status VARCHAR(50)
);
```

## Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd server
npm run test

# Run E2E tests with Playwright
npm run test:e2e

# Run specific test suites
npm run test:unit
npm run test:integration
```

## Known Issues

1. Port Conflicts:
   - Frontend dev server may cycle through ports (8080-8085)
   - Backend port 8002 may show EADDRINUSE error
   - Solution: Use `taskkill /F /IM node.exe` to clear ports

2. API Issues:
   - Some endpoints show double `/api` prefix
   - Records API needs patientId column fix

3. Test Failures:
   - UI tests may timeout
   - Add Patient button detection issues
   - Search functionality tests unstable

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Project Status

See our [Project Status Issue](https://github.com/tdrose01/ehr-vue-app/issues/1) for current status and next steps.