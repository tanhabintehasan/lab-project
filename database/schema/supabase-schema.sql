-- ============================================================
-- Laboratory Testing Platform - Complete Supabase SQL Schema
-- ============================================================
-- Run this ENTIRE script in: Supabase Dashboard > SQL Editor > New Query
-- This creates all tables, enums, indexes.
-- SEED DATA IS SEPARATE — see database/seeds/
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ENUM TYPES
-- ============================================================

CREATE TYPE "UserRole" AS ENUM ('VISITOR', 'CUSTOMER', 'ENTERPRISE_MEMBER', 'LAB_PARTNER', 'TECHNICIAN', 'FINANCE_ADMIN', 'SUPER_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE "CompanyStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "PricingModel" AS ENUM ('FIXED', 'RANGE', 'QUOTE_ONLY', 'TIERED');
CREATE TYPE "RFQStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'INFO_REQUESTED', 'QUOTING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'CONVERTED');
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'REVISED', 'EXPIRED', 'CONVERTED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SAMPLE_PENDING', 'SAMPLE_SHIPPED', 'SAMPLE_RECEIVED', 'SAMPLE_INSPECTED', 'TESTING_IN_PROGRESS', 'TESTING_COMPLETE', 'REPORT_GENERATING', 'REPORT_APPROVED', 'REPORT_DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDING', 'REFUNDED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'REFUND_PENDING', 'REFUNDED');
CREATE TYPE "SampleStatus" AS ENUM ('PENDING_SUBMISSION', 'SHIPPED', 'RECEIVED', 'INSPECTING', 'INSPECTION_PASSED', 'INSPECTION_FAILED', 'TESTING', 'TESTING_COMPLETE', 'STORED', 'RETURNED', 'DISPOSED');
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "LabStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE');
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET', 'WECHAT_PAY', 'ALIPAY', 'BANK_TRANSFER', 'ENTERPRISE_BILLING');
CREATE TYPE "TransactionType" AS ENUM ('RECHARGE', 'PAYMENT', 'REFUND', 'WITHDRAWAL', 'COMMISSION', 'ADJUSTMENT');
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'ORDER', 'QUOTATION', 'SAMPLE', 'REPORT', 'WALLET', 'REFERRAL', 'PROMOTION');
CREATE TYPE "PaymentProviderType" AS ENUM ('WECHAT_PAY', 'ALIPAY', 'UNION_PAY', 'BANK_TRANSFER', 'MANUAL_QR');
CREATE TYPE "ProviderMode" AS ENUM ('SANDBOX', 'LIVE');
CREATE TYPE "IntegrationType" AS ENUM ('SMS', 'EMAIL', 'STORAGE', 'OAUTH', 'CAPTCHA');
CREATE TYPE "CertificateStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "CertificateType" AS ENUM ('TEST_REPORT', 'CALIBRATION', 'MATERIAL_CERT', 'QUALITY_CERT');
CREATE TYPE "CustomTestingStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'QUOTING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- ============================================================
-- STEP 2: CREATE TABLES (in dependency order)
-- ============================================================

-- Base tables (no external FKs)
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Company" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "registrationNo" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "logo" TEXT,
    "businessLicense" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'PENDING',
    "contractPricing" BOOLEAN NOT NULL DEFAULT false,
    "billingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "descZh" TEXT,
    "descEn" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "seoTitleZh" TEXT,
    "seoTitleEn" TEXT,
    "seoDescZh" TEXT,
    "seoDescEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ServiceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL
);

CREATE TABLE "Material" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "descZh" TEXT,
    "descEn" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Industry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "descZh" TEXT,
    "descEn" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestingStandard" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "organization" TEXT,
    "descZh" TEXT,
    "descEn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "TestingStandard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Laboratory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "shortDescZh" TEXT,
    "shortDescEn" TEXT,
    "fullDescZh" TEXT,
    "fullDescEn" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "certifications" JSONB,
    "specialties" JSONB,
    "status" "LabStatus" NOT NULL DEFAULT 'PENDING',
    "rating" DECIMAL(3,2),
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "avgTurnaroundDays" DECIMAL(5,1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Laboratory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceBundle" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "descZh" TEXT,
    "descEn" TEXT,
    "price" DECIMAL(12,2),
    "discount" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ServiceBundle_pkey" PRIMARY KEY ("id")
);

-- Auth / Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "csrfToken" TEXT,
    "csrfTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "OTPCode" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OTPCode_pkey" PRIMARY KEY ("id")
);

-- User related
CREATE TABLE "Address" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "InvoiceProfile" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InvoiceProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InvoiceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Company related
CREATE TABLE "CompanyMembership" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyMembership_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CompanyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "CompanyMembership_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
);

CREATE TABLE "CompanyWallet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "companyId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "frozenAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    CONSTRAINT "CompanyWallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CompanyWallet_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE
);

-- Service catalog
CREATE TABLE "TestingService" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "shortDescZh" TEXT,
    "shortDescEn" TEXT,
    "fullDescZh" TEXT,
    "fullDescEn" TEXT,
    "pricingModel" "PricingModel" NOT NULL DEFAULT 'FIXED',
    "priceMin" DECIMAL(12,2),
    "priceMax" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "turnaroundDays" INTEGER,
    "turnaroundDesc" TEXT,
    "sampleRequirement" TEXT,
    "deliverables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitleZh" TEXT,
    "seoTitleEn" TEXT,
    "seoDescZh" TEXT,
    "seoDescEn" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestingService_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TestingService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id")
);

CREATE TABLE "ServiceMaterial" (
    "serviceId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    CONSTRAINT "ServiceMaterial_pkey" PRIMARY KEY ("serviceId", "materialId"),
    CONSTRAINT "ServiceMaterial_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id") ON DELETE CASCADE,
    CONSTRAINT "ServiceMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE
);

CREATE TABLE "ServiceIndustry" (
    "serviceId" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    CONSTRAINT "ServiceIndustry_pkey" PRIMARY KEY ("serviceId", "industryId"),
    CONSTRAINT "ServiceIndustry_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id") ON DELETE CASCADE,
    CONSTRAINT "ServiceIndustry_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE
);

CREATE TABLE "ServiceStandard" (
    "serviceId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    CONSTRAINT "ServiceStandard_pkey" PRIMARY KEY ("serviceId", "standardId"),
    CONSTRAINT "ServiceStandard_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id") ON DELETE CASCADE,
    CONSTRAINT "ServiceStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "TestingStandard"("id") ON DELETE CASCADE
);

CREATE TABLE "_BundleServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BundleServices_A_fkey" FOREIGN KEY ("A") REFERENCES "ServiceBundle"("id") ON DELETE CASCADE,
    CONSTRAINT "_BundleServices_B_fkey" FOREIGN KEY ("B") REFERENCES "TestingService"("id") ON DELETE CASCADE
);

CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "Favorite_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id") ON DELETE CASCADE
);

-- Laboratory related
CREATE TABLE "LabUser" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "labId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    CONSTRAINT "LabUser_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "LabUser_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Laboratory"("id") ON DELETE CASCADE
);

CREATE TABLE "LabService" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "labId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LabService_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabService_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Laboratory"("id") ON DELETE CASCADE,
    CONSTRAINT "LabService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id") ON DELETE CASCADE
);

CREATE TABLE "LabMedia" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "labId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabMedia_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabMedia_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Laboratory"("id") ON DELETE CASCADE
);

-- RFQ / Quotation / Custom Testing
CREATE TABLE "RFQRequest" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "requestNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "materialDesc" TEXT,
    "productType" TEXT,
    "testingTarget" TEXT,
    "issue" TEXT,
    "standardReq" TEXT,
    "quantity" TEXT,
    "deadline" TIMESTAMP(3),
    "budget" TEXT,
    "notes" TEXT,
    "status" "RFQStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assignedTo" TEXT,
    "assignedLabId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RFQRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
    CONSTRAINT "RFQRequest_assignedLabId_fkey" FOREIGN KEY ("assignedLabId") REFERENCES "Laboratory"("id")
);

CREATE TABLE "RFQFile" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "rfqId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQFile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RFQFile_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQRequest"("id") ON DELETE CASCADE
);

CREATE TABLE "RFQMessage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "rfqId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RFQMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RFQMessage_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQRequest"("id") ON DELETE CASCADE
);

CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "quotationNo" TEXT NOT NULL,
    "rfqId" TEXT,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "termsZh" TEXT,
    "termsEn" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Quotation_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQRequest"("id"),
    CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "QuotationRevision" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "quotationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuotationRevision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE
);

CREATE TABLE "CustomTestingRequest" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "requestNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "sampleName" TEXT,
    "sampleMatrix" TEXT,
    "objective" TEXT,
    "requirements" TEXT,
    "methodology" TEXT,
    "budget" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "deadline" TIMESTAMP(3),
    "status" "CustomTestingStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assignedLabId" TEXT,
    "assignedTo" TEXT,
    "quotationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomTestingRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomTestingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
    CONSTRAINT "CustomTestingRequest_assignedLabId_fkey" FOREIGN KEY ("assignedLabId") REFERENCES "Laboratory"("id"),
    CONSTRAINT "CustomTestingRequest_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id")
);

CREATE TABLE "CustomTestingAttachment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "requestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomTestingAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomTestingAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomTestingRequest"("id") ON DELETE CASCADE
);

CREATE TABLE "CustomTestingMilestone" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "requestId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomTestingMilestone_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomTestingMilestone_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CustomTestingRequest"("id") ON DELETE CASCADE
);

-- Orders
CREATE TABLE "Order" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addressId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "notes" TEXT,
    "assignedLabId" TEXT,
    "assignedTo" TEXT,
    "quotationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
    CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id"),
    CONSTRAINT "Order_assignedLabId_fkey" FOREIGN KEY ("assignedLabId") REFERENCES "Laboratory"("id")
);

CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE,
    CONSTRAINT "OrderItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TestingService"("id")
);

CREATE TABLE "OrderTimeline" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderTimeline_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);

CREATE TABLE "OrderDocument" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderDocument_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE
);

-- Samples
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sampleNo" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "materialType" TEXT,
    "quantity" TEXT,
    "condition" TEXT,
    "status" "SampleStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "trackingNo" TEXT,
    "courier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "receivedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Sample_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id")
);

CREATE TABLE "SamplePhoto" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sampleId" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SamplePhoto_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SamplePhoto_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE CASCADE
);

CREATE TABLE "SampleTimeline" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sampleId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SampleTimeline_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SampleTimeline_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE CASCADE
);

-- Reports
CREATE TABLE "Report" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "reportNo" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summaryZh" TEXT,
    "summaryEn" TEXT,
    "fileUrl" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "watermark" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Report_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id")
);

CREATE TABLE "ReportAttachment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "reportId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReportAttachment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE
);

CREATE TABLE "ReportDownload" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportDownload_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReportDownload_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE,
    CONSTRAINT "ReportDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "ReportShareLink" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "reportId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxViews" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportShareLink_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReportShareLink_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE
);

-- Equipment
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "labId" TEXT,
    "nameZh" TEXT NOT NULL,
    "nameEn" TEXT,
    "model" TEXT,
    "manufacturer" TEXT,
    "descZh" TEXT,
    "descEn" TEXT,
    "specifications" JSONB,
    "certifications" JSONB,
    "images" JSONB,
    "videoUrl" TEXT,
    "usageInstructions" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "bookable" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" DECIMAL(12,2),
    "dailyRate" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Equipment_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Laboratory"("id")
);

CREATE TABLE "EquipmentBooking" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "equipmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingDate" DATE,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "serviceName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalPrice" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentBooking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EquipmentBooking_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id"),
    CONSTRAINT "EquipmentBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "EquipmentSchedule" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "equipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EquipmentSchedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EquipmentSchedule_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE
);

-- Payment provider (must come before Payment)
CREATE TABLE "PaymentProvider" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" "PaymentProviderType" NOT NULL,
    "appId" TEXT,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "privateKey" TEXT,
    "publicKey" TEXT,
    "certSerialNo" TEXT,
    "notifyUrl" TEXT,
    "mode" "ProviderMode" NOT NULL DEFAULT 'SANDBOX',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "qrCodeUrl" TEXT,
    "instructionsZh" TEXT,
    "instructionsEn" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "accountHolder" TEXT,
    "minAmount" DECIMAL(12,2),
    "maxAmount" DECIMAL(12,2),
    "supportedCurrency" TEXT NOT NULL DEFAULT 'CNY',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentProvider_pkey" PRIMARY KEY ("id")
);

-- Wallet / Payment / Invoice
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "frozenAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "walletId" TEXT,
    "companyWalletId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2),
    "description" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id"),
    CONSTRAINT "Transaction_companyWalletId_fkey" FOREIGN KEY ("companyWalletId") REFERENCES "CompanyWallet"("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    "providerId" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionId" TEXT,
    "externalNo" TEXT,
    "notifyData" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id"),
    CONSTRAINT "Payment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "PaymentProvider"("id")
);

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "invoiceNo" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceProfileId" TEXT,
    "type" TEXT NOT NULL DEFAULT '普通发票',
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id"),
    CONSTRAINT "Invoice_invoiceProfileId_fkey" FOREIGN KEY ("invoiceProfileId") REFERENCES "InvoiceProfile"("id")
);

CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "accountInfo" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- Referral / Commission
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Referral" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "referralCodeId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Referral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id"),
    CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id"),
    CONSTRAINT "Referral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id")
);

CREATE TABLE "Commission" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "referralId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Commission_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id")
);

CREATE TABLE "ReferralConfig" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "registrationReward" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "minWithdrawalAmount" DECIMAL(12,2) NOT NULL DEFAULT 100,
    "frozenDays" INTEGER NOT NULL DEFAULT 30,
    "maxTiers" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registrationRedPacketAmount" DECIMAL(12,2) NOT NULL DEFAULT 5,
    "orderRewardRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "paperRewardMaxAmount" DECIMAL(12,2) NOT NULL DEFAULT 5000,
    "promoCopyZh" TEXT,
    "promoCopyEn" TEXT,
    CONSTRAINT "ReferralConfig_pkey" PRIMARY KEY ("id")
);

-- Notification & Messaging
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT,
    "contentZh" TEXT NOT NULL,
    "contentEn" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id")
);

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "participants" JSONB NOT NULL,
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CMS & Content
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "siteName" TEXT NOT NULL DEFAULT '度量衡科研平台',
    "siteNameEn" TEXT,
    "logoUrl" TEXT,
    "logoUploadUrl" TEXT,
    "faviconUrl" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "whatsapp" TEXT,
    "wechat" TEXT,
    "addressZh" TEXT,
    "addressEn" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "youtubeUrl" TEXT,
    "footerTextZh" TEXT,
    "footerTextEn" TEXT,
    "seoTitleZh" TEXT,
    "seoTitleEn" TEXT,
    "seoDescriptionZh" TEXT,
    "seoDescriptionEn" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CMSPage" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "titleEn" TEXT,
    "contentZh" TEXT,
    "contentEn" TEXT,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "metadata" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CMSSection" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "pageId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "name" TEXT,
    "titleZh" TEXT,
    "titleEn" TEXT,
    "subtitleZh" TEXT,
    "subtitleEn" TEXT,
    "descriptionZh" TEXT,
    "descriptionEn" TEXT,
    "badgeZh" TEXT,
    "badgeEn" TEXT,
    "imageUrl" TEXT,
    "imageAltZh" TEXT,
    "imageAltEn" TEXT,
    "layoutType" TEXT,
    "styleVariant" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSSection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id") ON DELETE CASCADE
);

CREATE TABLE "CMSSectionItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sectionId" TEXT NOT NULL,
    "titleZh" TEXT,
    "titleEn" TEXT,
    "subtitleZh" TEXT,
    "subtitleEn" TEXT,
    "descriptionZh" TEXT,
    "descriptionEn" TEXT,
    "imageUrl" TEXT,
    "imageAltZh" TEXT,
    "imageAltEn" TEXT,
    "linkUrl" TEXT,
    "linkLabelZh" TEXT,
    "linkLabelEn" TEXT,
    "icon" TEXT,
    "badgeZh" TEXT,
    "badgeEn" TEXT,
    "value" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSSectionItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CMSSection"("id") ON DELETE CASCADE
);

CREATE TABLE "CMSSectionItemPoint" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "itemId" TEXT NOT NULL,
    "textZh" TEXT NOT NULL,
    "textEn" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSSectionItemPoint_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSSectionItemPoint_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CMSSectionItem"("id") ON DELETE CASCADE
);

CREATE TABLE "Translation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT,
    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id")
);

-- Certificates
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT,
    "backgroundUrl" TEXT,
    "logoUrl" TEXT,
    "signatureName" TEXT,
    "signatureTitle" TEXT,
    "signatureImageUrl" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "certificateNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "reportId" TEXT,
    "templateId" TEXT,
    "type" "CertificateType" NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "previewUrl" TEXT,
    "verificationCode" TEXT,
    "metadata" JSONB,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
    CONSTRAINT "Certificate_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id"),
    CONSTRAINT "Certificate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id"),
    CONSTRAINT "Certificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id")
);

CREATE TABLE "CertificateAttachment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "certificateId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificateAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CertificateAttachment_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE
);

CREATE TABLE "CertificateDownload" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "certificateId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CertificateDownload_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CertificateDownload_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE,
    CONSTRAINT "CertificateDownload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Reward & Integration
CREATE TABLE "RewardApplication" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "proofUrl" TEXT,
    "proofFiles" JSONB,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "rewardAmount" DECIMAL(12,2),
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardApplication_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RewardApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "IntegrationSetting" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "accessKey" TEXT,
    "accessSecret" TEXT,
    "endpoint" TEXT,
    "region" TEXT,
    "bucket" TEXT,
    "config" JSONB,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "mode" "ProviderMode" NOT NULL DEFAULT 'SANDBOX',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("id")
);

-- Rate Limiting
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

-- Technician Task & Audit Log & Webhook
CREATE TABLE "TechnicianTask" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "sampleId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TechnicianTask_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TechnicianTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
);

CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "provider" TEXT NOT NULL,
    "eventType" TEXT,
    "payload" TEXT NOT NULL,
    "signature" TEXT,
    "isVerified" BOOLEAN NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "relatedEntity" TEXT,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- Prisma migration tracking table
CREATE TABLE "_prisma_migrations" (
    "id" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMP(3),
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- STEP 3: CREATE INDEXES
-- ============================================================

-- User & Auth
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");
CREATE INDEX "User_role_idx" ON "User"("role");

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_token_idx" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE INDEX "OTPCode_identifier_type_idx" ON "OTPCode"("identifier", "type");
CREATE INDEX "OTPCode_expiresAt_idx" ON "OTPCode"("expiresAt");

CREATE INDEX "Address_userId_idx" ON "Address"("userId");
CREATE INDEX "InvoiceProfile_userId_idx" ON "InvoiceProfile"("userId");

-- Company
CREATE INDEX "Company_name_idx" ON "Company"("name");
CREATE UNIQUE INDEX "CompanyMembership_userId_key" ON "CompanyMembership"("userId");
CREATE INDEX "CompanyMembership_companyId_idx" ON "CompanyMembership"("companyId");
CREATE UNIQUE INDEX "CompanyWallet_companyId_key" ON "CompanyWallet"("companyId");

-- Service Catalog
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");
CREATE INDEX "ServiceCategory_slug_idx" ON "ServiceCategory"("slug");
CREATE INDEX "ServiceCategory_parentId_idx" ON "ServiceCategory"("parentId");

CREATE UNIQUE INDEX "Material_slug_key" ON "Material"("slug");
CREATE INDEX "Material_slug_idx" ON "Material"("slug");

CREATE UNIQUE INDEX "Industry_slug_key" ON "Industry"("slug");
CREATE INDEX "Industry_slug_idx" ON "Industry"("slug");

CREATE UNIQUE INDEX "TestingStandard_code_key" ON "TestingStandard"("code");
CREATE INDEX "TestingStandard_code_idx" ON "TestingStandard"("code");

CREATE UNIQUE INDEX "TestingService_slug_key" ON "TestingService"("slug");
CREATE INDEX "TestingService_slug_idx" ON "TestingService"("slug");
CREATE INDEX "TestingService_categoryId_idx" ON "TestingService"("categoryId");
CREATE INDEX "TestingService_isActive_isFeatured_idx" ON "TestingService"("isActive", "isFeatured");

CREATE UNIQUE INDEX "ServiceBundle_slug_key" ON "ServiceBundle"("slug");
CREATE UNIQUE INDEX "_BundleServices_AB_unique" ON "_BundleServices"("A", "B");
CREATE INDEX "_BundleServices_B_index" ON "_BundleServices"("B");
CREATE UNIQUE INDEX "Favorite_userId_serviceId_key" ON "Favorite"("userId", "serviceId");

-- Laboratory
CREATE UNIQUE INDEX "Laboratory_slug_key" ON "Laboratory"("slug");
CREATE INDEX "Laboratory_slug_idx" ON "Laboratory"("slug");
CREATE INDEX "Laboratory_status_idx" ON "Laboratory"("status");

CREATE UNIQUE INDEX "LabUser_userId_key" ON "LabUser"("userId");
CREATE INDEX "LabUser_labId_idx" ON "LabUser"("labId");
CREATE UNIQUE INDEX "LabService_labId_serviceId_key" ON "LabService"("labId", "serviceId");
CREATE INDEX "LabMedia_labId_idx" ON "LabMedia"("labId");

-- RFQ / Quotation
CREATE UNIQUE INDEX "RFQRequest_requestNo_key" ON "RFQRequest"("requestNo");
CREATE INDEX "RFQRequest_userId_idx" ON "RFQRequest"("userId");
CREATE INDEX "RFQRequest_status_idx" ON "RFQRequest"("status");
CREATE INDEX "RFQRequest_requestNo_idx" ON "RFQRequest"("requestNo");
CREATE INDEX "RFQFile_rfqId_idx" ON "RFQFile"("rfqId");
CREATE INDEX "RFQMessage_rfqId_idx" ON "RFQMessage"("rfqId");

CREATE UNIQUE INDEX "Quotation_quotationNo_key" ON "Quotation"("quotationNo");
CREATE INDEX "Quotation_rfqId_idx" ON "Quotation"("rfqId");
CREATE INDEX "Quotation_userId_idx" ON "Quotation"("userId");
CREATE INDEX "Quotation_quotationNo_idx" ON "Quotation"("quotationNo");
CREATE INDEX "QuotationRevision_quotationId_idx" ON "QuotationRevision"("quotationId");

CREATE UNIQUE INDEX "CustomTestingRequest_requestNo_key" ON "CustomTestingRequest"("requestNo");
CREATE INDEX "CustomTestingAttachment_requestId_idx" ON "CustomTestingAttachment"("requestId");
CREATE INDEX "CustomTestingMilestone_requestId_idx" ON "CustomTestingMilestone"("requestId");

-- Orders
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_orderNo_idx" ON "Order"("orderNo");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderTimeline_orderId_idx" ON "OrderTimeline"("orderId");
CREATE INDEX "OrderDocument_orderId_idx" ON "OrderDocument"("orderId");

-- Samples
CREATE UNIQUE INDEX "Sample_sampleNo_key" ON "Sample"("sampleNo");
CREATE INDEX "Sample_orderId_idx" ON "Sample"("orderId");
CREATE INDEX "Sample_sampleNo_idx" ON "Sample"("sampleNo");
CREATE INDEX "Sample_status_idx" ON "Sample"("status");
CREATE INDEX "SamplePhoto_sampleId_idx" ON "SamplePhoto"("sampleId");
CREATE INDEX "SampleTimeline_sampleId_idx" ON "SampleTimeline"("sampleId");

-- Reports
CREATE UNIQUE INDEX "Report_reportNo_key" ON "Report"("reportNo");
CREATE INDEX "Report_orderId_idx" ON "Report"("orderId");
CREATE INDEX "Report_reportNo_idx" ON "Report"("reportNo");
CREATE INDEX "ReportAttachment_reportId_idx" ON "ReportAttachment"("reportId");
CREATE INDEX "ReportDownload_reportId_idx" ON "ReportDownload"("reportId");
CREATE UNIQUE INDEX "ReportShareLink_token_key" ON "ReportShareLink"("token");
CREATE INDEX "ReportShareLink_token_idx" ON "ReportShareLink"("token");

-- Equipment
CREATE UNIQUE INDEX "Equipment_slug_key" ON "Equipment"("slug");
CREATE INDEX "Equipment_slug_idx" ON "Equipment"("slug");
CREATE INDEX "Equipment_labId_idx" ON "Equipment"("labId");
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");
CREATE INDEX "EquipmentBooking_equipmentId_idx" ON "EquipmentBooking"("equipmentId");
CREATE INDEX "EquipmentBooking_userId_idx" ON "EquipmentBooking"("userId");
CREATE INDEX "EquipmentSchedule_equipmentId_idx" ON "EquipmentSchedule"("equipmentId");

-- Payment & Wallet
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");
CREATE INDEX "Transaction_companyWalletId_idx" ON "Transaction"("companyWalletId");
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_providerId_idx" ON "Payment"("providerId");
CREATE INDEX "Payment_externalNo_idx" ON "Payment"("externalNo");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE UNIQUE INDEX "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");
CREATE INDEX "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");
CREATE INDEX "PaymentProvider_type_idx" ON "PaymentProvider"("type");
CREATE INDEX "PaymentProvider_isEnabled_idx" ON "PaymentProvider"("isEnabled");
CREATE INDEX "PaymentProvider_displayOrder_idx" ON "PaymentProvider"("displayOrder");

-- Referral
CREATE UNIQUE INDEX "ReferralCode_userId_key" ON "ReferralCode"("userId");
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");
CREATE UNIQUE INDEX "Referral_referredUserId_key" ON "Referral"("referredUserId");
CREATE INDEX "Referral_referrerUserId_idx" ON "Referral"("referrerUserId");
CREATE INDEX "Commission_referralId_idx" ON "Commission"("referralId");
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- Notification & Messaging
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "Conversation_type_referenceId_idx" ON "Conversation"("type", "referenceId");

-- CMS
CREATE INDEX "SiteSetting_updatedAt_idx" ON "SiteSetting"("updatedAt");
CREATE UNIQUE INDEX "CMSPage_slug_key" ON "CMSPage"("slug");
CREATE INDEX "CMSPage_slug_idx" ON "CMSPage"("slug");
CREATE INDEX "CMSPage_type_isPublished_idx" ON "CMSPage"("type", "isPublished");
CREATE INDEX "CMSSection_pageId_idx" ON "CMSSection"("pageId");
CREATE INDEX "CMSSection_sectionKey_idx" ON "CMSSection"("sectionKey");
CREATE INDEX "CMSSection_pageId_isEnabled_sortOrder_idx" ON "CMSSection"("pageId", "isEnabled", "sortOrder");
CREATE INDEX "CMSSection_isPublished_idx" ON "CMSSection"("isPublished");
CREATE INDEX "CMSSectionItem_sectionId_idx" ON "CMSSectionItem"("sectionId");
CREATE INDEX "CMSSectionItem_sectionId_isEnabled_sortOrder_idx" ON "CMSSectionItem"("sectionId", "isEnabled", "sortOrder");
CREATE INDEX "CMSSectionItemPoint_itemId_idx" ON "CMSSectionItemPoint"("itemId");
CREATE INDEX "CMSSectionItemPoint_itemId_isEnabled_sortOrder_idx" ON "CMSSectionItemPoint"("itemId", "isEnabled", "sortOrder");
CREATE UNIQUE INDEX "Translation_key_locale_key" ON "Translation"("key", "locale");
CREATE INDEX "Translation_category_idx" ON "Translation"("category");

-- Certificates
CREATE UNIQUE INDEX "CertificateTemplate_slug_key" ON "CertificateTemplate"("slug");
CREATE UNIQUE INDEX "Certificate_certificateNo_key" ON "Certificate"("certificateNo");
CREATE UNIQUE INDEX "Certificate_verificationCode_key" ON "Certificate"("verificationCode");
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");
CREATE INDEX "CertificateAttachment_certificateId_idx" ON "CertificateAttachment"("certificateId");
CREATE INDEX "CertificateDownload_certificateId_idx" ON "CertificateDownload"("certificateId");

-- Reward / Integration / Rate Limit
CREATE INDEX "RewardApplication_userId_idx" ON "RewardApplication"("userId");
CREATE INDEX "IntegrationSetting_type_idx" ON "IntegrationSetting"("type");
CREATE INDEX "IntegrationSetting_isEnabled_idx" ON "IntegrationSetting"("isEnabled");
CREATE UNIQUE INDEX "RateLimitEntry_key_key" ON "RateLimitEntry"("key");
CREATE INDEX "RateLimitEntry_key_idx" ON "RateLimitEntry"("key");
CREATE INDEX "RateLimitEntry_resetAt_idx" ON "RateLimitEntry"("resetAt");

-- Task / Audit / Webhook
CREATE INDEX "TechnicianTask_userId_status_idx" ON "TechnicianTask"("userId", "status");
CREATE INDEX "TechnicianTask_orderId_idx" ON "TechnicianTask"("orderId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "WebhookLog_provider_idx" ON "WebhookLog"("provider");
CREATE INDEX "WebhookLog_createdAt_idx" ON "WebhookLog"("createdAt");
CREATE INDEX "WebhookLog_relatedEntity_relatedId_idx" ON "WebhookLog"("relatedEntity", "relatedId");
