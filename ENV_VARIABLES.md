# Environment Variables Configuration

## Required Variables

### Database (Required)
```env
# Pooled connection for app runtime (pgbouncer)
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"

# Direct connection for migrations (bypass pgbouncer)
DIRECT_DATABASE_URL="postgresql://user:password@host:5432/database"

# Database name
DB_NAME="your_database_name"
```

### Authentication (Required)
```env
# JWT secret for session tokens (minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Encryption key for sensitive data (exactly 32 characters)
ENCRYPTION_KEY="your-32-character-key-for-aes-256"
```

### Application (Required)
```env
# Public app URL (for OAuth callbacks, webhooks, emails)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Optional Variables

### Email Service
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

### SMS Providers (China Market)

#### Aliyun SMS
```env
ALIYUN_ACCESS_KEY="your-access-key"
ALIYUN_ACCESS_SECRET="your-access-secret"
ALIYUN_SMS_SIGN="your-sms-signature"
ALIYUN_SMS_TEMPLATE="SMS_123456789"
```

#### Tencent Cloud SMS
```env
TENCENT_SECRET_ID="your-secret-id"
TENCENT_SECRET_KEY="your-secret-key"
TENCENT_SMS_APP_ID="your-app-id"
TENCENT_SMS_SIGN="your-signature"
TENCENT_SMS_TEMPLATE_ID="123456"
```

## Payment Provider Credentials

**Note:** Payment credentials should be configured via Admin Dashboard, not environment variables.

However, default callback URLs can be set:

```env
# Optional: Override default webhook URLs
WECHAT_PAY_NOTIFY_URL="https://yourdomain.com/api/webhooks/wechat"
ALIPAY_NOTIFY_URL="https://yourdomain.com/api/webhooks/alipay"
```

## Development vs Production

### Local Development (.env.local)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/lab_marketplace"
DIRECT_DATABASE_URL="postgresql://postgres:password@localhost:5432/lab_marketplace"
JWT_SECRET="dev-secret-change-in-production-min-32-chars"
ENCRYPTION_KEY="dev-encryption-key-32-chars-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (Netlify/Vercel)
- Set via platform UI (Netlify Dashboard → Environment Variables)
- Use strong, random secrets
- Never commit production secrets to Git

## Security Best Practices

### Generating Secure Secrets

#### JWT Secret
```bash
openssl rand -base64 48
```

#### Encryption Key (must be exactly 32 characters)
```bash
openssl rand -hex 16
```

#### Or use Node.js
```javascript
const crypto = require('crypto');
console.log('JWT_SECRET:', crypto.randomBytes(48).toString('base64'));
console.log('ENCRYPTION_KEY:', crypto.randomBytes(16).toString('hex'));
```

## Variable Usage in Code

### Server-side (API Routes, Server Components)
```typescript
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
```

### Client-side (Browser)
Only variables prefixed with `NEXT_PUBLIC_` are accessible:
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
```

## Troubleshooting

### "DATABASE_URL not found"
**Solution:** Ensure variable is set in your deployment platform.

### "Prisma migrate fails"
**Solution:** Use `DIRECT_DATABASE_URL` for migrations:
```bash
npx prisma migrate deploy
```

### "Invalid encryption key length"
**Solution:** Encryption key must be exactly 32 characters (for AES-256).

### Changes not reflecting
**Solution:** 
1. Update variables in Netlify/Vercel dashboard
2. Trigger new deployment
3. Clear build cache if needed

## Environment Variable Checklist

Before deploying to production:

- [ ] Strong JWT_SECRET set (48+ random characters)
- [ ] ENCRYPTION_KEY exactly 32 characters
- [ ] DATABASE_URL points to production database
- [ ] DIRECT_DATABASE_URL for migrations
- [ ] NEXT_PUBLIC_APP_URL matches production domain
- [ ] SMTP credentials configured (if using email)
- [ ] SMS credentials configured (if using OTP)
- [ ] No development secrets in production
- [ ] All secrets stored securely (not in codebase)

## Backup .env.example

Keep this file in your repository as template:

```env
# Database
DATABASE_URL=
DIRECT_DATABASE_URL=
DB_NAME=

# Authentication
JWT_SECRET=
ENCRYPTION_KEY=

# Application
NEXT_PUBLIC_APP_URL=

# Email (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# SMS (optional)
ALIYUN_ACCESS_KEY=
ALIYUN_ACCESS_SECRET=
ALIYUN_SMS_SIGN=
ALIYUN_SMS_TEMPLATE=
```

---

**Security Note:** Never commit actual `.env` files to version control. Only commit `.env.example` with placeholder values.
