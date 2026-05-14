-- ============================================================
-- ADDITIONAL INDEXES
-- ============================================================

-- SiteSetting quick lookup (usually single row, but helpful for ordering)
CREATE INDEX "SiteSetting_createdAt_idx" ON "SiteSetting"("createdAt");

-- CMSPage additional search index
CREATE INDEX "CMSPage_titleZh_idx" ON "CMSPage"("titleZh");

-- CMSSection composite for homepage queries
CREATE INDEX "CMSSection_pageKey_idx" ON "CMSSection"("pageKey");
