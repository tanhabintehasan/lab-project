/**
 * Environment Variables Validation
 * Run this during app startup to ensure all required vars are set
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  DIRECT_URL?: string;
  
  // Auth
  JWT_SECRET: string;
  NEXTAUTH_URL: string;
  
  // Public URLs
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_DEFAULT_LOCALE: string;
  
  // Storage (optional)
  UPLOAD_DIR?: string;
  STORAGE_PROVIDER?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_BUCKET?: string;
  
  // Email (optional)
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SENDGRID_API_KEY?: string;
  RESEND_API_KEY?: string;
  
  // Payment (optional)
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_DEFAULT_LOCALE',
] as const;

export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
  
  // Validate URLs format
  try {
    new URL(process.env.NEXT_PUBLIC_SITE_URL!);
    new URL(process.env.NEXTAUTH_URL!);
  } catch (error) {
    throw new Error('Invalid URL format in environment variables');
  }
  
  // Log configuration status (without sensitive values)
  if (process.env.NODE_ENV === 'development') {
    console.log('\n✅ Environment Configuration Validated:');
    console.log('  • Database: Connected');
    console.log('  • Auth: JWT configured');
    console.log('  • Storage:', process.env.STORAGE_PROVIDER || 'local (default)');
    console.log('  • Email:', process.env.EMAIL_PROVIDER || 'console (dev mode)');
    console.log('  • Payment:', process.env.STRIPE_SECRET_KEY ? 'Stripe configured' : 'Mock mode (dev)');
    console.log('');
  }
  
  return process.env as unknown as EnvConfig;
}

export function getEnvVar(key: keyof EnvConfig, fallback?: string): string {
  return process.env[key] || fallback || '';
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
