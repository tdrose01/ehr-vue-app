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

## Development

1. Install dependencies:
```bash
# Frontend
cd ehr-vue-app
npm install

# Backend
cd server
npm install
```

2. Set up environment variables:
```bash
# Create .env file in server directory
cp .env.example .env
```

3. Start development servers:
```bash
# Frontend (default port: 8080)
npm run dev

# Backend (default port: 8002)
cd server
npm run start
```

## API Documentation

The API is available at `http://localhost:8002/api/` with the following endpoints:

- `/api/patients` - Patient management
- `/api/records` - Medical records
- `/api/appointments` - Appointment scheduling
- `/api/dashboard` - Dashboard statistics

## Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd server
npm run test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request