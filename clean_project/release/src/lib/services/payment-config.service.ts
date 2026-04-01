/**
 * Payment Provider Configuration Service
 * Manages dynamic payment provider configurations with encrypted credentials
 * Updated for Phase 2: Manual payments, QR codes, bank transfers, ordering
 */

import { PrismaClient, PaymentProviderType, ProviderMode } from '@prisma/client';
import { encrypt, decrypt, maskSecret } from './encryption.service';
import prisma from '@/lib/db';

export interface PaymentProviderConfig {
  id: string;
  name: string;
  nameEn?: string;
  type: PaymentProviderType;
  appId?: string;
  merchantId?: string;
  apiKey?: string;
  apiSecret?: string;
  privateKey?: string;
  publicKey?: string;
  certSerialNo?: string;
  notifyUrl?: string;
  mode: ProviderMode;
  isEnabled: boolean;
  isDefault: boolean;
  // Manual payment fields
  qrCodeUrl?: string;
  instructionsZh?: string;
  instructionsEn?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  // Limits and display
  minAmount?: number;
  maxAmount?: number;
  supportedCurrency?: string;
  displayOrder?: number;
  config?: Record<string, unknown>;
}

export interface PaymentProviderConfigDecrypted extends Omit<PaymentProviderConfig, 'apiKey' | 'apiSecret' | 'privateKey'> {
  apiKey?: string;  // Decrypted
  apiSecret?: string;  // Decrypted
  privateKey?: string;  // Decrypted
}

export interface PaymentProviderConfigMasked extends Omit<PaymentProviderConfig, 'apiKey' | 'apiSecret' | 'privateKey'> {
  apiKeyMasked?: string;
  apiSecretMasked?: string;
  privateKeyMasked?: string;
}

/**
 * Get all payment providers (with masked secrets)
 */
export async function getAllPaymentProviders(): Promise<PaymentProviderConfigMasked[]> {
  const providers = await prisma.paymentProvider.findMany({
    orderBy: [
      { displayOrder: 'asc' },
      { isDefault: 'desc' },
      { isEnabled: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  return providers.map(provider => ({
    id: provider.id,
    name: provider.name,
    nameEn: provider.nameEn || undefined,
    type: provider.type,
    appId: provider.appId || undefined,
    merchantId: provider.merchantId || undefined,
    apiKeyMasked: provider.apiKey ? maskSecret(provider.apiKey) : undefined,
    apiSecretMasked: provider.apiSecret ? maskSecret(provider.apiSecret) : undefined,
    privateKeyMasked: provider.privateKey ? maskSecret(provider.privateKey) : undefined,
    qrCodeUrl: provider.qrCodeUrl || undefined,
    instructionsZh: provider.instructionsZh || undefined,
    instructionsEn: provider.instructionsEn || undefined,
    bankName: provider.bankName || undefined,
    bankAccount: provider.bankAccount || undefined,
    accountHolder: provider.accountHolder || undefined,
    minAmount: provider.minAmount ? Number(provider.minAmount) : undefined,
    maxAmount: provider.maxAmount ? Number(provider.maxAmount) : undefined,
    supportedCurrency: provider.supportedCurrency,
    displayOrder: provider.displayOrder,
    publicKey: provider.publicKey || undefined,
    certSerialNo: provider.certSerialNo || undefined,
    notifyUrl: provider.notifyUrl || undefined,
    mode: provider.mode,
    isEnabled: provider.isEnabled,
    isDefault: provider.isDefault,
    config: provider.config as Record<string, unknown> | undefined
  }));
}

/**
 * Get provider by ID (with decrypted secrets - use carefully!)
 */
export async function getPaymentProviderById(id: string): Promise<PaymentProviderConfigDecrypted | null> {
  const provider = await prisma.paymentProvider.findUnique({
    where: { id }
  });

  if (!provider) {
    return null;
  }

  return {
    id: provider.id,
    name: provider.name,
    nameEn: provider.nameEn || undefined,
    type: provider.type,
    appId: provider.appId || undefined,
    merchantId: provider.merchantId || undefined,
    apiKey: provider.apiKey ? decrypt(provider.apiKey) : undefined,
    apiSecret: provider.apiSecret ? decrypt(provider.apiSecret) : undefined,
    privateKey: provider.privateKey ? decrypt(provider.privateKey) : undefined,
    publicKey: provider.publicKey || undefined,
    certSerialNo: provider.certSerialNo || undefined,
    notifyUrl: provider.notifyUrl || undefined,
    qrCodeUrl: provider.qrCodeUrl || undefined,
    instructionsZh: provider.instructionsZh || undefined,
    instructionsEn: provider.instructionsEn || undefined,
    bankName: provider.bankName || undefined,
    bankAccount: provider.bankAccount || undefined,
    accountHolder: provider.accountHolder || undefined,
    minAmount: provider.minAmount ? Number(provider.minAmount) : undefined,
    maxAmount: provider.maxAmount ? Number(provider.maxAmount) : undefined,
    supportedCurrency: provider.supportedCurrency,
    displayOrder: provider.displayOrder,
    mode: provider.mode,
    isEnabled: provider.isEnabled,
    isDefault: provider.isDefault,
    config: provider.config as Record<string, unknown> | undefined
  };
}

/**
 * Create payment provider (encrypts secrets automatically)
 */
export async function createPaymentProvider(
  data: Omit<PaymentProviderConfig, 'id'>,
  createdBy: string
): Promise<PaymentProviderConfigMasked> {
  // If this is the first provider, make it default
  const existingCount = await prisma.paymentProvider.count();
  const shouldBeDefault = existingCount === 0 || data.isDefault;

  // If setting as default, unset other defaults of same type
  if (shouldBeDefault) {
    await prisma.paymentProvider.updateMany({
      where: {
        type: data.type,
        isDefault: true
      },
      data: { isDefault: false }
    });
  }

  const provider = await prisma.paymentProvider.create({
    data: {
      name: data.name,
      nameEn: data.nameEn,
      type: data.type,
      appId: data.appId,
      merchantId: data.merchantId,
      apiKey: data.apiKey ? encrypt(data.apiKey) : null,
      apiSecret: data.apiSecret ? encrypt(data.apiSecret) : null,
      privateKey: data.privateKey ? encrypt(data.privateKey) : null,
      publicKey: data.publicKey,
      certSerialNo: data.certSerialNo,
      notifyUrl: data.notifyUrl,
      mode: data.mode,
      isEnabled: data.isEnabled,
      isDefault: shouldBeDefault,
      qrCodeUrl: data.qrCodeUrl,
      instructionsZh: data.instructionsZh,
      instructionsEn: data.instructionsEn,
      bankName: data.bankName,
      bankAccount: data.bankAccount,
      accountHolder: data.accountHolder,
      minAmount: data.minAmount,
      maxAmount: data.maxAmount,
      supportedCurrency: data.supportedCurrency || 'CNY',
      displayOrder: data.displayOrder || 0,
      config: data.config as any,
      createdBy
    }
  });

  return {
    id: provider.id,
    name: provider.name,
    nameEn: provider.nameEn || undefined,
    type: provider.type,
    appId: provider.appId || undefined,
    merchantId: provider.merchantId || undefined,
    apiKeyMasked: provider.apiKey ? maskSecret(provider.apiKey) : undefined,
    apiSecretMasked: provider.apiSecret ? maskSecret(provider.apiSecret) : undefined,
    privateKeyMasked: provider.privateKey ? maskSecret(provider.privateKey) : undefined,
    publicKey: provider.publicKey || undefined,
    certSerialNo: provider.certSerialNo || undefined,
    notifyUrl: provider.notifyUrl || undefined,
    qrCodeUrl: provider.qrCodeUrl || undefined,
    instructionsZh: provider.instructionsZh || undefined,
    instructionsEn: provider.instructionsEn || undefined,
    bankName: provider.bankName || undefined,
    bankAccount: provider.bankAccount || undefined,
    accountHolder: provider.accountHolder || undefined,
    minAmount: provider.minAmount ? Number(provider.minAmount) : undefined,
    maxAmount: provider.maxAmount ? Number(provider.maxAmount) : undefined,
    supportedCurrency: provider.supportedCurrency,
    displayOrder: provider.displayOrder,
    mode: provider.mode,
    isEnabled: provider.isEnabled,
    isDefault: provider.isDefault,
    config: provider.config as Record<string, unknown> | undefined
  };
}

/**
 * Update payment provider
 */
export async function updatePaymentProvider(
  id: string,
  data: Partial<Omit<PaymentProviderConfig, 'id'>>,
  updatedBy: string
): Promise<PaymentProviderConfigMasked | null> {
  const existing = await prisma.paymentProvider.findUnique({
    where: { id }
  });

  if (!existing) {
    return null;
  }

  // If setting as default, unset other defaults of same type
  if (data.isDefault) {
    await prisma.paymentProvider.updateMany({
      where: {
        type: existing.type,
        isDefault: true,
        id: { not: id }
      },
      data: { isDefault: false }
    });
  }

  const updateData: any = {
    updatedBy,
    updatedAt: new Date()
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.appId !== undefined) updateData.appId = data.appId;
  if (data.merchantId !== undefined) updateData.merchantId = data.merchantId;
  if (data.apiKey !== undefined) updateData.apiKey = data.apiKey ? encrypt(data.apiKey) : null;
  if (data.apiSecret !== undefined) updateData.apiSecret = data.apiSecret ? encrypt(data.apiSecret) : null;
  if (data.privateKey !== undefined) updateData.privateKey = data.privateKey ? encrypt(data.privateKey) : null;
  if (data.publicKey !== undefined) updateData.publicKey = data.publicKey;
  if (data.certSerialNo !== undefined) updateData.certSerialNo = data.certSerialNo;
  if (data.notifyUrl !== undefined) updateData.notifyUrl = data.notifyUrl;
  if (data.mode !== undefined) updateData.mode = data.mode;
  if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
  if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
  if (data.qrCodeUrl !== undefined) updateData.qrCodeUrl = data.qrCodeUrl;
  if (data.instructionsZh !== undefined) updateData.instructionsZh = data.instructionsZh;
  if (data.instructionsEn !== undefined) updateData.instructionsEn = data.instructionsEn;
  if (data.bankName !== undefined) updateData.bankName = data.bankName;
  if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
  if (data.accountHolder !== undefined) updateData.accountHolder = data.accountHolder;
  if (data.minAmount !== undefined) updateData.minAmount = data.minAmount;
  if (data.maxAmount !== undefined) updateData.maxAmount = data.maxAmount;
  if (data.supportedCurrency !== undefined) updateData.supportedCurrency = data.supportedCurrency;
  if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
  if (data.config !== undefined) updateData.config = data.config;

  const provider = await prisma.paymentProvider.update({
    where: { id },
    data: updateData
  });

  return {
    id: provider.id,
    name: provider.name,
    nameEn: provider.nameEn || undefined,
    type: provider.type,
    appId: provider.appId || undefined,
    merchantId: provider.merchantId || undefined,
    apiKeyMasked: provider.apiKey ? maskSecret(provider.apiKey) : undefined,
    apiSecretMasked: provider.apiSecret ? maskSecret(provider.apiSecret) : undefined,
    privateKeyMasked: provider.privateKey ? maskSecret(provider.privateKey) : undefined,
    publicKey: provider.publicKey || undefined,
    certSerialNo: provider.certSerialNo || undefined,
    notifyUrl: provider.notifyUrl || undefined,
    qrCodeUrl: provider.qrCodeUrl || undefined,
    instructionsZh: provider.instructionsZh || undefined,
    instructionsEn: provider.instructionsEn || undefined,
    bankName: provider.bankName || undefined,
    bankAccount: provider.bankAccount || undefined,
    accountHolder: provider.accountHolder || undefined,
    minAmount: provider.minAmount ? Number(provider.minAmount) : undefined,
    maxAmount: provider.maxAmount ? Number(provider.maxAmount) : undefined,
    supportedCurrency: provider.supportedCurrency,
    displayOrder: provider.displayOrder,
    mode: provider.mode,
    isEnabled: provider.isEnabled,
    isDefault: provider.isDefault,
    config: provider.config as Record<string, unknown> | undefined
  };
}

/**
 * Delete payment provider
 */
export async function deletePaymentProvider(id: string): Promise<boolean> {
  try {
    await prisma.paymentProvider.delete({
      where: { id }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get active payment providers for customer-facing use
 */
export async function getActivePaymentProviders(): Promise<PaymentProviderConfigMasked[]> {
  const providers = await prisma.paymentProvider.findMany({
    where: { isEnabled: true },
    orderBy: [
      { displayOrder: 'asc' },
      { isDefault: 'desc' },
      { createdAt: 'asc' }
    ]
  });

  return providers.map(provider => ({
    id: provider.id,
    name: provider.name,
    nameEn: provider.nameEn || undefined,
    type: provider.type,
    qrCodeUrl: provider.qrCodeUrl || undefined,
    instructionsZh: provider.instructionsZh || undefined,
    instructionsEn: provider.instructionsEn || undefined,
    bankName: provider.bankName || undefined,
    bankAccount: provider.bankAccount || undefined,
    accountHolder: provider.accountHolder || undefined,
    minAmount: provider.minAmount ? Number(provider.minAmount) : undefined,
    maxAmount: provider.maxAmount ? Number(provider.maxAmount) : undefined,
    supportedCurrency: provider.supportedCurrency,
    displayOrder: provider.displayOrder,
    mode: provider.mode,
    isEnabled: provider.isEnabled,
    isDefault: provider.isDefault,
    // Don't expose sensitive fields to customers
    appId: undefined,
    merchantId: undefined,
    apiKeyMasked: undefined,
    apiSecretMasked: undefined,
    privateKeyMasked: undefined,
    publicKey: undefined,
    certSerialNo: undefined,
    notifyUrl: undefined,
    config: undefined,
  }));
}

/**
 * Update provider display order
 */
export async function updateProviderOrder(updates: { id: string; displayOrder: number }[]): Promise<void> {
  await Promise.all(
    updates.map(({ id, displayOrder }) =>
      prisma.paymentProvider.update({
        where: { id },
        data: { displayOrder }
      })
    )
  );
}

/**
 * Get payment provider by type (returns first enabled default provider)
 */
export async function getPaymentProviderByType(
  type: PaymentProviderType
): Promise<PaymentProviderConfigDecrypted | null> {
  const provider = await prisma.paymentProvider.findFirst({
    where: { type, isEnabled: true, isDefault: true }
  });
  
  if (!provider) return null;
  
  return getPaymentProviderById(provider.id);
}

/**
 * Get default payment provider for a type
 */
export async function getDefaultPaymentProvider(
  type: PaymentProviderType
): Promise<PaymentProviderConfigDecrypted | null> {
  return getPaymentProviderByType(type);
}

/**
 * Test payment provider connection
 */
export async function testPaymentProviderConnection(
  id: string
): Promise<{ success: boolean; message: string }> {
  const provider = await getPaymentProviderById(id);
  
  if (!provider) {
    return { success: false, message: 'Provider not found' };
  }
  
  // For manual payment methods, just check if required fields exist
  if (provider.type === 'MANUAL_QR') {
    if (!provider.qrCodeUrl) {
      return { success: false, message: 'QR code not uploaded' };
    }
    return { success: true, message: 'Manual QR payment configured' };
  }
  
  if (provider.type === 'BANK_TRANSFER') {
    if (!provider.bankName || !provider.bankAccount) {
      return { success: false, message: 'Bank details incomplete' };
    }
    return { success: true, message: 'Bank transfer configured' };
  }
  
  // For API-based providers (WeChat, Alipay), check credentials
  if (!provider.appId || !provider.merchantId || !provider.apiKey) {
    return { success: false, message: 'Missing required credentials' };
  }
  
  return { success: true, message: 'Configuration appears valid' };
}

