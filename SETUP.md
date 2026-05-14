# Setup Guide — Client Handover

## Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)
- SMTP credentials (for email)
- SMS provider credentials (Tencent Cloud SMS recommended)
- Storage provider (AWS S3, Alibaba OSS, or local)

## Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"

# JWT
JWT_SECRET="your-random-secret-min-32-chars"

# Storage
STORAGE_PROVIDER="local" # or "s3", "oss"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_BUCKET=""

# SMS (Tencent Cloud)
TENCENT_SMS_SECRET_ID=""
TENCENT_SMS_SECRET_KEY=""
TENCENT_SMS_SDK_APP_ID=""
TENCENT_SMS_SIGN_NAME=""
TENCENT_SMS_TEMPLATE_ID=""

# Email
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL=""

# Admin (for initial seed)
ADMIN_EMAIL="admin@labtest.com"
ADMIN_PASSWORD="Admin@123456"
```

## Fresh Database Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run db:generate

# 3. Push schema to database
npm run db:push

# 4. Run migrations (if any)
npm run db:migrate:deploy

# 5. Seed with minimal safe data
npm run db:seed

# 6. (Optional) Add demo users for phone login testing
npm run db:seed:demo-login

# 7. Start development
npm run dev
```

## Phone Number Format

All phone numbers are stored in **E.164 format** (`+<country_code><national_number>`).

- China: `+8613800138000`
- The frontend provides a country code selector
- The backend normalizes all inputs before DB queries
- **Never** store raw numbers without country code

## Default Login Credentials

After running `npm run db:seed`:

| Role | Phone | Password |
|------|-------|----------|
| Admin | Use email login or check seed output | `Admin@123456` (or your `ADMIN_PASSWORD`) |

After running `npm run db:seed:demo-login`:

| Phone | Password |
|-------|----------|
| `+8613800000000` | `demo123456` |
| `+8613800000001` | `demo123456` |
| ... | ... |
| `+8613800000007` | `demo123456` |

## Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Database
npm run db:generate        # Generate Prisma Client
npm run db:push            # Push schema changes (dev)
npm run db:migrate         # Create migration (dev)
npm run db:migrate:deploy  # Apply migrations (production)
npm run db:seed            # Safe minimal seed
npm run db:seed:full       # Full demo seed (destructive)
npm run db:reset           # Reset database (dev only)
npm run db:studio          # Open Prisma Studio
```

## Important Notes

1. **Never edit the database directly via SQL.** Always modify `prisma/schema.prisma` and use Prisma migrations.
2. **Prisma schema is the single source of truth.** All SQL files in `database/archive/` and `database/legacy/` are historical reference only.
3. **The primary seed is safe to run multiple times.** It uses `upsert` and will not delete existing data.
4. **The full demo seed (`db:seed:full`) is destructive.** It deletes all existing data before inserting demo content.
5. **Auth tokens are httpOnly cookies.** The JWT is never exposed to client-side JavaScript.
6. **Sessions are validated against the database.** Revoked or expired sessions are rejected even if the JWT signature is valid.

## Troubleshooting

### `PrismaClientValidationError`
Run `npm run db:generate` after any schema change.

### `P3005 Database error`
Database schema has drifted from Prisma. Run:
```bash
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema prisma/schema.prisma --script
```

### Login fails with "手机号或密码错误"
Check the server logs for detailed debug output. Common causes:
- Phone not in E.164 format (must include `+86`)
- User not seeded
- Password hash mismatch

### React `insertBefore` error
This was fixed by aligning `loading.tsx` and `error.tsx` DOM structures and stabilizing post-hydration re-renders. If it recurs, check for:
- Components that return `null` on SSR but render content on client
- Multiple independent `useEffect` fetches that mutate DOM simultaneously
