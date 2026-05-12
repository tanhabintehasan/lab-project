-- CreateTable CMSPage
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
    CONSTRAINT "CMSPage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSPage_slug_key" UNIQUE ("slug")
);

CREATE INDEX "CMSPage_slug_idx" ON "CMSPage"("slug");
CREATE INDEX "CMSPage_type_isPublished_idx" ON "CMSPage"("type", "isPublished");

-- CreateTable SiteSetting
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "siteName" TEXT NOT NULL DEFAULT '度量衡科研平台',
    "siteNameEn" TEXT,
    "logoUrl" TEXT,
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

CREATE INDEX "SiteSetting_updatedAt_idx" ON "SiteSetting"("updatedAt");

-- CreateTable CMSSection
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
    "isEnabled" BOOLEAN DEFAULT true NOT NULL,
    "isPublished" BOOLEAN DEFAULT false NOT NULL,
    "sortOrder" INTEGER DEFAULT 0 NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSSection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSSection_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CMSPage"("id") ON DELETE CASCADE
);

CREATE INDEX "CMSSection_pageId_idx" ON "CMSSection"("pageId");
CREATE INDEX "CMSSection_sectionKey_idx" ON "CMSSection"("sectionKey");
CREATE INDEX "CMSSection_pageId_isEnabled_sortOrder_idx" ON "CMSSection"("pageId", "isEnabled", "sortOrder");
CREATE INDEX "CMSSection_isPublished_idx" ON "CMSSection"("isPublished");

-- CreateTable CMSSectionItem
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
    "sortOrder" INTEGER DEFAULT 0 NOT NULL,
    "isEnabled" BOOLEAN DEFAULT true NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSSectionItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CMSSection"("id") ON DELETE CASCADE
);

CREATE INDEX "CMSSectionItem_sectionId_idx" ON "CMSSectionItem"("sectionId");
CREATE INDEX "CMSSectionItem_sectionId_isEnabled_sortOrder_idx" ON "CMSSectionItem"("sectionId", "isEnabled", "sortOrder");

-- CreateTable CMSSectionItemPoint
CREATE TABLE "CMSSectionItemPoint" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "itemId" TEXT NOT NULL,
    "textZh" TEXT NOT NULL,
    "textEn" TEXT,
    "sortOrder" INTEGER DEFAULT 0 NOT NULL,
    "isEnabled" BOOLEAN DEFAULT true NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CMSSectionItemPoint_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CMSSectionItemPoint_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "CMSSectionItem"("id") ON DELETE CASCADE
);

CREATE INDEX "CMSSectionItemPoint_itemId_idx" ON "CMSSectionItemPoint"("itemId");
CREATE INDEX "CMSSectionItemPoint_itemId_isEnabled_sortOrder_idx" ON "CMSSectionItemPoint"("itemId", "isEnabled", "sortOrder");

-- Additional index
CREATE INDEX "SiteSetting_createdAt_idx" ON "SiteSetting"("createdAt");
