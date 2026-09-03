import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { TransactionTable } from './components/TransactionTable';
import { RulesModal } from './components/RulesModal';
import { DateRangeCalculatorBar } from './components/DateRangeCalculatorBar';
import { UncategorizedReviewModal } from './components/UncategorizedReviewModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { DataManagementModal } from './components/DataManagementModal';
import { CATEGORIES, CATEGORY_LIST, getCategory } from './constants/categories';
import {
  CategoryBreakdownItem,
  CategoryDefinition,
  CustomRule,
  FilterOptions,
  SpendingSummary,
  SystemSettings,
  Transaction,
  UserDataBackup,
} from './types';
import { parseCsv } from './utils/csvParser';
import {
  getCachedTransactions,
  getSavedCustomRules,
  getSavedOverrides,
  getSavedCustomCategories,
  getSavedCategoryKeywords,
  getSavedSystemSettings,
  getDefaultUserData,
  getActiveKeywordsForCategory,
  categorizeDescription,
  processBankOfScotlandRows,
  saveCustomRules,
  saveOverrides,
  saveCustomCategories,
  saveCategoryKeywords,
  saveSystemSettings,
  saveTransactionsToCache,
  clearCachedTransactions,
  downloadUserDataBackup,
  generateUserDataBackup,
  parseAndValidateUserDataBackup,
} from './utils/categorizer';
import { SAMPLE_BOS_CSV } from './utils/sampleData';
import { CheckCircle2, AlertTriangle, FileSpreadsheet, PlusCircle, Database, Download, Upload } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [customCategories, setCustomCategories] = useState<CategoryDefinition[]>([]);
  const [categoryKeywords, setCategoryKeywords] = useState<Record<string, string[]>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    currency: 'GBP',
    currencySymbol: '£',
    autoApplyToSameItems: true,
    autoCreateRuleOnAssign: true,
    savingsCategoryIds: ['savings'],
  });

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isUncategorizedModalOpen, setIsUncategorizedModalOpen] = useState(false);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const [modalInitialKeyword, setModalInitialKeyword] = useState('');
  const [modalInitialCategory, setModalInitialCategory] = useState('food');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Dedicated Date Range & Month Calculation Filter state
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [appliedMonth, setAppliedMonth] = useState<string>('all');

  // Filter state for table-level controls
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    type: 'all',
    startDate: '',
    endDate: '',
    sortField: 'date',
    sortOrder: 'desc',
  });

  const customCategoriesMap = useMemo(() => {
    return customCategories.reduce<Record<string, CategoryDefinition>>((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [customCategories]);

  // Initialize rules, overrides, custom categories, and settings from storage / user_data.json
  useEffect(() => {
    const loadedRules = getSavedCustomRules();
    const loadedOverrides = getSavedOverrides();
    const loadedCategories = getSavedCustomCategories();
    const loadedKeywords = getSavedCategoryKeywords();
    const loadedSettings = getSavedSystemSettings();

    setCustomRules(loadedRules);
    setOverrides(loadedOverrides);
    setCustomCategories(loadedCategories);
    setCategoryKeywords(loadedKeywords);
    setSystemSettings(loadedSettings);

    const cached = getCachedTransactions();
    if (cached && cached.length > 0) {
      setTransactions(cached);
    } else {
      // Auto-load demo statement for immediate rich view
      loadSampleData(loadedRules, loadedOverrides, loadedCategories, loadedKeywords);
    }
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to load sample Bank of Scotland data
  const loadSampleData = useCallback(
    (
      rules = customRules,
      ovr = overrides,
      cats = customCategories,
      kws = categoryKeywords
    ) => {
      const rawRows = parseCsv(SAMPLE_BOS_CSV);
      const processed = processBankOfScotlandRows(rawRows, rules, ovr, cats, kws);
      setTransactions(processed);
      saveTransactionsToCache(processed);
      showToast(`Loaded ${processed.length} sample Bank of Scotland transactions`, 'success');
    },
    [customRules, overrides, customCategories, categoryKeywords]
  );

  // Handle CSV file upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const rawRows = parseCsv(text);
        if (rawRows.length === 0) {
          showToast('Could not find valid transaction rows in this CSV.', 'info');
          return;
        }

        const processed = processBankOfScotlandRows(
          rawRows,
          customRules,
          overrides,
          customCategories,
          categoryKeywords
        );
        setTransactions(processed);
        saveTransactionsToCache(processed);
        showToast(`Successfully parsed and categorized ${processed.length} transactions from "${file.name}"`, 'success');
      } catch (err) {
        console.error('Error processing CSV:', err);
        showToast('Error parsing CSV. Please check the file structure.', 'info');
      }
    };
    reader.readAsText(file);
  };

  // Re-categorize all transactions when rules, overrides, categories, or keywords change
  const applyCategorizationUpdate = (
    updatedRules: CustomRule[],
    updatedOverrides: Record<string, string>,
    updatedCategories: CategoryDefinition[] = customCategories,
    updatedKeywords: Record<string, string[]> = categoryKeywords
  ) => {
    setTransactions((prev) => {
      // Re-map with new rules, overrides & categories
      const updated = prev.map((tx) => {
        // If manual override exists by ID or exact/trimmed description
        const manual =
          updatedOverrides[tx.id] ||
          updatedOverrides[tx.description.toLowerCase()] ||
          updatedOverrides[tx.description.trim().toLowerCase()] ||
          updatedOverrides[tx.description.trim()] ||
          updatedOverrides[tx.description];

        if (manual) {
          return {
            ...tx,
            category: manual,
            matchReason: 'Manual Override',
            isOverridden: true,
          };
        }

        const autoCat = categorizeDescription(
          tx.description,
          tx.type,
          updatedRules,
          updatedCategories,
          updatedKeywords
        );

        return {
          ...tx,
          category: autoCat.category,
          matchReason: autoCat.matchReason,
          isOverridden: false,
        };
      });

      saveTransactionsToCache(updated);
      return updated;
    });
  };

  // Add a new custom category
  const handleAddCategory = (newCat: CategoryDefinition) => {
    const updated = [...customCategories, newCat];
    setCustomCategories(updated);
    saveCustomCategories(updated);
    applyCategorizationUpdate(customRules, overrides, updated, categoryKeywords);
    showToast(`Created category "${newCat.name}" with ${newCat.keywords.length} auto-rule keyword(s)`, 'success');
  };

  // Delete a custom category
  const handleDeleteCategory = (catId: string) => {
    const target = customCategories.find((c) => c.id === catId);
    const updated = customCategories.filter((c) => c.id !== catId);
    setCustomCategories(updated);
    saveCustomCategories(updated);

    // Clean up categoryKeywords entry if present
    const updatedKeywords = { ...categoryKeywords };
    if (updatedKeywords[catId]) {
      delete updatedKeywords[catId];
      setCategoryKeywords(updatedKeywords);
      saveCategoryKeywords(updatedKeywords);
    }

    // Clean up any overrides assigned to this deleted category
    const updatedOverrides = { ...overrides };
    let cleanedOverrides = false;
    Object.keys(updatedOverrides).forEach((key) => {
      if (updatedOverrides[key] === catId) {
        delete updatedOverrides[key];
        cleanedOverrides = true;
      }
    });
    if (cleanedOverrides) {
      setOverrides(updatedOverrides);
      saveOverrides(updatedOverrides);
    }

    applyCategorizationUpdate(customRules, updatedOverrides, updated, updatedKeywords);
    showToast(`Removed custom category "${target?.name || catId}"`, 'info');
  };

  // Remove a keyword from a category (custom or built-in)
  const handleRemoveKeywordFromCategory = (categoryId: string, keywordToRemove: string) => {
    const cleanKw = keywordToRemove.trim().toLowerCase();
    const currentActive = getActiveKeywordsForCategory(categoryId, categoryKeywords, customCategories);
    const newActive = currentActive.filter((k) => k.toLowerCase() !== cleanKw);

    const updatedKeywordsMap = {
      ...categoryKeywords,
      [categoryId]: newActive,
    };
    setCategoryKeywords(updatedKeywordsMap);
    saveCategoryKeywords(updatedKeywordsMap);

    // Also update customCategories if this category is custom
    let updatedCategories = customCategories;
    const isCustom = customCategories.some((c) => c.id === categoryId);
    if (isCustom) {
      updatedCategories = customCategories.map((c) =>
        c.id === categoryId ? { ...c, keywords: newActive } : c
      );
      setCustomCategories(updatedCategories);
      saveCustomCategories(updatedCategories);
    }

    applyCategorizationUpdate(customRules, overrides, updatedCategories, updatedKeywordsMap);

    const catObj = getCategory(categoryId, customCategoriesMap);
    showToast(`Removed keyword "${keywordToRemove}" from ${catObj.name}`, 'info');
  };

  // Add a keyword to a category (custom or built-in)
  const handleAddKeywordToCategory = (categoryId: string, keywordToAdd: string) => {
    const cleanKw = keywordToAdd.trim();
    if (!cleanKw) return;

    const currentActive = getActiveKeywordsForCategory(categoryId, categoryKeywords, customCategories);
    if (currentActive.some((k) => k.toLowerCase() === cleanKw.toLowerCase())) {
      showToast(`"${cleanKw}" is already in this category's keyword rules.`, 'info');
      return;
    }

    const newActive = [...currentActive, cleanKw];
    const updatedKeywordsMap = {
      ...categoryKeywords,
      [categoryId]: newActive,
    };
    setCategoryKeywords(updatedKeywordsMap);
    saveCategoryKeywords(updatedKeywordsMap);

    // Also update customCategories if this category is custom
    let updatedCategories = customCategories;
    const isCustom = customCategories.some((c) => c.id === categoryId);
    if (isCustom) {
      updatedCategories = customCategories.map((c) =>
        c.id === categoryId ? { ...c, keywords: newActive } : c
      );
      setCustomCategories(updatedCategories);
      saveCustomCategories(updatedCategories);
    }

    applyCategorizationUpdate(customRules, overrides, updatedCategories, updatedKeywordsMap);

    const catObj = getCategory(categoryId, customCategoriesMap);
    showToast(`Added keyword "${cleanKw}" to ${catObj.name}`, 'success');
  };

  // Reset category keywords to defaults
  const handleResetCategoryKeywords = (categoryId: string) => {
    const updatedKeywordsMap = { ...categoryKeywords };
    delete updatedKeywordsMap[categoryId];
    setCategoryKeywords(updatedKeywordsMap);
    saveCategoryKeywords(updatedKeywordsMap);

    // If custom category, reset to defaultKeywords if available
    let updatedCategories = customCategories;
    const customCat = customCategories.find((c) => c.id === categoryId);
    if (customCat && customCat.defaultKeywords) {
      updatedCategories = customCategories.map((c) =>
        c.id === categoryId ? { ...c, keywords: customCat.defaultKeywords } : c
      );
      setCustomCategories(updatedCategories);
      saveCustomCategories(updatedCategories);
    }

    applyCategorizationUpdate(customRules, overrides, updatedCategories, updatedKeywordsMap);

    const catObj = getCategory(categoryId, customCategoriesMap);
    showToast(`Restored default keywords for ${catObj.name}`, 'success');
  };

  // Add custom keyword rule
  const handleAddRule = (keyword: string, categoryId: string) => {
    const newRule: CustomRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      keyword: keyword.trim(),
      categoryId,
      createdAt: Date.now(),
    };

    const updated = [newRule, ...customRules];
    setCustomRules(updated);
    saveCustomRules(updated);
    applyCategorizationUpdate(updated, overrides, customCategories, categoryKeywords);
    const catObj = getCategory(categoryId, customCategoriesMap);
    showToast(`Rule added: "${keyword}" → ${catObj.name}`, 'success');
  };

  // Delete custom keyword rule
  const handleDeleteRule = (ruleId: string) => {
    const updated = customRules.filter((r) => r.id !== ruleId);
    setCustomRules(updated);
    saveCustomRules(updated);
    applyCategorizationUpdate(updated, overrides, customCategories, categoryKeywords);
    showToast('Rule removed', 'info');
  };

  // Reset custom rules to empty
  const handleResetRules = () => {
    setCustomRules([]);
    saveCustomRules([]);
    applyCategorizationUpdate([], overrides, customCategories, categoryKeywords);
    showToast('Reset custom rules to defaults', 'info');
  };

  // Inline category update on a specific transaction (automatically updates all items with same name)
  const handleUpdateCategory = (
    transactionId: string,
    categoryId: string,
    description: string,
    createRuleKeyword?: string
  ) => {
    const cleanDesc = description.trim();
    const lowerDesc = cleanDesc.toLowerCase();

    // Find all transactions sharing this exact or trimmed description name
    const sameItems = transactions.filter(
      (t) => t.description.trim().toLowerCase() === lowerDesc
    );

    const updatedOverrides = {
      ...overrides,
      [transactionId]: categoryId,
      [lowerDesc]: categoryId,
      [cleanDesc]: categoryId,
      [description]: categoryId,
    };

    // Apply to all items with the same description
    sameItems.forEach((t) => {
      updatedOverrides[t.id] = categoryId;
    });

    let updatedRules = customRules;
    const ruleKw = createRuleKeyword?.trim() || cleanDesc;
    if (ruleKw && ruleKw.length >= 2) {
      const existingRuleIndex = updatedRules.findIndex(
        (r) => r.keyword.trim().toLowerCase() === ruleKw.toLowerCase()
      );
      if (existingRuleIndex >= 0) {
        updatedRules = updatedRules.map((r, i) =>
          i === existingRuleIndex ? { ...r, categoryId } : r
        );
      } else {
        const newRule: CustomRule = {
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          keyword: ruleKw,
          categoryId,
          createdAt: Date.now(),
        };
        updatedRules = [newRule, ...updatedRules];
      }
      setCustomRules(updatedRules);
      saveCustomRules(updatedRules);
    }

    setOverrides(updatedOverrides);
    saveOverrides(updatedOverrides);
    applyCategorizationUpdate(updatedRules, updatedOverrides, customCategories, categoryKeywords);
    const catObj = getCategory(categoryId, customCategoriesMap);
    const count = Math.max(1, sameItems.length);
    showToast(
      count > 1
        ? `Categorized ${count} transactions with name "${cleanDesc}" as ${catObj.name}`
        : `Categorized "${cleanDesc}" as ${catObj.name}`,
      'success'
    );
  };

  // Batch categorize multiple transactions at once (and all items matching their names)
  const handleBatchCategorize = (
    transactionIds: string[],
    categoryId: string,
    createRuleKeyword?: string
  ) => {
    const updatedOverrides = { ...overrides };
    const targetDescriptions = new Set<string>();

    transactions.forEach((tx) => {
      if (transactionIds.includes(tx.id)) {
        const clean = tx.description.trim();
        targetDescriptions.add(clean.toLowerCase());
        updatedOverrides[tx.id] = categoryId;
        updatedOverrides[clean.toLowerCase()] = categoryId;
        updatedOverrides[clean] = categoryId;
        updatedOverrides[tx.description] = categoryId;
      }
    });

    // Also update any other transactions in the dataset matching these descriptions
    let totalUpdatedCount = 0;
    transactions.forEach((tx) => {
      if (
        transactionIds.includes(tx.id) ||
        targetDescriptions.has(tx.description.trim().toLowerCase())
      ) {
        updatedOverrides[tx.id] = categoryId;
        totalUpdatedCount += 1;
      }
    });

    let updatedRules = customRules;
    if (createRuleKeyword && createRuleKeyword.trim()) {
      const cleanKw = createRuleKeyword.trim();
      const existingRuleIndex = updatedRules.findIndex(
        (r) => r.keyword.trim().toLowerCase() === cleanKw.toLowerCase()
      );
      if (existingRuleIndex >= 0) {
        updatedRules = updatedRules.map((r, i) =>
          i === existingRuleIndex ? { ...r, categoryId } : r
        );
      } else {
        const newRule: CustomRule = {
          id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          keyword: cleanKw,
          categoryId,
          createdAt: Date.now(),
        };
        updatedRules = [newRule, ...customRules];
      }
      setCustomRules(updatedRules);
      saveCustomRules(updatedRules);
    }

    setOverrides(updatedOverrides);
    saveOverrides(updatedOverrides);
    applyCategorizationUpdate(updatedRules, updatedOverrides, customCategories, categoryKeywords);
    const catObj = getCategory(categoryId, customCategoriesMap);
    showToast(
      `Categorized ${totalUpdatedCount} transaction${
        totalUpdatedCount > 1 ? 's' : ''
      } as ${catObj.name}`,
      'success'
    );
  };

  // Trigger modal with prefilled keyword from a transaction description
  const handleCreateRuleFromTx = (merchant: string, currentCatId: string) => {
    // Extract a clean keyword (first 2-3 words)
    const words = merchant
      .replace(/[^a-zA-Z0-9\s*]/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ');

    setModalInitialKeyword(words || merchant);
    setModalInitialCategory(currentCatId || 'food');
    setIsRulesModalOpen(true);
  };

  // Clear data
  const handleClear = () => {
    setTransactions([]);
    clearCachedTransactions();
    showToast('Cleared transaction data', 'info');
  };

  // Export full JSON backup (my_categories_backup.json)
  const handleExportBackup = () => {
    const backup = generateUserDataBackup(
      customCategories,
      customRules,
      categoryKeywords,
      overrides,
      systemSettings
    );
    downloadUserDataBackup(backup);
    showToast('Exported backup to "my_categories_backup.json"', 'success');
  };

  // Import JSON backup
  const handleImportBackup = (backup: UserDataBackup) => {
    setCustomCategories(backup.customCategories);
    saveCustomCategories(backup.customCategories);

    setCustomRules(backup.customRules);
    saveCustomRules(backup.customRules);

    setCategoryKeywords(backup.categoryKeywords);
    saveCategoryKeywords(backup.categoryKeywords);

    setOverrides(backup.overrides);
    saveOverrides(backup.overrides);

    if (backup.settings) {
      setSystemSettings(backup.settings);
      saveSystemSettings(backup.settings);
    }

    applyCategorizationUpdate(
      backup.customRules,
      backup.overrides,
      backup.customCategories,
      backup.categoryKeywords
    );

    showToast(
      `Restored ${backup.customCategories.length} categories and ${backup.customRules.length} rules!`,
      'success'
    );
  };

  // Import JSON backup from a raw file
  const handleImportBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        showToast('Backup file is empty', 'info');
        return;
      }
      const result = parseAndValidateUserDataBackup(content);
      if (result.success && result.data) {
        handleImportBackup(result.data);
      } else {
        showToast(result.error || 'Failed to import JSON backup', 'info');
      }
    };
    reader.readAsText(file);
  };

  // Reset to default config from user_data.json
  const handleResetToDefaults = () => {
    const defaults = getDefaultUserData();
    handleImportBackup(defaults);
    showToast('Reset all categories & rules to user_data.json defaults', 'info');
  };

  // Export categorized CSV
  const handleExportCsv = () => {
    if (transactions.length === 0) return;

    const headers = [
      'Transaction Date',
      'Transaction Description',
      'Category',
      'Debit Amount',
      'Credit Amount',
      'Match Reason',
    ];

    const rows = transactions.map((tx) => {
      const catObj = getCategory(tx.category, customCategoriesMap);
      return [
        `"${tx.displayDate}"`,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${catObj.name || tx.category}"`,
        tx.debitAmount !== null ? tx.debitAmount.toFixed(2) : '',
        tx.creditAmount !== null ? tx.creditAmount.toFixed(2) : '',
        `"${(tx.matchReason || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_of_Scotland_Categorized_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported categorized CSV file', 'success');
  };

  // Handler for explicit date calculation button
  const handleApplyDateRange = (startDate: string, endDate: string, monthKey: string = 'custom') => {
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedMonth(monthKey);

    let rangeLabel = 'All transactions';
    if (startDate && endDate) {
      rangeLabel = `${startDate} to ${endDate}`;
    } else if (startDate) {
      rangeLabel = `from ${startDate}`;
    } else if (endDate) {
      rangeLabel = `up to ${endDate}`;
    }

    showToast(`Recalculated overview for ${rangeLabel}`, 'success');
  };

  // Handler to reset date range
  const handleResetDateRange = () => {
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedMonth('all');
    showToast('Reset date filters. Showing all transactions.', 'info');
  };

  // Filter transactions strictly by the calculated date range
  const dateCalculatedTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (appliedStartDate && tx.date < appliedStartDate) {
        return false;
      }
      if (appliedEndDate && tx.date > appliedEndDate) {
        return false;
      }
      return true;
    });
  }, [transactions, appliedStartDate, appliedEndDate]);

  // Calculate high-level KPIs based strictly on the selected/calculated date period
  const summary: SpendingSummary = useMemo(() => {
    let totalOutflows = 0;
    let totalInflows = 0;
    let totalSaved = 0;
    let uncategorizedCount = 0;
    let uncategorizedAmount = 0;

    dateCalculatedTransactions.forEach((tx) => {
      if (tx.type === 'debit' && tx.debitAmount) {
        totalOutflows += tx.debitAmount;
        if (tx.category === 'savings') {
          totalSaved += tx.debitAmount;
        }
        if (tx.category === 'uncategorized') {
          uncategorizedCount++;
          uncategorizedAmount += tx.debitAmount;
        }
      } else if (tx.type === 'credit' && tx.creditAmount) {
        totalInflows += tx.creditAmount;
      }
    });

    const outflowsExcludingSavings = Math.max(0, totalOutflows - totalSaved);
    const netCashFlow = totalInflows - totalOutflows;
    const savingsRate = totalInflows > 0 ? (totalSaved / totalInflows) * 100 : 0;

    return {
      totalOutflows,
      totalInflows,
      totalSaved,
      outflowsExcludingSavings,
      netCashFlow,
      savingsRate: Math.round(savingsRate * 10) / 10,
      transactionCount: dateCalculatedTransactions.length,
      uncategorizedCount,
      uncategorizedAmount,
    };
  }, [dateCalculatedTransactions]);

  // Calculate Category Breakdown for charts (outflows only for the calculated date period)
  const categoryBreakdownData: CategoryBreakdownItem[] = useMemo(() => {
    const catMap: Record<string, { amount: number; count: number }> = {};

    dateCalculatedTransactions
      .filter((tx) => tx.type === 'debit')
      .forEach((tx) => {
        if (!catMap[tx.category]) {
          catMap[tx.category] = { amount: 0, count: 0 };
        }
        catMap[tx.category].amount += tx.amount;
        catMap[tx.category].count += 1;
      });

    const totalDebitAmount = summary.totalOutflows || 1;

    return Object.entries(catMap)
      .map(([catId, data]) => {
        const cat = getCategory(catId, customCategoriesMap);
        return {
          id: catId,
          name: cat.name,
          amount: data.amount,
          count: data.count,
          percentage: (data.amount / totalDebitAmount) * 100,
          color: cat.color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [dateCalculatedTransactions, summary.totalOutflows, customCategoriesMap]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        transactionCount={transactions.length}
        onLoadDemo={() => loadSampleData()}
        onFileUpload={handleFileUpload}
        onOpenRules={() => {
          setModalInitialKeyword('');
          setIsRulesModalOpen(true);
        }}
        onOpenCategories={() => setIsCategoryManagerOpen(true)}
        onClear={handleClear}
        onExportCsv={handleExportCsv}
        hasData={transactions.length > 0}
        ruleCount={customRules.length}
        customCategoryCount={customCategories.length}
        uncategorizedCount={summary.uncategorizedCount}
        onOpenUncategorizedReview={() => setIsUncategorizedModalOpen(true)}
        onOpenDataManagement={() => setIsDataManagementOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackupFile={handleImportBackupFile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-medium shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {transactions.length === 0 ? (
          <Dropzone
            onFileUpload={handleFileUpload}
            onLoadDemo={() => loadSampleData()}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Date Range & Month Calculation Filter Bar */}
            <DateRangeCalculatorBar
              transactions={transactions}
              appliedStartDate={appliedStartDate}
              appliedEndDate={appliedEndDate}
              appliedMonth={appliedMonth}
              onApplyDateRange={handleApplyDateRange}
              onResetDates={handleResetDateRange}
              activeTransactionCount={dateCalculatedTransactions.length}
              totalTransactionCount={transactions.length}
            />

            {/* KPI Summary Cards (Recalculated for selected date range) */}
            <KpiCards
              summary={summary}
              onFilterUncategorized={() => {
                setFilters((prev) => ({
                  ...prev,
                  category: 'uncategorized',
                }));
                // Smoothly scroll to transaction table
                const el = document.getElementById('tx-search-input');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenReviewModal={() => setIsUncategorizedModalOpen(true)}
            />

            {/* Visual Analytics & Breakdown (Recalculated for selected date range) */}
            <ChartsSection
              categoryData={categoryBreakdownData}
              transactions={dateCalculatedTransactions}
              selectedCategory={filters.category}
              onSelectCategory={(catId) => {
                setFilters((prev) => ({
                  ...prev,
                  category: catId,
                }));
              }}
              onOpenCreateCategory={() => setIsCategoryManagerOpen(true)}
            />

            {/* Filterable, Sortable Transaction Table (Filtered by calculated date range) */}
            <TransactionTable
              transactions={dateCalculatedTransactions}
              filters={filters}
              customCategories={customCategories}
              onFilterChange={(newFilters) =>
                setFilters((prev) => ({ ...prev, ...newFilters }))
              }
              onUpdateCategory={handleUpdateCategory}
              onCreateRuleFromTx={handleCreateRuleFromTx}
              onOpenReviewModal={() => setIsUncategorizedModalOpen(true)}
              onOpenCreateCategory={() => setIsCategoryManagerOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Settings & Data Persistence Modal */}
      <DataManagementModal
        isOpen={isDataManagementOpen}
        onClose={() => setIsDataManagementOpen(false)}
        customCategories={customCategories}
        customRules={customRules}
        categoryKeywords={categoryKeywords}
        overrides={overrides}
        settings={systemSettings}
        onImportBackup={handleImportBackup}
        onResetToDefaults={handleResetToDefaults}
        showToast={showToast}
      />

      {/* Custom Category Creation & Management Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        customCategories={customCategories}
        categoryKeywords={categoryKeywords}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onRemoveKeywordFromCategory={handleRemoveKeywordFromCategory}
        onAddKeywordToCategory={handleAddKeywordToCategory}
        onResetCategoryKeywords={handleResetCategoryKeywords}
        transactions={transactions}
      />

      {/* Uncategorized Review & Batch Categorization Modal */}
      <UncategorizedReviewModal
        isOpen={isUncategorizedModalOpen}
        onClose={() => setIsUncategorizedModalOpen(false)}
        transactions={transactions}
        customCategories={customCategories}
        onOpenCreateCategory={() => setIsCategoryManagerOpen(true)}
        onUpdateCategory={handleUpdateCategory}
        onBatchCategorize={handleBatchCategorize}
        onCreateRule={handleAddRule}
      />

      {/* Custom Keyword Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        customRules={customRules}
        customCategories={customCategories}
        categoryKeywords={categoryKeywords}
        onOpenCreateCategory={() => setIsCategoryManagerOpen(true)}
        onAddRule={handleAddRule}
        onDeleteRule={handleDeleteRule}
        onResetRules={handleResetRules}
        onRemoveKeywordFromCategory={handleRemoveKeywordFromCategory}
        onAddKeywordToCategory={handleAddKeywordToCategory}
        onResetCategoryKeywords={handleResetCategoryKeywords}
        initialKeyword={modalInitialKeyword}
        initialCategory={modalInitialCategory}
      />
    </div>
  );
}
