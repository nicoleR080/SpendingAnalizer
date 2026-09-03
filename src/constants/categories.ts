import { CategoryDefinition } from '../types';

export const CATEGORIES: Record<string, CategoryDefinition> = {
  savings: {
    id: 'savings',
    name: 'Savings & Investments',
    description: 'Trading, ISAs, investment platforms, automated savings',
    color: '#10B981', // Emerald 500
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconName: 'PiggyBank',
    defaultKeywords: [
      'trading 212',
      'aj bell',
      'savethechange',
      'vanguard',
      'isa',
      'sipp',
      'hl',
      'deposit',
      'fpo transfer',
      'fidelity',
      'freetrade',
      'moneybox',
      'monzo pot',
      'plum',
      'nutmeg',
      'investengine',
      'crypto'
    ],
  },
  food: {
    id: 'food',
    name: 'Groceries & Food',
    description: 'Supermarkets, takeaways, restaurants, cafes',
    color: '#F97316', // Orange 500
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    iconName: 'Utensils',
    defaultKeywords: [
      'asda',
      'aldi',
      'tesco',
      'sainsbury',
      'morrisons',
      'lidl',
      'uber *eats',
      'ubereats',
      'deliveroo',
      'just eat',
      'justeat',
      'mcdonalds',
      'cafe',
      'restaurant',
      'co-op',
      'waitrose',
      'marks & spencer',
      'm&s',
      'greggs',
      'costa',
      'starbucks',
      'pret',
      'nandos',
      'kfc',
      'subway'
    ],
  },
  leisure: {
    id: 'leisure',
    name: 'Fun & Leisure',
    description: 'Streaming, entertainment, shopping, holidays, bars',
    color: '#8B5CF6', // Purple 500
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconName: 'Sparkles',
    defaultKeywords: [
      'spotify',
      'netflix',
      'cinema',
      'pub',
      'bar',
      'ebay',
      'amazon',
      'travel',
      'steam',
      'flight',
      'disney',
      'apple.com/bill',
      'playstation',
      'nintendo',
      'xbox',
      'odeon',
      'vue',
      'cineworld',
      'booking.com',
      'airbnb',
      'ryanair',
      'easyjet',
      'trainline',
      'uber trip'
    ],
  },
  bills: {
    id: 'bills',
    name: 'Rent & Fixed Bills',
    description: 'Housing, loans, utilities, council tax, subscriptions',
    color: '#3B82F6', // Blue 500
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconName: 'Home',
    defaultKeywords: [
      'rent',
      'mortgage',
      'bos loan',
      'lloyds loan',
      'council tax',
      'energy',
      'water',
      'broadband',
      'direct debit',
      'british gas',
      'octopus',
      'e.on',
      'ovo',
      'thames water',
      'scottish water',
      'ee limited',
      'vodafone',
      'o2',
      'three',
      'virgin media',
      'sky digital',
      'bt group',
      'tv licence',
      'insurance',
      'admiral'
    ],
  },
  income: {
    id: 'income',
    name: 'Income / Inflows',
    description: 'Salary, dividends, transfers in, refunds',
    color: '#059669', // Emerald 600
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    iconName: 'ArrowDownLeft',
    isIncome: true,
    defaultKeywords: [
      'salary',
      'payroll',
      'dividend',
      'refund',
      'dwp',
      'hmrc',
      'interest',
      'bonus',
      'wages'
    ],
  },
  uncategorized: {
    id: 'uncategorized',
    name: 'Uncategorized',
    description: 'Transactions needing a custom rule or manual tag',
    color: '#64748B', // Slate 500
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    iconName: 'HelpCircle',
    defaultKeywords: [],
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export function getCategory(id: string, customCategoriesMap?: Record<string, CategoryDefinition>): CategoryDefinition {
  if (customCategoriesMap && customCategoriesMap[id]) {
    return customCategoriesMap[id];
  }
  return CATEGORIES[id] || {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    description: 'Custom category',
    color: '#64748B',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    iconName: 'Tag',
    defaultKeywords: [],
    isCustom: true,
  };
}

export const PALETTE_OPTIONS = [
  { name: 'Teal', color: '#0D9488', bg: 'bg-teal-50 text-teal-700 border-teal-200', border: 'border-teal-200', text: 'text-teal-700' },
  { name: 'Indigo', color: '#4F46E5', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', border: 'border-indigo-200', text: 'text-indigo-700' },
  { name: 'Rose', color: '#E11D48', bg: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-rose-200', text: 'text-rose-700' },
  { name: 'Cyan', color: '#0891B2', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', border: 'border-cyan-200', text: 'text-cyan-700' },
  { name: 'Amber', color: '#D97706', bg: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-amber-200', text: 'text-amber-700' },
  { name: 'Emerald', color: '#059669', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-emerald-200', text: 'text-emerald-700' },
  { name: 'Violet', color: '#7C3AED', bg: 'bg-violet-50 text-violet-700 border-violet-200', border: 'border-violet-200', text: 'text-violet-700' },
  { name: 'Pink', color: '#DB2777', bg: 'bg-pink-50 text-pink-700 border-pink-200', border: 'border-pink-200', text: 'text-pink-700' },
  { name: 'Lime', color: '#65A30D', bg: 'bg-lime-50 text-lime-700 border-lime-200', border: 'border-lime-200', text: 'text-lime-700' },
  { name: 'Sky Blue', color: '#0284C7', bg: 'bg-sky-50 text-sky-700 border-sky-200', border: 'border-sky-200', text: 'text-sky-700' },
  { name: 'Fuchsia', color: '#C026D3', bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200', border: 'border-fuchsia-200', text: 'text-fuchsia-700' },
  { name: 'Slate', color: '#475569', bg: 'bg-slate-50 text-slate-700 border-slate-200', border: 'border-slate-200', text: 'text-slate-700' },
];

export function createCustomCategoryDefinition(
  id: string,
  name: string,
  description: string,
  colorOption: (typeof PALETTE_OPTIONS)[0],
  keywords: string[] = []
): CategoryDefinition {
  return {
    id,
    name,
    description: description || `Custom category for ${name}`,
    color: colorOption.color,
    badgeBg: colorOption.bg,
    badgeText: colorOption.text,
    badgeBorder: colorOption.border,
    iconName: 'Tag',
    defaultKeywords: keywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
    keywords: keywords.map((k) => k.trim().toLowerCase()).filter(Boolean),
    isCustom: true,
  };
}
