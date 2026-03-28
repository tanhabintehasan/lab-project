export const locales = ['zh-CN', 'en'] as const;
export const defaultLocale = 'zh-CN' as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
};

export const localeConfig = {
  'zh-CN': {
    currency: 'CNY',
    currencySymbol: '¥',
    dateFormat: 'yyyy年MM月dd日',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'yyyy年MM月dd日 HH:mm',
  },
  'en': {
    currency: 'CNY',
    currencySymbol: '¥',
    dateFormat: 'MMM dd, yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'MMM dd, yyyy HH:mm',
  },
};
