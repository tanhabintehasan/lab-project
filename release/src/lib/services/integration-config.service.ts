/**
 * Integration Settings Service
 * Manages dynamic integration configurations (SMS, Email, Storage, etc.) with encrypted credentials
 */

import { PrismaClient, IntegrationType, ProviderMode } from '@prisma/client';
import { encrypt, decrypt, maskSecret } from './encryption.service';
import prisma from '@/lib/db';

export interface IntegrationConfig {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  accessKey?: string;
  accessSecret?: string;
  endpoint?: string;
  region?: string;
  bucket?: string;
  config?: Record<string, unknown>;
  isEnabled: boolean;
  isDefault: boolean;
  mode: ProviderMode;
}

export interface IntegrationConfigDecrypted extends Omit<IntegrationConfig, 'apiKey' | 'apiSecret' | 'accessKey' | 'accessSecret'> {
  apiKey?: string;  // Decrypted
  apiSecret?: string;  // Decrypted
  accessKey?: string;  // Decrypted
  accessSecret?: string;  // Decrypted
}

export interface IntegrationConfigMasked extends Omit<IntegrationConfig, 'apiKey' | 'apiSecret' | 'accessKey' | 'accessSecret'> {
  apiKeyMasked?: string;
  apiSecretMasked?: string;
  accessKeyMasked?: string;
  accessSecretMasked?: string;
}

/**
 * Get all integration settings (with masked secrets)
 */
export async function getAllIntegrationSettings(): Promise<IntegrationConfigMasked[]> {
  const settings = await prisma.integrationSetting.findMany({
    orderBy: [
      { type: 'asc' },
      { isDefault: 'desc' },
      { isEnabled: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  return settings.map(setting => ({
    id: setting.id,
    name: setting.name,
    type: setting.type,
    provider: setting.provider,
    apiKeyMasked: setting.apiKey ? maskSecret(setting.apiKey) : undefined,
    apiSecretMasked: setting.apiSecret ? maskSecret(setting.apiSecret) : undefined,
    accessKeyMasked: setting.accessKey ? maskSecret(setting.accessKey) : undefined,
    accessSecretMasked: setting.accessSecret ? maskSecret(setting.accessSecret) : undefined,
    endpoint: setting.endpoint || undefined,
    region: setting.region || undefined,
    bucket: setting.bucket || undefined,
    config: setting.config as Record<string, unknown> | undefined,
    isEnabled: setting.isEnabled,
    isDefault: setting.isDefault,
    mode: setting.mode
  }));
}

/**
 * Get integration settings by type (with decrypted secrets)
 */
export async function getIntegrationByType(
  type: IntegrationType
): Promise<IntegrationConfigDecrypted | null> {
  const setting = await prisma.integrationSetting.findFirst({
    where: {
      type,
      isEnabled: true
    },
    orderBy: {
      isDefault: 'desc'
    }
  });

  if (!setting) {
    return null;
  }

  return {
    id: setting.id,
    name: setting.name,
    type: setting.type,
    provider: setting.provider,
    apiKey: setting.apiKey ? decrypt(setting.apiKey) : undefined,
    apiSecret: setting.apiSecret ? decrypt(setting.apiSecret) : undefined,
    accessKey: setting.accessKey ? decrypt(setting.accessKey) : undefined,
    accessSecret: setting.accessSecret ? decrypt(setting.accessSecret) : undefined,
    endpoint: setting.endpoint || undefined,
    region: setting.region || undefined,
    bucket: setting.bucket || undefined,
    config: setting.config as Record<string, unknown> | undefined,
    isEnabled: setting.isEnabled,
    isDefault: setting.isDefault,
    mode: setting.mode
  };
}

/**
 * Get integration setting by ID (with decrypted secrets)
 */
export async function getIntegrationById(
  id: string
): Promise<IntegrationConfigDecrypted | null> {
  const setting = await prisma.integrationSetting.findUnique({
    where: { id }
  });

  if (!setting) {
    return null;
  }

  return {
    id: setting.id,
    name: setting.name,
    type: setting.type,
    provider: setting.provider,
    apiKey: setting.apiKey ? decrypt(setting.apiKey) : undefined,
    apiSecret: setting.apiSecret ? decrypt(setting.apiSecret) : undefined,
    accessKey: setting.accessKey ? decrypt(setting.accessKey) : undefined,
    accessSecret: setting.accessSecret ? decrypt(setting.accessSecret) : undefined,
    endpoint: setting.endpoint || undefined,
    region: setting.region || undefined,
    bucket: setting.bucket || undefined,
    config: setting.config as Record<string, unknown> | undefined,
    isEnabled: setting.isEnabled,
    isDefault: setting.isDefault,
    mode: setting.mode
  };
}

/**
 * Create integration setting (encrypts secrets automatically)
 */
export async function createIntegrationSetting(
  data: Omit<IntegrationConfig, 'id'>,
  createdBy: string
): Promise<IntegrationConfigMasked> {
  // If this is the first setting of this type, make it default
  const existingCount = await prisma.integrationSetting.count({
    where: { type: data.type }
  });
  const shouldBeDefault = existingCount === 0 || data.isDefault;

  // If setting as default, unset other defaults of same type
  if (shouldBeDefault) {
    await prisma.integrationSetting.updateMany({
      where: {
        type: data.type,
        isDefault: true
      },
      data: { isDefault: false }
    });
  }

  const setting = await prisma.integrationSetting.create({
    data: {
      name: data.name,
      type: data.type,
      provider: data.provider,
      apiKey: data.apiKey ? encrypt(data.apiKey) : null,
      apiSecret: data.apiSecret ? encrypt(data.apiSecret) : null,
      accessKey: data.accessKey ? encrypt(data.accessKey) : null,
      accessSecret: data.accessSecret ? encrypt(data.accessSecret) : null,
      endpoint: data.endpoint,
      region: data.region,
      bucket: data.bucket,
      config: data.config as any,
      isEnabled: data.isEnabled,
      isDefault: shouldBeDefault,
      mode: data.mode,
      createdBy
    }
  });

  return {
    id: setting.id,
    name: setting.name,
    type: setting.type,
    provider: setting.provider,
    apiKeyMasked: setting.apiKey ? maskSecret(setting.apiKey) : undefined,
    apiSecretMasked: setting.apiSecret ? maskSecret(setting.apiSecret) : undefined,
    accessKeyMasked: setting.accessKey ? maskSecret(setting.accessKey) : undefined,
    accessSecretMasked: setting.accessSecret ? maskSecret(setting.accessSecret) : undefined,
    endpoint: setting.endpoint || undefined,
    region: setting.region || undefined,
    bucket: setting.bucket || undefined,
    config: setting.config as Record<string, unknown> | undefined,
    isEnabled: setting.isEnabled,
    isDefault: setting.isDefault,
    mode: setting.mode
  };
}

/**
 * Update integration setting (encrypts secrets automatically)
 */
export async function updateIntegrationSetting(
  id: string,
  data: Partial<Omit<IntegrationConfig, 'id'>>,
  updatedBy: string
): Promise<IntegrationConfigMasked> {
  // If setting as default, unset other defaults of same type
  if (data.isDefault) {
    const currentSetting = await prisma.integrationSetting.findUnique({
      where: { id }
    });

    if (currentSetting) {
      await prisma.integrationSetting.updateMany({
        where: {
          type: currentSetting.type,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }
  }

  const updateData: any = {
    ...data,
    updatedBy
  };

  // Encrypt secrets if provided
  if (data.apiKey) updateData.apiKey = encrypt(data.apiKey);
  if (data.apiSecret) updateData.apiSecret = encrypt(data.apiSecret);
  if (data.accessKey) updateData.accessKey = encrypt(data.accessKey);
  if (data.accessSecret) updateData.accessSecret = encrypt(data.accessSecret);

  const setting = await prisma.integrationSetting.update({
    where: { id },
    data: updateData
  });

  return {
    id: setting.id,
    name: setting.name,
    type: setting.type,
    provider: setting.provider,
    apiKeyMasked: setting.apiKey ? maskSecret(setting.apiKey) : undefined,
    apiSecretMasked: setting.apiSecret ? maskSecret(setting.apiSecret) : undefined,
    accessKeyMasked: setting.accessKey ? maskSecret(setting.accessKey) : undefined,
    accessSecretMasked: setting.accessSecret ? maskSecret(setting.accessSecret) : undefined,
    endpoint: setting.endpoint || undefined,
    region: setting.region || undefined,
    bucket: setting.bucket || undefined,
    config: setting.config as Record<string, unknown> | undefined,
    isEnabled: setting.isEnabled,
    isDefault: setting.isDefault,
    mode: setting.mode
  };
}

/**
 * Delete integration setting
 */
export async function deleteIntegrationSetting(id: string): Promise<void> {
  await prisma.integrationSetting.delete({
    where: { id }
  });
}

/**
 * Test integration connection
 */
export async function testIntegrationConnection(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getIntegrationById(id);
    
    if (!config) {
      return { success: false, message: 'Integration not found' };
    }

    let testResult: { success: boolean; message: string };

    // Test based on type
    if (config.type === 'SMS') {
      // Import SMS providers dynamically
      const { AliyunSMSProvider } = await import('../sms-providers/aliyun');
      const { TencentSMSProvider } = await import('../sms-providers/tencent');
      
      const providerConfig = {
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        accessKey: config.accessKey,
        accessSecret: config.accessSecret,
        signName: (config.config as any)?.signName,
        templateId: (config.config as any)?.templateId,
        endpoint: config.endpoint,
        region: config.region,
        mode: config.mode,
        config: config.config
      };

      let provider;
      if (config.provider === 'aliyun_sms' || config.provider === 'aliyun') {
        provider = new AliyunSMSProvider(providerConfig);
      } else if (config.provider === 'tencent_sms' || config.provider === 'tencent') {
        provider = new TencentSMSProvider(providerConfig);
      }

      if (provider) {
        testResult = await provider.testConnection();
      } else {
        testResult = { success: false, message: 'Unknown SMS provider' };
      }
    } else {
      // For other types, check required fields
      const hasRequiredFields = 
        (config.type === 'EMAIL' && config.apiKey) ||
        (config.type === 'STORAGE' && config.accessKey && config.accessSecret);
      
      if (!hasRequiredFields) {
        testResult = { success: false, message: 'Missing required credentials' };
      } else {
        testResult = { success: true, message: 'Configuration valid (provider test not implemented)' };
      }
    }

    // Update test result in database
    await prisma.integrationSetting.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: testResult.success ? 'Connection test passed' : testResult.message
      }
    });

    return testResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Update test result
    await prisma.integrationSetting.update({
      where: { id },
      data: {
        lastTestedAt: new Date(),
        lastTestResult: `Connection test failed: ${message}`
      }
    });

    return { success: false, message };
  }
}
