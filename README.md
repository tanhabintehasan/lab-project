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
