# Contributing to EHR Vue Application

We love your input! We want to make contributing to the EHR Vue Application as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

1. Install dependencies:
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

2. Set up environment:
```bash
cp .env.example .env
# Configure your environment variables
```

3. Start development servers:
```bash
# Frontend
npm run dev

# Backend
cd server
npm run start
```

## Code Style Guidelines

### Vue Components
- Use composition API
- Keep components focused and single-responsibility
- Use TypeScript for type safety
- Follow Vue.js style guide

### API Endpoints
- Use RESTful conventions
- Include proper error handling
- Document with OpenAPI/Swagger
- Use proper HTTP status codes

### Database
- Use stored procedures for complex queries
- Implement proper indexing
- Follow PostgreSQL best practices
- Use migrations for schema changes

## Testing Guidelines

1. Unit Tests:
```bash
npm run test:unit
```

2. Integration Tests:
```bash
npm run test:integration
```

3. E2E Tests:
```bash
npm run test:e2e
```

### Test Requirements
- Write tests for new features
- Update tests for modified features
- Ensure all tests pass before submitting PR
- Include both positive and negative test cases

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the documentation with details of any API changes
3. The PR will be merged once you have the sign-off of two other developers
4. Use conventional commits format

## Issue Reporting

### Bug Reports
- Use the bug report template
- Include reproduction steps
- Include expected vs actual behavior
- Include screenshots if relevant

### Feature Requests
- Use the feature request template
- Explain the problem you're solving
- Discuss alternatives you've considered
- Include mockups if relevant

## Environment Setup Tips

### Port Management
- Frontend typically uses ports 8080-8085
- Backend uses port 8002
- Clear ports if needed:
```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill node
```

### Database Setup
```sql
-- Create required tables
CREATE TABLE patients (...);
CREATE TABLE records (...);
CREATE TABLE appointments (...);
```

## License
By contributing, you agree that your contributions will be licensed under its MIT License.