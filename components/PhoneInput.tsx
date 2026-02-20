'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export const ALL_COUNTRIES = [
  { name: 'Cameroun',           code: 'CM', dial: '+237', flag: '🇨🇲' },
  { name: 'Côte d\'Ivoire',     code: 'CI', dial: '+225', flag: '🇨🇮' },
  { name: 'Sénégal',            code: 'SN', dial: '+221', flag: '🇸🇳' },
  { name: 'Mali',               code: 'ML', dial: '+223', flag: '🇲🇱' },
  { name: 'Burkina Faso',       code: 'BF', dial: '+226', flag: '🇧🇫' },
  { name: 'Guinée',             code: 'GN', dial: '+224', flag: '🇬🇳' },
  { name: 'Congo RDC',          code: 'CD', dial: '+243', flag: '🇨🇩' },
  { name: 'Congo Brazza.',      code: 'CG', dial: '+242', flag: '🇨🇬' },
  { name: 'Gabon',              code: 'GA', dial: '+241', flag: '🇬🇦' },
  { name: 'Tchad',              code: 'TD', dial: '+235', flag: '🇹🇩' },
  { name: 'Niger',              code: 'NE', dial: '+227', flag: '🇳🇪' },
  { name: 'Togo',               code: 'TG', dial: '+228', flag: '🇹🇬' },
  { name: 'Bénin',              code: 'BJ', dial: '+229', flag: '🇧🇯' },
  { name: 'Rwanda',             code: 'RW', dial: '+250', flag: '🇷🇼' },
  { name: 'Burundi',            code: 'BI', dial: '+257', flag: '🇧🇮' },
  { name: 'Madagascar',         code: 'MG', dial: '+261', flag: '🇲🇬' },
  { name: 'Mauritanie',         code: 'MR', dial: '+222', flag: '🇲🇷' },
  { name: 'Centrafrique',       code: 'CF', dial: '+236', flag: '🇨🇫' },
  { name: 'Guinée-Bissau',      code: 'GW', dial: '+245', flag: '🇬🇼' },
  { name: 'Comores',            code: 'KM', dial: '+269', flag: '🇰🇲' },
  { name: 'Djibouti',           code: 'DJ', dial: '+253', flag: '🇩🇯' },
  { name: 'Maroc',              code: 'MA', dial: '+212', flag: '🇲🇦' },
  { name: 'Tunisie',            code: 'TN', dial: '+216', flag: '🇹🇳' },
  { name: 'Algérie',            code: 'DZ', dial: '+213', flag: '🇩🇿' },
  { name: 'Nigeria',            code: 'NG', dial: '+234', flag: '🇳🇬' },
  { name: 'Ghana',              code: 'GH', dial: '+233', flag: '🇬🇭' },
  { name: 'Kenya',              code: 'KE', dial: '+254', flag: '🇰🇪' },
  { name: 'Éthiopie',           code: 'ET', dial: '+251', flag: '🇪🇹' },
  { name: 'Tanzanie',           code: 'TZ', dial: '+255', flag: '🇹🇿' },
  { name: 'Ouganda',            code: 'UG', dial: '+256', flag: '🇺🇬' },
  { name: 'Mozambique',         code: 'MZ', dial: '+258', flag: '🇲🇿' },
  { name: 'Angola',             code: 'AO', dial: '+244', flag: '🇦🇴' },
  { name: 'France',             code: 'FR', dial: '+33',  flag: '🇫🇷' },
  { name: 'Belgique',           code: 'BE', dial: '+32',  flag: '🇧🇪' },
  { name: 'Suisse',             code: 'CH', dial: '+41',  flag: '🇨🇭' },
  { name: 'Canada',             code: 'CA', dial: '+1',   flag: '🇨🇦' },
  { name: 'États-Unis',         code: 'US', dial: '+1',   flag: '🇺🇸' },
  { name: 'Royaume-Uni',        code: 'GB', dial: '+44',  flag: '🇬🇧' },
  { name: 'Allemagne',          code: 'DE', dial: '+49',  flag: '🇩🇪' },
  { name: 'Italie',             code: 'IT', dial: '+39',  flag: '🇮🇹' },
  { name: 'Espagne',            code: 'ES', dial: '+34',  flag: '🇪🇸' },
  { name: 'Portugal',           code: 'PT', dial: '+351', flag: '🇵🇹' },
  { name: 'Pays-Bas',           code: 'NL', dial: '+31',  flag: '🇳🇱' },
  { name: 'Chine',              code: 'CN', dial: '+86',  flag: '🇨🇳' },
  { name: 'Inde',               code: 'IN', dial: '+91',  flag: '🇮🇳' },
  { name: 'Brésil',             code: 'BR', dial: '+55',  flag: '🇧🇷' },
  { name: 'Autre',              code: 'XX', dial: '+',    flag: '🌍' },
];

// Extracts dial code from a full phone number string
function extractDial(value: string): { country: typeof ALL_COUNTRIES[0] | null; local: string } {
  if (!value) return { country: null, local: '' };
  // Try longest match first
  const sorted = [...ALL_COUNTRIES].filter(c => c.dial !== '+').sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (value.startsWith(c.dial)) return { country: c, local: value.slice(c.dial.length).trimStart() };
  }
  return { country: null, local: value };
}

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  required?: boolean;
  placeholder?: string;
  defaultCountry?: string; // country code e.g. 'CM'
  label?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  required = false,
  placeholder = '6XX XXX XXX',
  defaultCountry = 'CM',
  label,
  className = '',
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Determine initial country from value or default
  const parsed = extractDial(value);
  const country = parsed.country || ALL_COUNTRIES.find(c => c.code === defaultCountry) || ALL_COUNTRIES[0];
  const local = parsed.local;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQ(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (c: typeof ALL_COUNTRIES[0]) => {
    onChange(c.dial + (local ? ' ' + local.trimStart() : ''));
    setOpen(false); setQ('');
  };

  const handleLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^\d\s\-()]/g, '');
    onChange(country.dial + (v ? ' ' + v.replace(/^\s+/, '') : ''));
  };

  const filtered = ALL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.dial.includes(q) ||
    c.code.toLowerCase().startsWith(q.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <div className="flex rounded-xl overflow-visible border border-gray-300 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all bg-white">
        {/* Flag + dial button */}
        <button type="button" onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0 rounded-l-xl">
          <span className="text-lg leading-none">{country.flag}</span>
          <span className="text-xs font-mono text-gray-600 hidden sm:inline whitespace-nowrap">{country.dial}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>
        {/* Local number */}
        <input
          type="tel" required={required}
          value={local}
          onChange={handleLocal}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none min-w-0 rounded-r-xl"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[9999] top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Pays ou indicatif..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-300" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.code} type="button" onClick={() => choose(c)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left ${country.code === c.code ? 'bg-orange-50' : ''}`}>
                <span className="text-lg flex-shrink-0">{c.flag}</span>
                <span className="text-sm text-gray-800 flex-1 truncate">{c.name}</span>
                <span className="text-xs font-mono text-gray-500 flex-shrink-0">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}