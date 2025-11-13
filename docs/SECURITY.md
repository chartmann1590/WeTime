# WeTime Security Documentation

## Overview

This document outlines security measures, best practices, and potential vulnerabilities in the WeTime application.

## Authentication & Authorization

### Password Security

**Hashing:**
- Passwords hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- Hashes cannot be reversed

**Password Requirements:**
- Minimum 8 characters (enforced in frontend)
- No maximum length (handled by bcrypt)
- No complexity requirements (user choice)

**Recommendations:**
- Consider adding password strength meter
- Consider requiring complexity (uppercase, lowercase, numbers, symbols)
- Consider password history to prevent reuse

### JWT Tokens

**Token Storage:**
- Stored in HttpOnly cookies (prevents XSS access)
- Secure flag enabled (HTTPS only)
- SameSite=Lax (CSRF protection)

**Token Expiration:**
- 7 days validity
- No refresh token mechanism
- User must re-authenticate after expiration

**Token Payload:**
```typescript
{
  userId: string,
  email: string,
  exp: number  // Expiration timestamp
}
```

**Recommendations:**
- Consider shorter expiration (24 hours)
- Implement refresh tokens
- Add token revocation mechanism

### Session Management

**Current Implementation:**
- Stateless (JWT in cookie)
- No server-side session storage
- Logout clears cookie only

**Recommendations:**
- Consider server-side session store (Redis)
- Implement session timeout
- Track active sessions per user

---

## Data Protection

### Encryption at Rest

**Database:**
- PostgreSQL data encrypted if filesystem encryption enabled
- No application-level encryption for most data
- SMTP passwords encrypted using AES-256

**SMTP Password Encryption:**
- Encrypted before storage
- Decrypted only when sending emails
- Uses `crypto` module (Node.js)

**Recommendations:**
- Enable PostgreSQL encryption at rest
- Consider encrypting sensitive fields (descriptions, locations)
- Use key management service (AWS KMS, etc.)

### Encryption in Transit

**HTTPS/TLS:**
- All traffic encrypted via nginx
- Self-signed certificates (development)
- Production should use valid certificates (Let's Encrypt, etc.)

**Database Connections:**
- Currently unencrypted (internal network)
- Consider enabling SSL for database connections

**Recommendations:**
- Use valid SSL certificates in production
- Enable PostgreSQL SSL connections
- Enforce HTTPS (redirect HTTP)

---

## Input Validation

### API Validation

**Current Implementation:**
- Zod schemas for request validation
- Type checking via TypeScript
- Prisma type safety

**Validated Inputs:**
- Email format
- URL format (for ICS URLs)
- Date formats (ISO 8601)
- String lengths

**Recommendations:**
- Add rate limiting per endpoint
- Sanitize user input (prevent XSS)
- Validate file uploads (size, type)
- Add request size limits

### SQL Injection

**Protection:**
- Prisma ORM uses parameterized queries
- No raw SQL queries
- Type-safe database access

**Status:** ✅ Protected

### XSS (Cross-Site Scripting)

**Protection:**
- React automatically escapes content
- No `dangerouslySetInnerHTML` usage
- Content Security Policy (CSP) headers

**Recommendations:**
- Add CSP headers in nginx
- Sanitize user-generated content
- Validate and escape all outputs

---

## CSRF Protection

### Current Implementation

**CSRF Tokens:**
- Tokens generated per request
- Validated on mutating operations
- Stored in session/cookie

**Protected Operations:**
- POST, PATCH, DELETE requests
- GET requests are safe (idempotent)

**Status:** ✅ Implemented

---

## Rate Limiting

### Current Implementation

**Basic Rate Limiting:**
- Per-IP limits on authentication
- Per-user limits on operations
- Implementation in `apps/backend/src/lib/rate-limit.ts`

**Limits:**
- Login: 5 attempts per 15 minutes per IP
- Signup: 3 attempts per hour per IP
- General API: Varies by endpoint

**Recommendations:**
- Use Redis for distributed rate limiting
- Implement sliding window algorithm
- Add rate limit headers to responses
- Consider per-user limits (not just IP)

---

## File Upload Security

### ICS Import

**Current Implementation:**
- Accepts `.ics` files only
- No file size limit (should add)
- Parsed server-side

**Vulnerabilities:**
- No file size validation
- No content-type validation
- Potential DoS via large files

**Recommendations:**
- Add file size limit (e.g., 10MB)
- Validate file content (not just extension)
- Scan for malicious content
- Store uploads outside web root

---

## External Calendar Sync

### Security Considerations

**ICS URL Fetching:**
- Fetches from external URLs
- No validation of URL source
- Potential SSRF (Server-Side Request Forgery)

**Vulnerabilities:**
- Could fetch internal network resources
- Could be used for port scanning
- No URL whitelist/blacklist

**Recommendations:**
- Validate URLs (whitelist domains)
- Block private IP ranges (10.x, 192.168.x, etc.)
- Add timeout for external requests
- Limit redirects
- Use request library with security features

---

## Email Security

### SMTP Configuration

**Current Implementation:**
- User-configured SMTP settings
- Passwords encrypted at rest
- No validation of SMTP credentials

**Vulnerabilities:**
- Users could configure malicious SMTP servers
- No email content validation
- Potential for spam/abuse

**Recommendations:**
- Validate SMTP server on save
- Rate limit email sending
- Add email content sanitization
- Consider using trusted email service (SendGrid, etc.)

---

## Admin Panel Security

### Access Control

**Current Implementation:**
- `isAdmin` flag in User model
- Middleware checks admin status
- Admin-only endpoints

**Protection:**
- All admin endpoints require authentication
- Admin check in `requireAdmin()` function
- No privilege escalation vulnerabilities found

**Recommendations:**
- Add audit logging for admin actions
- Implement role-based access control (RBAC)
- Add 2FA for admin accounts
- Regular security audits

---

## API Security

### Endpoint Protection

**Authentication:**
- All endpoints (except auth) require JWT
- `getUserFromRequest()` validates token
- Returns 401 if invalid/missing

**Authorization:**
- Users can only access their own data
- Couple members share calendars
- Admin can access all data

**Status:** ✅ Protected

### Error Handling

**Current Implementation:**
- Generic error messages to users
- Detailed errors in server logs
- No information leakage

**Recommendations:**
- Standardize error responses
- Log security-related errors
- Monitor for suspicious activity

---

## Infrastructure Security

### Docker Security

**Current Setup:**
- Services run in Docker containers
- Network isolation via Docker network
- No root user in containers (should verify)

**Recommendations:**
- Run containers as non-root user
- Use minimal base images
- Regularly update base images
- Scan images for vulnerabilities

### Network Security

**Current Setup:**
- Services on internal network
- Only nginx exposed to internet
- Database not exposed

**Recommendations:**
- Use firewall rules
- Implement network policies
- Monitor network traffic
- Use VPN for admin access

---

## Security Headers

### Nginx Configuration

**Current Headers:**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)

**Recommendations:**
- Add Content-Security-Policy (CSP)
- Add Referrer-Policy
- Add Permissions-Policy
- Add X-Permitted-Cross-Domain-Policies

---

## Vulnerability Management

### Dependency Security

**Current Tools:**
- pnpm for package management
- No automated vulnerability scanning

**Recommendations:**
- Use `pnpm audit` regularly
- Integrate Dependabot or Snyk
- Keep dependencies updated
- Review security advisories

### Security Updates

**Process:**
1. Monitor security advisories
2. Test updates in development
3. Deploy to production
4. Verify functionality

**Recommendations:**
- Automated dependency updates (minor/patch)
- Regular security audits
- Penetration testing
- Bug bounty program (if applicable)

---

## Logging & Monitoring

### Current Implementation

**Logging:**
- Console logging in all services
- Docker logs accessible
- No centralized logging

**Recommendations:**
- Structured logging (JSON format)
- Log aggregation (ELK, Loki)
- Security event logging
- Alert on suspicious activity

### Monitoring

**Current State:**
- No application monitoring
- No error tracking
- No performance monitoring

**Recommendations:**
- Add error tracking (Sentry)
- Add performance monitoring (APM)
- Add uptime monitoring
- Monitor authentication failures

---

## Compliance

### Data Privacy

**Current State:**
- No explicit privacy policy
- No GDPR compliance measures
- No data export/deletion features

**Recommendations:**
- Add privacy policy
- Implement GDPR compliance:
  - Right to access
  - Right to deletion
  - Data export
  - Consent management
- Add terms of service

### Data Retention

**Current State:**
- No data retention policy
- Data kept indefinitely
- No automatic cleanup

**Recommendations:**
- Define retention periods
- Implement data archival
- Add data deletion policies
- Regular data cleanup

---

## Security Best Practices

### For Developers

1. **Never commit secrets:**
   - Use `.env` files (in `.gitignore`)
   - Use environment variables
   - Rotate secrets regularly

2. **Validate all input:**
   - Use Zod schemas
   - Sanitize user content
   - Validate file uploads

3. **Use parameterized queries:**
   - Always use Prisma (no raw SQL)
   - Type-safe database access

4. **Keep dependencies updated:**
   - Regular `pnpm audit`
   - Update security patches promptly

5. **Follow principle of least privilege:**
   - Users see only their data
   - Admin access only when needed

### For Administrators

1. **Use strong passwords:**
   - Complex passwords
   - Unique per service
   - Use password manager

2. **Enable 2FA:**
   - For admin accounts
   - For email accounts

3. **Regular backups:**
   - Automated backups
   - Test restore procedures
   - Off-site backup storage

4. **Monitor logs:**
   - Review access logs
   - Check for anomalies
   - Alert on security events

5. **Keep systems updated:**
   - OS updates
   - Docker updates
   - Application updates

---

## Incident Response

### Security Incident Procedure

1. **Identify:**
   - Detect security issue
   - Assess severity
   - Document details

2. **Contain:**
   - Isolate affected systems
   - Block malicious traffic
   - Preserve evidence

3. **Eradicate:**
   - Remove threat
   - Patch vulnerabilities
   - Update security measures

4. **Recover:**
   - Restore from backups
   - Verify functionality
   - Monitor for recurrence

5. **Post-Incident:**
   - Document incident
   - Review procedures
   - Update security measures

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] Strong passwords configured
- [ ] SSL certificates valid
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] Error handling secure
- [ ] Dependencies updated
- [ ] Security audit completed

### Regular Maintenance

- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Security audit quarterly
- [ ] Backup verification monthly
- [ ] Penetration testing annually

---

## Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js Security**: https://nodejs.org/en/docs/guides/security/
- **Next.js Security**: https://nextjs.org/docs/advanced-features/security-headers
- **Prisma Security**: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management




