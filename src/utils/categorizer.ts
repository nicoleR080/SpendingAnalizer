import { CATEGORIES, CATEGORY_LIST } from '../constants/categories';
import { CategoryDefinition, CustomRule, RawCsvRow, SystemSettings, Transaction, UserDataBackup } from '../types';
import { parseAmount, parseDate } from './csvParser';
import defaultUserData from '../../user_data.json';

const CUSTOM_RULES_KEY = 'bos_spending_custom_rules_v1';
const CUSTOM_CATEGORIES_KEY = 'bos_spending_custom_categories_v1';
const CATEGORY_KEYWORDS_KEY = 'bos_spending_category_keywords_v1';
const OVERRIDES_KEY = 'bos_spending_overrides_v1';
const TRANSACTIONS_STORE_KEY = 'bos_spending_transactions_v1';
const SYSTEM_SETTINGS_KEY = 'bos_spending_settings_v1';

/**
 * Returns default initial user data parsed from user_data.json config file
 */
export function getDefaultUserData(): UserDataBackup {
  return defaultUserData as unknown as UserDataBackup;
}

/**
 * Load system settings from localStorage or fallback to user_data.json
 */
export function getSavedSystemSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load system settings from storage', e);
  }
  return (defaultUserData.settings as unknown as SystemSettings) || {
    currency: 'GBP',
    currencySymbol: '£',
    autoApplyToSameItems: true,
    autoCreateRuleOnAssign: true,
    savingsCategoryIds: ['savings'],
  };
}

/**
 * Save system settings to localStorage
 */
export function saveSystemSettings(settings: SystemSettings): void {
  try {
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save system settings', e);
  }
}

/**
 * Load customized category keywords mapping from localStorage, falling back to user_data.json
 */
export function getSavedCategoryKeywords(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(CATEGORY_KEYWORDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load category keywords from storage', e);
  }
  return (defaultUserData.categoryKeywords as Record<string, string[]>) || {};
}

/**
 * Save customized category keywords mapping to localStorage
 */
export function saveCategoryKeywords(keywordsMap: Record<string, string[]>): void {
  try {
    localStorage.setItem(CATEGORY_KEYWORDS_KEY, JSON.stringify(keywordsMap));
  } catch (e) {
    console.error('Failed to save category keywords', e);
  }
}

/**
 * Get active keywords for a given category id (built-in or custom)
 */
export function getActiveKeywordsForCategory(
  categoryId: string,
  categoryKeywordsMap: Record<string, string[]> = {},
  customCategories: CategoryDefinition[] = []
): string[] {
  // If explicitly overridden in keywordsMap, use that
  if (categoryKeywordsMap[categoryId]) {
    return categoryKeywordsMap[categoryId];
  }

  // If it's a custom category, check its keywords
  const customCat = customCategories.find((c) => c.id === categoryId);
  if (customCat) {
    return customCat.keywords || customCat.defaultKeywords || [];
  }

  // Fallback to built-in category default keywords
  const builtIn = CATEGORIES[categoryId];
  if (builtIn) {
    return builtIn.defaultKeywords || [];
  }

  return [];
}

/**
 * Load custom categories from localStorage, falling back to user_data.json
 */
export function getSavedCustomCategories(): CategoryDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom categories from storage', e);
  }
  return (defaultUserData.customCategories as unknown as CategoryDefinition[]) || [];
}

/**
 * Save custom categories to localStorage
 */
export function saveCustomCategories(categories: CategoryDefinition[]): void {
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Failed to save custom categories', e);
  }
}

/**
 * Load custom keyword rules from localStorage, falling back to user_data.json
 */
export function getSavedCustomRules(): CustomRule[] {
  try {
    const raw = localStorage.getItem(CUSTOM_RULES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom rules from storage', e);
  }
  return (defaultUserData.customRules as unknown as CustomRule[]) || [];
}

/**
 * Save custom keyword rules to localStorage
 */
export function saveCustomRules(rules: CustomRule[]): void {
  try {
    localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save custom rules', e);
  }
}

/**
 * Load manual transaction overrides from localStorage, falling back to user_data.json
 */
export function getSavedOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load overrides', e);
  }
  return (defaultUserData.overrides as Record<string, string>) || {};
}

/**
 * Save manual transaction overrides to localStorage
 */
export function saveOverrides(overrides: Record<string, string>): void {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Failed to save overrides', e);
  }
}

/**
 * Generate full backup payload for export
 */
export function generateUserDataBackup(
  customCategories: CategoryDefinition[],
  customRules: CustomRule[],
  categoryKeywords: Record<string, string[]>,
  overrides: Record<string, string>,
  settings?: SystemSettings
): UserDataBackup {
  return {
    version: '1.0.0',
    appName: 'Bank of Scotland & Lloyds Spending Analyzer',
    exportedAt: new Date().toISOString(),
    settings: settings || getSavedSystemSettings(),
    customCategories,
    customRules,
    categoryKeywords,
    overrides,
  };
}

/**
 * Trigger download of backup JSON file (my_categories_backup.json)
 */
export function downloadUserDataBackup(backup: UserDataBackup): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', 'my_categories_backup.json');
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Parse and validate an imported backup JSON file
 */
export function parseAndValidateUserDataBackup(jsonContent: string): {
  success: boolean;
  data?: UserDataBackup;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON structure.' };
    }

    const customCategories: CategoryDefinition[] = Array.isArray(parsed.customCategories)
      ? parsed.customCategories
      : [];
    const customRules: CustomRule[] = Array.isArray(parsed.customRules)
      ? parsed.customRules
      : [];
    const categoryKeywords: Record<string, string[]> =
      parsed.categoryKeywords && typeof parsed.categoryKeywords === 'object'
        ? parsed.categoryKeywords
        : {};
    const overrides: Record<string, string> =
      parsed.overrides && typeof parsed.overrides === 'object'
        ? parsed.overrides
        : {};
    const settings: SystemSettings =
      parsed.settings && typeof parsed.settings === 'object'
        ? parsed.settings
        : getSavedSystemSettings();

    return {
      success: true,
      data: {
        version: parsed.version || '1.0.0',
        appName: parsed.appName || 'Bank of Scotland & Lloyds Spending Analyzer',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        settings,
        customCategories,
        customRules,
        categoryKeywords,
        overrides,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to parse JSON file.',
    };
  }
}

/**
 * Find matched category for a description and transaction direction
 */
export function categorizeDescription(
  description: string,
  type: 'debit' | 'credit',
  customRules: CustomRule[],
  customCategories: CategoryDefinition[] = [],
  categoryKeywordsMap: Record<string, string[]> = {}
): { category: string; matchReason: string } {
  const lowerDesc = (description || '').toLowerCase();

  // 1. Check custom standalone user rules first (sorted by longest keyword first for specificity)
  const sortedCustomRules = [...customRules].sort(
    (a, b) => b.keyword.length - a.keyword.length
  );

  for (const rule of sortedCustomRules) {
    const kw = rule.keyword.trim().toLowerCase();
    if (kw && lowerDesc.includes(kw)) {
      return {
        category: rule.categoryId,
        matchReason: `Custom Rule: "${rule.keyword}"`,
      };
    }
  }

  // 2. Check custom user-created categories with their active keywords
  for (const cat of customCategories) {
    const kws = categoryKeywordsMap[cat.id] || cat.keywords || cat.defaultKeywords || [];
    for (const kw of kws) {
      if (kw && lowerDesc.includes(kw.toLowerCase())) {
        return {
          category: cat.id,
          matchReason: `Custom Category Match: "${kw}"`,
        };
      }
    }
  }

  // 3. Check built-in categories with active customized keywords
  for (const cat of CATEGORY_LIST) {
    if (cat.id === 'uncategorized' || cat.id === 'income') continue;

    const activeKeywords = categoryKeywordsMap[cat.id] !== undefined
      ? categoryKeywordsMap[cat.id]
      : cat.defaultKeywords;

    for (const kw of activeKeywords) {
      if (kw && lowerDesc.includes(kw.toLowerCase())) {
        return {
          category: cat.id,
          matchReason: `Matched Keyword: "${kw}"`,
        };
      }
    }
  }

  // 4. If credit with no specific category matched yet, check for income keywords or default to Income
  if (type === 'credit') {
    const incomeCat = CATEGORIES.income;
    const incomeKeywords = categoryKeywordsMap['income'] !== undefined
      ? categoryKeywordsMap['income']
      : incomeCat.defaultKeywords;

    for (const kw of incomeKeywords) {
      if (kw && lowerDesc.includes(kw.toLowerCase())) {
        return {
          category: 'income',
          matchReason: `Income Keyword: "${kw}"`,
        };
      }
    }
    // Auto-assigned to any transaction with Credit Amount
    return {
      category: 'income',
      matchReason: 'Auto Income (Credit Amount)',
    };
  }

  // 5. Fallback for debit
  return {
    category: 'uncategorized',
    matchReason: 'No matching rule found',
  };
}

/**
 * Parse raw Bank of Scotland / Lloyds CSV rows into structured Transactions
 */
export function processBankOfScotlandRows(
  rows: RawCsvRow[],
  customRules: CustomRule[],
  overrides: Record<string, string>,
  customCategories: CategoryDefinition[] = [],
  categoryKeywordsMap: Record<string, string[]> = {}
): Transaction[] {
  const transactions: Transaction[] = [];

  rows.forEach((row, index) => {
    // Look for column variations (Bank of Scotland / Lloyds exports)
    const dateVal =
      row['Transaction Date'] ||
      row['Date'] ||
      row['TransactionDate'] ||
      row['DATE'] ||
      '';

    const descVal =
      row['Transaction Description'] ||
      row['Description'] ||
      row['TransactionDescription'] ||
      row['Merchant'] ||
      row['Payee'] ||
      row['DESCRIPTION'] ||
      '';

    const debitVal =
      row['Debit Amount'] ||
      row['Debit'] ||
      row['DebitAmount'] ||
      row['DEBIT'] ||
      row['Outflow'] ||
      '';

    const creditVal =
      row['Credit Amount'] ||
      row['Credit'] ||
      row['CreditAmount'] ||
      row['CREDIT'] ||
      row['Inflow'] ||
      '';

    const debitAmount = parseAmount(debitVal);
    const creditAmount = parseAmount(creditVal);

    // Skip rows without meaningful amounts or description
    if (debitAmount === null && creditAmount === null) {
      return;
    }

    const { isoDate, displayDate } = parseDate(dateVal);
    const isCredit = creditAmount !== null && (debitAmount === null || creditAmount > 0);
    const type: 'debit' | 'credit' = isCredit ? 'credit' : 'debit';
    const amount = isCredit ? (creditAmount || 0) : (debitAmount || 0);

    // Generate unique ID based on index and content
    const cleanDesc = descVal.trim() || 'Unknown Transaction';
    const id = `tx-${isoDate}-${index}-${Math.abs(hashCode(cleanDesc + amount))}`;

    // Categorization
    const autoCategorization = categorizeDescription(
      cleanDesc,
      type,
      customRules,
      customCategories,
      categoryKeywordsMap
    );
    
    // Check manual override by ID or by exact description
    const manualOverride =
      overrides[id] ||
      overrides[cleanDesc.toLowerCase()] ||
      overrides[cleanDesc.trim().toLowerCase()] ||
      overrides[cleanDesc];
    const category = manualOverride || autoCategorization.category;
    const isOverridden = Boolean(manualOverride);

    transactions.push({
      id,
      date: isoDate,
      displayDate,
      description: cleanDesc,
      debitAmount: isCredit ? null : amount,
      creditAmount: isCredit ? amount : null,
      amount,
      type,
      category,
      matchReason: isOverridden ? 'Manual Override' : autoCategorization.matchReason,
      originalCategory: autoCategorization.category,
      isOverridden,
    });
  });

  return transactions;
}

/**
 * Helper to generate simple hash code for stable IDs
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Cache current transactions in localStorage
 */
export function saveTransactionsToCache(txs: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_STORE_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to cache transactions', e);
  }
}

/**
 * Retrieve cached transactions from localStorage
 */
export function getCachedTransactions(): Transaction[] | null {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Clear cached transactions
 */
export function clearCachedTransactions(): void {
  try {
    localStorage.removeItem(TRANSACTIONS_STORE_KEY);
  } catch (e) {
    console.error(e);
  }
}
