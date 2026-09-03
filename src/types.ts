export interface RawCsvRow {
  [key: string]: string;
}

export interface Transaction {
  id: string;
  date: string; // Formatted YYYY-MM-DD for sorting/filtering
  displayDate: string; // DD/MM/YYYY
  description: string;
  debitAmount: number | null; // Expenses / Outflows
  creditAmount: number | null; // Income / Inflows
  amount: number; // Positive number representing the absolute transaction value
  type: 'debit' | 'credit';
  category: string; // Category key e.g. 'savings', 'food', 'leisure', 'bills', 'income', 'uncategorized'
  matchReason?: string; // Reason / rule that assigned this category
  originalCategory?: string;
  isOverridden?: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  color: string; // Hex color for recharts
  badgeBg: string; // Tailwind class
  badgeText: string; // Tailwind class
  badgeBorder: string;
  iconName: string;
  isIncome?: boolean;
  defaultKeywords: string[];
  keywords?: string[];
  isCustom?: boolean;
}

export interface CustomRule {
  id: string;
  keyword: string;
  categoryId: string;
  createdAt: number;
}

export interface SpendingSummary {
  totalOutflows: number;
  totalInflows: number;
  totalSaved: number;
  outflowsExcludingSavings: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  uncategorizedCount: number;
  uncategorizedAmount: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
}

export type SortField = 'date' | 'amount' | 'description' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  search: string;
  category: string;
  type: 'all' | 'debit' | 'credit';
  startDate: string;
  endDate: string;
  sortField: SortField;
  sortOrder: SortOrder;
}

export interface SystemSettings {
  currency: string;
  currencySymbol: string;
  autoApplyToSameItems: boolean;
  autoCreateRuleOnAssign: boolean;
  savingsCategoryIds: string[];
}

export interface UserDataBackup {
  version: string;
  appName: string;
  exportedAt?: string;
  lastUpdated?: string;
  settings?: SystemSettings;
  customCategories: CategoryDefinition[];
  customRules: CustomRule[];
  categoryKeywords: Record<string, string[]>;
  overrides: Record<string, string>;
}
