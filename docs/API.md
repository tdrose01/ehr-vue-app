# API Documentation

## Base URL
```
http://localhost:8002/api
```

## Authentication
All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "email": "string",
    "role": "string"
  }
}
```

### Patients

#### GET /patients
Get list of patients.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for patient name

**Response:**
```json
{
  "data": [
    {
      "id": "number",
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "string",
      "gender": "string",
      "contactNumber": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### GET /patients/:id
Get patient details by ID.

**Response:**
```json
{
  "id": "number",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "string",
  "gender": "string",
  "contactNumber": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  }
}
```

#### POST /patients
Create new patient.

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "string",
  "gender": "string",
  "contactNumber": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  }
}
```

### Medical Records

#### GET /records/:patientId
Get medical records for a patient.

**Query Parameters:**
- `startDate` (optional): Filter records from this date
- `endDate` (optional): Filter records until this date
- `type` (optional): Record type filter

**Response:**
```json
{
  "data": [
    {
      "id": "number",
      "patientId": "number",
      "date": "string",
      "type": "string",
      "description": "string",
      "provider": "string"
    }
  ]
}
```

#### POST /records/:patientId
Add medical record for a patient.

**Request Body:**
```json
{
  "date": "string",
  "type": "string",
  "description": "string",
  "provider": "string",
  "attachments": [
    {
      "name": "string",
      "type": "string",
      "content": "base64string"
    }
  ]
}
```

### Appointments

#### GET /appointments
Get appointments list.

**Query Parameters:**
- `date` (optional): Filter by date
- `patientId` (optional): Filter by patient
- `providerId` (optional): Filter by provider

**Response:**
```json
{
  "data": [
    {
      "id": "number",
      "patientId": "number",
      "providerId": "number",
      "date": "string",
      "time": "string",
      "status": "string",
      "type": "string"
    }
  ]
}
```

#### POST /appointments
Schedule new appointment.

**Request Body:**
```json
{
  "patientId": "number",
  "providerId": "number",
  "date": "string",
  "time": "string",
  "type": "string",
  "notes": "string"
}
```

## Error Responses

All endpoints follow this error response format:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `500`: Internal Server Error

## Rate Limiting
API requests are limited to 100 requests per minute per IP address. Rate limit info is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1616872800
```