-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS 
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
 language 'plpgsql';

DROP TRIGGER IF EXISTS trg_update_User_updatedAt ON "User";
CREATE TRIGGER trg_update_User_updatedAt
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Company_updatedAt ON "Company";
CREATE TRIGGER trg_update_Company_updatedAt
    BEFORE UPDATE ON "Company"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_ServiceCategory_updatedAt ON "ServiceCategory";
CREATE TRIGGER trg_update_ServiceCategory_updatedAt
    BEFORE UPDATE ON "ServiceCategory"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_TestingService_updatedAt ON "TestingService";
CREATE TRIGGER trg_update_TestingService_updatedAt
    BEFORE UPDATE ON "TestingService"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Laboratory_updatedAt ON "Laboratory";
CREATE TRIGGER trg_update_Laboratory_updatedAt
    BEFORE UPDATE ON "Laboratory"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_RFQRequest_updatedAt ON "RFQRequest";
CREATE TRIGGER trg_update_RFQRequest_updatedAt
    BEFORE UPDATE ON "RFQRequest"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Quotation_updatedAt ON "Quotation";
CREATE TRIGGER trg_update_Quotation_updatedAt
    BEFORE UPDATE ON "Quotation"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Order_updatedAt ON "Order";
CREATE TRIGGER trg_update_Order_updatedAt
    BEFORE UPDATE ON "Order"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Sample_updatedAt ON "Sample";
CREATE TRIGGER trg_update_Sample_updatedAt
    BEFORE UPDATE ON "Sample"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Report_updatedAt ON "Report";
CREATE TRIGGER trg_update_Report_updatedAt
    BEFORE UPDATE ON "Report"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Equipment_updatedAt ON "Equipment";
CREATE TRIGGER trg_update_Equipment_updatedAt
    BEFORE UPDATE ON "Equipment"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_EquipmentBooking_updatedAt ON "EquipmentBooking";
CREATE TRIGGER trg_update_EquipmentBooking_updatedAt
    BEFORE UPDATE ON "EquipmentBooking"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Conversation_updatedAt ON "Conversation";
CREATE TRIGGER trg_update_Conversation_updatedAt
    BEFORE UPDATE ON "Conversation"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_TechnicianTask_updatedAt ON "TechnicianTask";
CREATE TRIGGER trg_update_TechnicianTask_updatedAt
    BEFORE UPDATE ON "TechnicianTask"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_PaymentProvider_updatedAt ON "PaymentProvider";
CREATE TRIGGER trg_update_PaymentProvider_updatedAt
    BEFORE UPDATE ON "PaymentProvider"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_IntegrationSetting_updatedAt ON "IntegrationSetting";
CREATE TRIGGER trg_update_IntegrationSetting_updatedAt
    BEFORE UPDATE ON "IntegrationSetting"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_RateLimitEntry_updatedAt ON "RateLimitEntry";
CREATE TRIGGER trg_update_RateLimitEntry_updatedAt
    BEFORE UPDATE ON "RateLimitEntry"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_Payment_updatedAt ON "Payment";
CREATE TRIGGER trg_update_Payment_updatedAt
    BEFORE UPDATE ON "Payment"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_CMSPage_updatedAt ON "CMSPage";
CREATE TRIGGER trg_update_CMSPage_updatedAt
    BEFORE UPDATE ON "CMSPage"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_CMSSection_updatedAt ON "CMSSection";
CREATE TRIGGER trg_update_CMSSection_updatedAt
    BEFORE UPDATE ON "CMSSection"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_CMSSectionItem_updatedAt ON "CMSSectionItem";
CREATE TRIGGER trg_update_CMSSectionItem_updatedAt
    BEFORE UPDATE ON "CMSSectionItem"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_CMSSectionItemPoint_updatedAt ON "CMSSectionItemPoint";
CREATE TRIGGER trg_update_CMSSectionItemPoint_updatedAt
    BEFORE UPDATE ON "CMSSectionItemPoint"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_SiteSetting_updatedAt ON "SiteSetting";
CREATE TRIGGER trg_update_SiteSetting_updatedAt
    BEFORE UPDATE ON "SiteSetting"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

