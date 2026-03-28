# OTP & SMS Setup Guide

This guide explains how to configure SMS providers for OTP (One-Time Password) authentication in your laboratory marketplace platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Supported SMS Providers](#supported-sms-providers)
3. [Configuration Steps](#configuration-steps)
4. [Testing Guide](#testing-guide)
5. [Troubleshooting](#troubleshooting)
6. [Security Best Practices](#security-best-practices)

---

## Overview

The platform supports phone number authentication using OTP codes sent via SMS. This enables:

- **Phone Login**: Users can login using phone number + OTP code
- **Password Reset**: Users can reset password using phone + OTP verification
- **Phone Verification**: Verify phone numbers for account security

### How It Works

```
User enters phone → System generates OTP → SMS sent via provider → 
User enters code → System verifies → Login/Reset successful
```

**Security Features:**
- OTP codes are hashed before storage (never stored in plain text)
- 5-minute expiry
- Maximum 3 verification attempts
- Rate limiting (3 OTP requests per 15 minutes)
- Resend cooldown (1 minute)

---

## Supported SMS Providers

### 1. Aliyun SMS (阿里云短信)

**Best for:** China-based applications, high reliability

**Required Credentials:**
- **Access Key ID** (AccessKeyId)
- **Access Key Secret** (AccessKeySecret)  
- **Sign Name** (短信签名)
- **Template Code** (模板CODE)

**Where to Get:**
1. Visit: https://dysms.console.aliyun.com/
2. Create account and verify identity
3. Apply for SMS sign name (短信签名) - usually takes 2 hours
4. Create SMS template (短信模板) with variable placeholder: `${code}`
5. Get Access Key from: https://ram.console.aliyun.com/manage/ak

**Template Example:**
```
您的验证码是${code}，5分钟内有效，请勿泄露。
Your verification code is ${code}, valid for 5 minutes. Do not share.
```

**Pricing:** ¥0.045 per SMS (domestic China)

---

### 2. Tencent Cloud SMS (腾讯云短信)

**Best for:** China-based applications, integration with other Tencent services

**Required Credentials:**
- **Secret ID** (SecretId)
- **Secret Key** (SecretKey)
- **SDK App ID** (短信应用ID)
- **Sign Name** (签名内容)
- **Template ID** (模板ID)

**Where to Get:**
1. Visit: https://console.cloud.tencent.com/smsv2
2. Create account and verify identity
3. Create SMS application (短信应用)
4. Apply for signature (签名管理)
5. Create SMS template (正文模板) with `{1}` placeholder for code
6. Get credentials from: https://console.cloud.tencent.com/cam/capi

**Template Example:**
```
您的验证码是{1}，5分钟内有效，请勿泄露。
```

**Pricing:** ¥0.045 per SMS (domestic China)

---

## Configuration Steps

### Step 1: Configure SMS Provider in Admin Panel

1. **Login as Admin**
   ```
   Email: admin@demo.com
   Password: (your admin password)
   ```

2. **Navigate to Integration Settings**
   ```
   Go to: /admin/settings/integrations
   ```

3. **Add New Integration**
   - Click "Add Integration" button
   - Fill in the form:

#### For Aliyun SMS:

```
Name: Production Aliyun SMS
Type: SMS
Provider: aliyun_sms
Mode: Live (or Sandbox for testing)

Credentials:
- Access Key: [Your AccessKeyId]
- Access Secret: [Your AccessKeySecret]

Additional Config (click to expand JSON):
{
  "signName": "您的签名名称",
  "templateId": "SMS_XXXXXXXX"
}

Status:
✓ Enabled
✓ Set as Default
```

#### For Tencent Cloud SMS:

```
Name: Production Tencent SMS
Type: SMS
Provider: tencent_sms
Mode: Live

Credentials:
- API Key: [Your SecretId]
- API Secret: [Your SecretKey]

Region: ap-guangzhou

Additional Config (click to expand JSON):
{
  "sdkAppId": "14000XXXXX",
  "signName": "您的签名",
  "templateId": "140XXXX"
}

Status:
✓ Enabled
✓ Set as Default
```

4. **Test Connection**
   - Click "Test Connection" button
   - Should show "Connection successful"
   - If failed, check credentials and template approval status

5. **Save**
   - Click "Create Integration"

---

### Step 2: Verify Database Configuration

Check that the integration is stored correctly:

```sql
SELECT id, name, type, provider, "isEnabled", "isDefault" 
FROM "IntegrationSetting" 
WHERE type = 'SMS';
```

**Expected Output:**
- At least one SMS provider with `isEnabled = true`

---

### Step 3: Test OTP Flow

#### A. Send OTP via API

```bash
curl -X POST https://yourdomain.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8613800138000",
    "type": "login"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP code sent successfully",
  "expiresIn": 300
}
```

#### B. Verify OTP

```bash
curl -X POST https://yourdomain.com/api/auth/verify-otp \
  -H "Content-Type": application/json" \
  -d '{
    "phone": "+8613800138000",
    "code": "123456",
    "type": "login"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "otpId": "cuid..."
}
```

#### C. Login with Phone + OTP

```bash
curl -X POST https://yourdomain.com/api/auth/login-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+8613800138000",
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "phone": "+8613800138000",
    "name": "User 8000",
    "role": "CUSTOMER"
  },
  "token": "eyJ..."
}
```

---

## Testing Guide

### Manual Testing Checklist

- [ ] **SMS Provider Configured**
  - Go to `/admin/settings/integrations`
  - Verify SMS provider is listed
  - Status shows "Enabled" and "Default"
  
- [ ] **Test Connection**
  - Click "Test Connection" button
  - Should show success message
  
- [ ] **Send OTP**
  - Use test phone number
  - Click "Send OTP" on login page
  - Should receive SMS within 30 seconds
  - SMS should contain 6-digit code
  
- [ ] **OTP Expiry**
  - Send OTP
  - Wait 6 minutes
  - Try to verify → Should show "Invalid or expired OTP code"
  
- [ ] **Invalid OTP**
  - Send OTP
  - Enter wrong code
  - Should show "Invalid OTP code. X attempt(s) remaining."
  
- [ ] **Max Attempts**
  - Send OTP
  - Enter wrong code 3 times
  - Should show "Maximum verification attempts exceeded"
  
- [ ] **Rate Limiting**
  - Send OTP 4 times in a row
  - 4th request should be blocked
  - Should show "Too many OTP requests"
  
- [ ] **Resend Cooldown**
  - Send OTP
  - Immediately try to send again
  - Should show "Please wait X seconds before requesting a new code"
  
- [ ] **Login Success**
  - Send OTP
  - Enter correct code
  - Should login successfully
  - Should redirect to dashboard
  
- [ ] **Password Reset**
  - Go to password reset page
  - Enter phone + OTP
  - Enter new password
  - Should reset successfully
  - Should invalidate old sessions

---

### Edge Cases to Test

1. **Non-existent User (First Login)**
   - Enter new phone number
   - Verify OTP
   - Should create new user account automatically

2. **Concurrent OTP Requests**
   - Request OTP twice for same phone
   - Second OTP should invalidate first
   - Only latest OTP should work

3. **Different Phone Formats**
   - Test with: `13800138000`
   - Test with: `+8613800138000`
   - Test with: `+86 138 0013 8000`
   - All should work (normalized to `+8613800138000`)

4. **IP Rate Limiting**
   - Make 11 OTP requests from same IP
   - 11th should be blocked

---

## Troubleshooting

### Issue: "SMS provider not configured"

**Cause:** No SMS integration is enabled

**Solution:**
1. Go to `/admin/settings/integrations`
2. Add SMS provider
3. Enable and set as default
4. Test connection

---

### Issue: "Failed to send SMS"

**Possible Causes:**

1. **Invalid Credentials**
   - Verify Access Key / Secret ID
   - Check if keys are active
   - Re-generate keys if needed

2. **Template Not Approved**
   - Check template status in provider dashboard
   - Templates require approval (usually 2 hours)
   - Create new template if rejected

3. **Sign Name Not Approved**
   - Verify sign name status
   - Sign names require approval
   - Must match company/brand name

4. **Insufficient Balance**
   - Check SMS balance in provider console
   - Top up if needed

5. **Rate Limiting by Provider**
   - Aliyun: Max 10 SMS/minute/phone (default)
   - Tencent: Similar limits
   - Wait and retry

---

### Issue: "Invalid signature" (Aliyun)

**Solution:**
1. Check Access Key and Secret
2. Verify sign name matches approved signature
3. Ensure signature format: no brackets, exact match

---

### Issue: "Template does not exist" (Tencent)

**Solution:**
1. Check Template ID format: should be like `140XXXX` (7 digits)
2. Verify template is approved
3. Check template belongs to correct SDK App ID

---

### Issue: OTP not received

**Debugging Steps:**

1. **Check SMS Provider Dashboard**
   - Login to Aliyun/Tencent console
   - Check sending history
   - Look for failed deliveries

2. **Check Backend Logs**
   ```bash
   tail -f /var/log/supervisor/backend.*.log | grep SMS
   ```

3. **Check Database**
   ```sql
   SELECT * FROM "OTPCode" 
   WHERE identifier = '+8613800138000' 
   ORDER BY "createdAt" DESC 
   LIMIT 1;
   ```

4. **Test Provider Directly**
   - Go to `/admin/settings/integrations`
   - Click "Test Connection"
   - Should show success

---

## Security Best Practices

### 1. Rate Limiting Configuration

Current limits (can be adjusted in code):

- **OTP Requests:** 3 per 15 minutes per phone
- **OTP Verification:** 5 attempts per 15 minutes per phone
- **IP-based:** 10 OTP requests per hour per IP

### 2. OTP Storage

- ✅ OTP codes are hashed with bcrypt (10 rounds)
- ✅ Never stored in plain text
- ✅ Automatically invalidated after verification
- ✅ Expire after 5 minutes

### 3. Production Recommendations

1. **Enable SMS Fraud Detection**
   - Aliyun: Enable "短信防刷"
   - Tencent: Enable "频率限制"

2. **Monitor Costs**
   - Set daily spending limits
   - Enable alerts for unusual activity
   - Review sending statistics weekly

3. **Backup Provider**
   - Configure secondary SMS provider
   - Auto-failover if primary fails

4. **Compliance**
   - Follow local SMS regulations
   - Include opt-out instructions
   - Keep audit logs

---

## Environment Variables

### Required in `.env`:

```bash
# Already included
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="your-encryption-key"
DATABASE_URL="postgresql://..."
```

### NOT Required:

- ❌ No SMS credentials in `.env`
- ✅ All configured via admin panel (encrypted in DB)

---

## Database Tables Used

### `IntegrationSetting`
Stores SMS provider credentials (encrypted):
- `apiKey` (encrypted)
- `apiSecret` (encrypted)
- `config` (JSON: signName, templateId, sdkAppId)

### `OTPCode`
Stores OTP attempts:
- `identifier` (phone number)
- `codeHash` (hashed OTP)
- `type` ('login', 'reset', 'verify')
- `expiresAt`
- `attemptCount`
- `verifiedAt`

### `RateLimitEntry`
Tracks rate limits:
- `key` (e.g., 'otp:+8613800138000')
- `count`
- `resetAt`
- `blockedUntil`

---

## API Endpoints Reference

### Send OTP
```
POST /api/auth/send-otp
Body: { "phone": "+8613800138000", "type": "login" }
```

### Verify OTP
```
POST /api/auth/verify-otp
Body: { "phone": "+8613800138000", "code": "123456", "type": "login" }
```

### Login with Phone
```
POST /api/auth/login-phone
Body: { "phone": "+8613800138000", "code": "123456" }
```

### Reset Password
```
POST /api/auth/reset-password-otp
Body: { "phone": "+8613800138000", "code": "123456", "newPassword": "newpass123" }
```

---

## Support

For issues:
1. Check troubleshooting section above
2. Review backend logs
3. Test connection in admin panel
4. Verify credentials in provider console

---

**Last Updated:** $(date)
