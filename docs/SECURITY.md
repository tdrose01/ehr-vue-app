# Security Guide

This document outlines the security measures and best practices implemented in the EHR Vue Application.

## Overview

The EHR Vue Application handles sensitive medical data and must comply with healthcare data protection regulations. This guide covers:

1. Authentication & Authorization
2. Data Protection
3. API Security
4. Database Security
5. Infrastructure Security
6. Compliance & Auditing

## 1. Authentication & Authorization

### JWT Implementation
```typescript
// server/src/middleware/auth.ts
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

### Role-Based Access Control (RBAC)
```typescript
// server/src/middleware/rbac.ts
export const roles = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  PATIENT: 'patient'
}

export const permissions = {
  READ_PATIENT: 'read:patient',
  WRITE_PATIENT: 'write:patient',
  READ_RECORD: 'read:record',
  WRITE_RECORD: 'write:record',
  MANAGE_USERS: 'manage:users'
}

const rolePermissions = {
  [roles.ADMIN]: Object.values(permissions),
  [roles.DOCTOR]: [
    permissions.READ_PATIENT,
    permissions.WRITE_PATIENT,
    permissions.READ_RECORD,
    permissions.WRITE_RECORD
  ],
  [roles.NURSE]: [
    permissions.READ_PATIENT,
    permissions.READ_RECORD,
    permissions.WRITE_RECORD
  ],
  [roles.PATIENT]: [
    permissions.READ_RECORD
  ]
}

export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role
    if (!rolePermissions[userRole]?.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
```

## 2. Data Protection

### Data Encryption
```typescript
// server/src/utils/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

export class Encryption {
  static async encrypt(text: string, key: string): Promise<string> {
    const iv = crypto.randomBytes(IV_LENGTH)
    const salt = crypto.randomBytes(SALT_LENGTH)
    
    const derivedKey = await this.deriveKey(key, salt)
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ])
    
    const tag = cipher.getAuthTag()
    
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64')
  }
  
  static async decrypt(encryptedText: string, key: string): Promise<string> {
    const buffer = Buffer.from(encryptedText, 'base64')
    
    const salt = buffer.slice(0, SALT_LENGTH)
    const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    const derivedKey = await this.deriveKey(key, salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)
    
    return decipher.update(encrypted) + decipher.final('utf8')
  }
  
  private static async deriveKey(key: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(key, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, derivedKey) => {
        if (err) reject(err)
        resolve(derivedKey)
      })
    })
  }
}
```

### Sensitive Data Handling
```typescript
// server/src/models/Patient.ts
import { Encryption } from '../utils/encryption'

export class Patient {
  private static readonly ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY!
  
  static async encrypt(patient: any) {
    return {
      ...patient,
      ssn: await Encryption.encrypt(patient.ssn, this.ENCRYPTION_KEY),
      medicalHistory: await Encryption.encrypt(
        JSON.stringify(patient.medicalHistory),
        this.ENCRYPTION_KEY
      )
    }
  }
  
  static async decrypt(patient: any) {
    return {
      ...patient,
      ssn: await Encryption.decrypt(patient.ssn, this.ENCRYPTION_KEY),
      medicalHistory: JSON.parse(
        await Encryption.decrypt(patient.medicalHistory, this.ENCRYPTION_KEY)
      )
    }
  }
}
```

## 3. API Security

### Request Validation
```typescript
// server/src/middleware/validation.ts
import { body, validationResult } from 'express-validator'

export const validatePatient = [
  body('firstName').trim().notEmpty().escape(),
  body('lastName').trim().notEmpty().escape(),
  body('dateOfBirth').isISO8601(),
  body('ssn').matches(/^\d{3}-\d{2}-\d{4}$/),
  body('email').isEmail().normalizeEmail(),
  
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]
```

### Rate Limiting
```typescript
// server/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import redis from '../config/redis'

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
})

export const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'login-limit:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 login attempts per hour
  message: 'Too many login attempts, please try again later'
})
```

## 4. Database Security

### Connection Pool Configuration
```typescript
// server/src/config/database.ts
import { Pool } from 'pg'

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT
  } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})
```

### SQL Injection Prevention
```typescript
// server/src/services/PatientService.ts
export class PatientService {
  async getPatientRecords(patientId: number, startDate?: Date) {
    const query = {
      text: `
        SELECT * FROM medical_records 
        WHERE patient_id = $1 
        AND ($2::date IS NULL OR record_date >= $2)
        ORDER BY record_date DESC
      `,
      values: [patientId, startDate]
    }
    
    return await pool.query(query)
  }
}
```

## 5. Infrastructure Security

### NGINX Configuration
```nginx
# /etc/nginx/conf.d/security.conf

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
```

### Docker Security
```dockerfile
# Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Start application
CMD ["npm", "start"]
```

## 6. Compliance & Auditing

### Audit Logging
```typescript
// server/src/utils/audit.ts
import winston from 'winston'

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'audit.log' })
  ]
})

export const logAudit = (
  userId: string,
  action: string,
  resource: string,
  details: any
) => {
  auditLogger.info({
    userId,
    action,
    resource,
    details,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  })
}
```

### Data Access Logging
```typescript
// server/src/middleware/accessLog.ts
import { logAudit } from '../utils/audit'

export const logDataAccess = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send
  
  res.send = function(body) {
    logAudit(
      req.user.id,
      'data_access',
      req.path,
      {
        method: req.method,
        query: req.query,
        body: req.body
      }
    )
    
    return originalSend.call(this, body)
  }
  
  next()
}
```

## Security Checklist

### Development
- [ ] Use secure dependency versions
- [ ] Implement input validation
- [ ] Use parameterized queries
- [ ] Encrypt sensitive data
- [ ] Implement proper error handling
- [ ] Use secure session management
- [ ] Implement CSRF protection
- [ ] Use secure password hashing

### Deployment
- [ ] Use HTTPS only
- [ ] Configure security headers
- [ ] Implement rate limiting
- [ ] Set up WAF rules
- [ ] Configure network security
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup encryption keys

### Maintenance
- [ ] Regular security audits
- [ ] Dependency updates
- [ ] Log monitoring
- [ ] Incident response plan
- [ ] Security training
- [ ] Compliance reviews
- [ ] Penetration testing
- [ ] Access review

## Incident Response

1. **Detection**
   - Monitor logs
   - Alert systems
   - User reports

2. **Analysis**
   - Assess impact
   - Identify cause
   - Document findings

3. **Containment**
   - Isolate affected systems
   - Block suspicious activity
   - Preserve evidence

4. **Eradication**
   - Remove threat
   - Patch vulnerabilities
   - Update security measures

5. **Recovery**
   - Restore systems
   - Verify security
   - Resume operations

6. **Post-Incident**
   - Review response
   - Update procedures
   - Implement lessons learned