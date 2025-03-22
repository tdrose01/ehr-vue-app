# Testing Guide

This guide outlines the testing strategy and procedures for the EHR Vue Application.

## Testing Stack

- **Frontend**:
  - Jest for unit testing
  - Vue Test Utils for component testing
  - Cypress for E2E testing
  
- **Backend**:
  - Jest for unit testing
  - Supertest for API testing
  
- **Database**:
  - Test database with sample data
  - Database migration tests

## Test Structure

```
ehr-vue-app/
├── tests/
│   ├── unit/
│   │   ├── components/
│   │   ├── store/
│   │   └── utils/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   └── e2e/
│       ├── specs/
│       └── support/
└── server/
    └── tests/
        ├── unit/
        │   ├── controllers/
        │   ├── services/
        │   └── utils/
        └── integration/
            ├── api/
            └── database/
```

## Running Tests

### Frontend Tests

```bash
# Run all frontend tests
npm run test

# Run unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:open
```

### Backend Tests

```bash
cd server

# Run all backend tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Frontend Unit Tests

Example component test:
```typescript
import { mount } from '@vue/test-utils'
import PatientCard from '@/components/PatientCard.vue'

describe('PatientCard.vue', () => {
  const mockPatient = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01'
  }

  it('renders patient information correctly', () => {
    const wrapper = mount(PatientCard, {
      props: {
        patient: mockPatient
      }
    })

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('1990-01-01')
  })

  it('emits select event when clicked', async () => {
    const wrapper = mount(PatientCard, {
      props: {
        patient: mockPatient
      }
    })

    await wrapper.find('.patient-card').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual([mockPatient.id])
  })
})
```

### Backend Unit Tests

Example service test:
```typescript
import { PatientService } from '@/services/PatientService'
import { mockDb } from '@/tests/mocks/db'

describe('PatientService', () => {
  let patientService: PatientService

  beforeEach(() => {
    patientService = new PatientService(mockDb)
  })

  it('should get patient by id', async () => {
    const patient = await patientService.getById(1)
    expect(patient).toBeDefined()
    expect(patient.id).toBe(1)
  })

  it('should throw error for non-existent patient', async () => {
    await expect(patientService.getById(999))
      .rejects
      .toThrow('Patient not found')
  })
})
```

### API Integration Tests

Example API test:
```typescript
import request from 'supertest'
import app from '@/app'
import { createTestToken } from '@/tests/utils'

describe('Patient API', () => {
  let token: string

  beforeAll(async () => {
    token = await createTestToken('doctor')
  })

  it('should get patient list', async () => {
    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThan(0)
  })

  it('should require authentication', async () => {
    await request(app)
      .get('/api/patients')
      .expect(401)
  })
})
```

### E2E Tests

Example Cypress test:
```typescript
describe('Patient Management', () => {
  beforeEach(() => {
    cy.login('doctor@example.com', 'password123')
  })

  it('should create new patient', () => {
    cy.visit('/patients/new')
    
    cy.get('[data-test="first-name"]').type('Jane')
    cy.get('[data-test="last-name"]').type('Smith')
    cy.get('[data-test="dob"]').type('1985-03-15')
    cy.get('[data-test="gender"]').select('Female')
    
    cy.get('[data-test="submit"]').click()
    
    cy.url().should('include', '/patients/')
    cy.contains('Patient created successfully')
  })

  it('should display validation errors', () => {
    cy.visit('/patients/new')
    cy.get('[data-test="submit"]').click()
    
    cy.get('[data-test="first-name-error"]')
      .should('be.visible')
      .and('contain', 'First name is required')
  })
})
```

## Test Database Setup

1. Create test database:
```bash
createdb ehr_db_test
```

2. Run migrations:
```bash
NODE_ENV=test npm run migrate
```

3. Seed test data:
```bash
NODE_ENV=test npm run seed
```

## Continuous Integration

GitHub Actions workflow for testing:
```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: ehr_db_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm ci
        cd server && npm ci
        
    - name: Run migrations
      run: cd server && NODE_ENV=test npm run migrate
      
    - name: Run frontend tests
      run: npm run test
      
    - name: Run backend tests
      run: cd server && npm run test
      
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Test Coverage Requirements

- Frontend: Minimum 80% coverage
- Backend: Minimum 90% coverage
- E2E: All critical user paths covered

Coverage is checked during CI/CD pipeline and pull request reviews.

## Mocking

### API Mocks
```typescript
// src/tests/mocks/api.ts
export const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}

// Reset mocks between tests
beforeEach(() => {
  Object.values(mockApi).forEach(mock => mock.mockReset())
})
```

### Database Mocks
```typescript
// src/tests/mocks/db.ts
export const mockDb = {
  query: jest.fn(),
  one: jest.fn(),
  many: jest.fn(),
  none: jest.fn()
}
```

## Best Practices

1. **Test Organization**
   - Group related tests together
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Independence**
   - Each test should be independent
   - Clean up after tests
   - Don't rely on test order

3. **Test Data**
   - Use factories for test data
   - Avoid sharing mutable state
   - Use meaningful test data

4. **Assertions**
   - Make assertions specific
   - Test both positive and negative cases
   - Check edge cases

5. **Maintenance**
   - Keep tests simple and readable
   - Update tests when requirements change
   - Remove obsolete tests