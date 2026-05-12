# Laboratory Testing Platform (实验室检测平台)

A comprehensive laboratory marketplace platform built with Next.js 16, React 19, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

> **Database Setup:** See [`database/README.md`](database/README.md) for detailed instructions on fresh installs, migrations, seeds, and backups.

## ✨ Features

- **Service Catalog** - 36+ API endpoints, dynamic filtering
- **Order Management** - Complete 15-state lifecycle
- **Enterprise Portal** - Company management, invitations
- **Payment System** - Stripe/WeChat/Alipay support
- **File Management** - Secure uploads with multiple storage backends
- **Email Notifications** - Automated workflow emails
- **Admin Dashboard** - Finance, translations, referrals

## 📊 Status

- **Production Ready**: ✅ 100%
- **Database Models**: 40+
- **API Endpoints**: 36
- **Pages**: 69
- **Locales**: zh-CN, en

## 🔐 Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Auth secret
- `NEXTAUTH_URL` - Deployment URL
- `NEXT_PUBLIC_SITE_URL` - Public URL

See `.env.example` for complete configuration.

## 📝 Documentation

See full documentation in project wiki.
# lab-project 

src/
├── app/
│   ├── [locale]/
│   │
│   │   # 🌐 PUBLIC WEBSITE
│   │   ├── page.tsx                  # Home
│   │   ├── about/
│   │   ├── contact/
│   │   ├── help/
│   │   ├── privacy/
│   │   ├── terms/
│   │
│   │   # 🔐 AUTH
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │
│   │   # 🧪 SERVICES
│   │   ├── services/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/
│   │   │   ├── categories/
│   │   │   ├── industries/
│   │   │   ├── materials/
│   │   │   └── standards/
│   │
│   │   # ⚙️ EQUIPMENT
│   │   ├── equipment/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/
│   │   │   └── booking/              # 🚨 CREATE
│   │
│   │   # 🏢 LABS / PROVIDERS
│   │   ├── labs/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │
│   │   # 📩 RFQ / REQUIREMENT
│   │   ├── rfq/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │
│   │   # 📄 REPORTS
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │
│   │   # 👤 USER DASHBOARD
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── orders/
│   │   │   ├── reports/
│   │   │   ├── wallet/
│   │   │   ├── referral/
│   │   │   ├── rewards/              # 🚨 CREATE
│   │   │   ├── certificates/         # 🚨 CREATE
│   │   │   ├── samples/
│   │   │   ├── quotations/
│   │   │   ├── messages/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │
│   │   # 🏢 ENTERPRISE
│   │   ├── enterprise/
│   │   │   ├── workspace/
│   │   │   ├── members/
│   │   │   ├── orders/
│   │   │   ├── reports/
│   │   │   ├── wallet/
│   │   │   ├── billing/
│   │   │   └── approvals/
│   │
│   │   # 🔬 LAB PORTAL
│   │   ├── lab-portal/
│   │   │   ├── dashboard/
│   │   │   ├── orders/
│   │   │   ├── samples/
│   │   │   ├── reports/
│   │   │   ├── equipment/
│   │   │   └── rfq/
│   │
│   │   # 🛠️ ADMIN PANEL
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── categories/           # 🚨 CREATE
│   │   │   ├── services/
│   │   │   ├── orders/
│   │   │   ├── reports/
│   │   │   ├── certificates/         # 🚨 CREATE
│   │   │   ├── rewards/              # 🚨 CREATE
│   │   │   ├── users/
│   │   │   ├── labs/
│   │   │   ├── finance/
│   │   │   ├── transactions/
│   │   │   ├── cms/
│   │   │   ├── translations/
│   │   │   └── analytics/
│
│   # 🔌 API ROUTES
│   ├── api/
│   │   ├── auth/
│   │   ├── services/
│   │   ├── equipment/
│   │   ├── orders/
│   │   ├── bookings/                 # 🚨 CREATE
│   │   ├── reports/
│   │   ├── certificates/             # 🚨 CREATE
│   │   ├── rewards/                  # 🚨 CREATE
│   │   ├── wallet/
│   │   ├── enterprise/
│   │   ├── admin/
│   │   ├── uploads/
│   │   └── webhooks/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── admin/
│   └── reports/
│
├── lib/
├── hooks/
├── store/
├── types/
