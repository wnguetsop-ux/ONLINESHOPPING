// ── African francophone countries & currencies ──────────────────────────────
export const AFRICAN_COUNTRIES = [
  { name: 'Cameroun',            code: 'CM', currency: 'XAF', phone: '+237', flag: '🇨🇲' },
  { name: 'Côte d\'Ivoire',      code: 'CI', currency: 'XOF', phone: '+225', flag: '🇨🇮' },
  { name: 'Sénégal',             code: 'SN', currency: 'XOF', phone: '+221', flag: '🇸🇳' },
  { name: 'Mali',                code: 'ML', currency: 'XOF', phone: '+223', flag: '🇲🇱' },
  { name: 'Burkina Faso',        code: 'BF', currency: 'XOF', phone: '+226', flag: '🇧🇫' },
  { name: 'Guinea',              code: 'GN', currency: 'GNF', phone: '+224', flag: '🇬🇳' },
  { name: 'Congo (RDC)',         code: 'CD', currency: 'CDF', phone: '+243', flag: '🇨🇩' },
  { name: 'Congo (Brazzaville)', code: 'CG', currency: 'XAF', phone: '+242', flag: '🇨🇬' },
  { name: 'Gabon',               code: 'GA', currency: 'XAF', phone: '+241', flag: '🇬🇦' },
  { name: 'Tchad',               code: 'TD', currency: 'XAF', phone: '+235', flag: '🇹🇩' },
  { name: 'Niger',               code: 'NE', currency: 'XOF', phone: '+227', flag: '🇳🇪' },
  { name: 'Togo',                code: 'TG', currency: 'XOF', phone: '+228', flag: '🇹🇬' },
  { name: 'Bénin',               code: 'BJ', currency: 'XOF', phone: '+229', flag: '🇧🇯' },
  { name: 'Rwanda',              code: 'RW', currency: 'RWF', phone: '+250', flag: '🇷🇼' },
  { name: 'Burundi',             code: 'BI', currency: 'BIF', phone: '+257', flag: '🇧🇮' },
  { name: 'Madagascar',          code: 'MG', currency: 'MGA', phone: '+261', flag: '🇲🇬' },
  { name: 'Mauritanie',          code: 'MR', currency: 'MRO', phone: '+222', flag: '🇲🇷' },
  { name: 'Centrafrique',        code: 'CF', currency: 'XAF', phone: '+236', flag: '🇨🇫' },
  { name: 'Guinée-Bissau',       code: 'GW', currency: 'XOF', phone: '+245', flag: '🇬🇼' },
  { name: 'Comores',             code: 'KM', currency: 'EUR', phone: '+269', flag: '🇰🇲' },
  { name: 'Djibouti',            code: 'DJ', currency: 'USD', phone: '+253', flag: '🇩🇯' },
  { name: 'Autre',               code: 'XX', currency: 'XAF', phone: '+', flag: '🌍' },
];

export type CurrencyCode = 'XAF' | 'XOF' | 'GNF' | 'MGA' | 'MRO' | 'EUR' | 'USD' | 'CDF' | 'BIF' | 'RWF';

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; decimals: number }> = {
  XAF: { symbol: 'FCFA', locale: 'fr-CM', decimals: 0 },
  XOF: { symbol: 'FCFA', locale: 'fr-SN', decimals: 0 },
  GNF: { symbol: 'GNF',  locale: 'fr-GN', decimals: 0 },
  CDF: { symbol: 'FC',   locale: 'fr-CD', decimals: 0 },
  BIF: { symbol: 'BIF',  locale: 'fr-BI', decimals: 0 },
  RWF: { symbol: 'RWF',  locale: 'rw-RW', decimals: 0 },
  MGA: { symbol: 'Ar',   locale: 'mg-MG', decimals: 0 },
  MRO: { symbol: 'UM',   locale: 'ar-MR', decimals: 0 },
  EUR: { symbol: '€',    locale: 'fr-FR', decimals: 2 },
  USD: { symbol: '$',    locale: 'en-US', decimals: 2 },
};

export function formatPrice(amount: number, currency: CurrencyCode | string = 'XAF'): string {
  const cfg = CURRENCY_CONFIG[currency as CurrencyCode] || CURRENCY_CONFIG.XAF;
  if (currency === 'EUR') return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  if (currency === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: cfg.decimals }).format(amount) + ' ' + cfg.symbol;
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (format === 'long') return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  if (format === 'time') return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function calculateMargin(costPrice: number, sellingPrice: number): number {
  if (costPrice === 0) return 100;
  return Math.round(((sellingPrice - costPrice) / costPrice) * 100);
}

// XAF / XOF sont peggés à l'EUR (1 EUR = 655.957 CFA fixe)
export const CFA_TO_EUR = 1 / 655.957;

export function approxEur(amount: number, fromCurrency: string = 'XAF'): number {
  if (fromCurrency === 'EUR') return Math.round(amount * 100) / 100;
  if (fromCurrency === 'XAF' || fromCurrency === 'XOF') return Math.round(amount * CFA_TO_EUR);
  return Math.round(amount * CFA_TO_EUR); // fallback
}

export function formatEur(amount: number): string {
  return `~${amount} €`;
}