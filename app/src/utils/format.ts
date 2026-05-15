import { format, Locale } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import i18n from '../i18n';

const LOCALE_MAP: Record<string, { locale: Locale; currency: string; localeStr: string }> = {
  vi: { locale: vi, currency: 'PHP', localeStr: 'en-PH' },
  en: { locale: enUS, currency: 'PHP', localeStr: 'en-PH' },
  tl: { locale: enUS, currency: 'PHP', localeStr: 'en-PH' },
};

const getConfig = () => LOCALE_MAP[i18n.language] || LOCALE_MAP.en;

export const formatCurrency = (amount: number) => {
  const { currency, localeStr } = getConfig();
  try {
    return new Intl.NumberFormat(localeStr, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toLocaleString(localeStr) + ' ₱';
  }
};

export const formatNumber = (num: number) => {
  const { localeStr } = getConfig();
  return num.toLocaleString(localeStr);
};

export const formatDate = (date: Date | string | any) => {
  if (!date) return '...';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '...';
    const { locale } = getConfig();
    if (i18n.language === 'vi') return format(d, 'dd/MM/yyyy');
    return format(d, 'MMM dd, yyyy', { locale });
  } catch {
    return '...';
  }
};

export const formatDateTime = (date: Date | string | any) => {
  if (!date) return '...';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '...';
    const { locale } = getConfig();
    if (i18n.language === 'vi') return format(d, 'dd/MM/yyyy HH:mm');
    return format(d, 'MMM dd, yyyy h:mm a', { locale });
  } catch {
    return '...';
  }
};

export const getInitials = (name: string) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};
