import React, { useState, useMemo } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  CheckSquare,
  Square,
  Plus,
  Bookmark,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Transaction, CategoryDefinition } from '../types';
import { CATEGORY_LIST, getCategory } from '../constants/categories';

interface UncategorizedReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  customCategories?: CategoryDefinition[];
  onOpenCreateCategory?: () => void;
  onUpdateCategory: (
    transactionId: string,
    categoryId: string,
    description: string,
    createRuleKeyword?: string
  ) => void;
  onBatchCategorize: (
    transactionIds: string[],
    categoryId: string,
    createRuleKeyword?: string
  ) => void;
  onCreateRule: (keyword: string, categoryId: string) => void;
}

export const UncategorizedReviewModal: React.FC<UncategorizedReviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  customCategories = [],
  onOpenCreateCategory,
  onUpdateCategory,
  onBatchCategorize,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [createRuleWithAssign, setCreateRuleWithAssign] = useState<boolean>(true);
  const [bulkSelectCategory, setBulkSelectCategory] = useState('');

  // Extract all currently uncategorized transactions
  const uncategorizedList = useMemo(() => {
    return transactions.filter((tx) => tx.category === 'uncategorized');
  }, [transactions]);

  const builtInCategories = useMemo(() => {
    return CATEGORY_LIST.filter((c) => c.id !== 'uncategorized');
  }, []);

  const customCategoriesMap = useMemo(() => {
    return customCategories.reduce<Record<string, CategoryDefinition>>((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [customCategories]);

  // Filtered by local search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return uncategorizedList;
    const q = searchQuery.toLowerCase().trim();
    return uncategorizedList.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        tx.displayDate.includes(q) ||
        (tx.debitAmount && tx.debitAmount.toString().includes(q)) ||
        (tx.creditAmount && tx.creditAmount.toString().includes(q))
    );
  }, [uncategorizedList, searchQuery]);

  // Total value of uncategorized
  const totalAmount = useMemo(() => {
    return uncategorizedList.reduce((sum, tx) => {
      const val = tx.debitAmount ?? tx.creditAmount ?? 0;
      return sum + val;
    }, 0);
  }, [uncategorizedList]);

  // Count occurrences of each description name among uncategorized
  const nameCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    uncategorizedList.forEach((tx) => {
      const key = tx.description.trim().toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [uncategorizedList]);

  // Clean keyword extractor for rule creation
  const extractCleanKeyword = (description: string): string => {
    return description
      .replace(/[^a-zA-Z0-9\s*]/g, ' ')
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(' ')
      .trim();
  };

  const formatGBP = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedTxIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedTxIds(updated);
  };

  const handleSelectAllFiltered = () => {
    if (selectedTxIds.size === filteredList.length && filteredList.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(filteredList.map((tx) => tx.id)));
    }
  };

  // Assign category for a single transaction from the dropdown
  const handleCategorySelect = (tx: Transaction, catId: string) => {
    if (!catId) return;
    const cleanKeyword = extractCleanKeyword(tx.description);
    const ruleKeyword = createRuleWithAssign && cleanKeyword.length >= 3 ? cleanKeyword : undefined;
    
    onUpdateCategory(tx.id, catId, tx.description, ruleKeyword);
  };

  // Batch assign selected transactions
  const handleBatchAssign = (catId: string) => {
    if (selectedTxIds.size === 0 || !catId) return;
    const ids = Array.from(selectedTxIds);
    onBatchCategorize(ids, catId);
    setSelectedTxIds(new Set());
    setBulkSelectCategory('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Uncategorized Transactions Review
                </h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {uncategorizedList.length} items ({formatGBP(totalAmount)})
                </span>
                {customCategories.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Bookmark className="w-3 h-3" />
                    {customCategories.length} Custom Categor{customCategories.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select a category from the dropdown. Choosing a category will automatically apply it to all transactions with the same name.
              </p>
            </div>
          </div>

          <button
            id="close-uncategorized-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {uncategorizedList.length === 0 ? (
            /* Empty / Celebration State */
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  All Transactions Categorized!
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  There are no uncategorized transactions left. All category totals, charts, and net cash flow are up to date.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Controls Toolbar: Search & Auto-rule Toggle */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by merchant, description, or amount..."
                    className="w-full pl-9 pr-7 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all placeholder:text-slate-400 text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Auto Rule Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={createRuleWithAssign}
                    onChange={(e) => setCreateRuleWithAssign(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Auto-save keyword rule for future transactions</span>
                </label>
              </div>

              {/* Clean Bulk Actions Bar */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    {selectedTxIds.size === filteredList.length && filteredList.length > 0 ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Select All ({filteredList.length})</span>
                      </>
                    )}
                  </button>

                  {selectedTxIds.size > 0 && (
                    <span className="text-xs font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                      {selectedTxIds.size} selected
                    </span>
                  )}
                </div>

                {/* Bulk Category Selection Dropdown */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-900">
                    Bulk Assign Selected:
                  </span>
                  <select
                    value={bulkSelectCategory}
                    disabled={selectedTxIds.size === 0}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBulkSelectCategory(val);
                      if (val) {
                        handleBatchAssign(val);
                      }
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-emerald-400 text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Choose Category --</option>
                    {customCategories.length > 0 && (
                      <optgroup label="⭐ Custom Categories">
                        {customCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            ⭐ {cat.name} (Custom)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Standard Categories">
                      {builtInCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {onOpenCreateCategory && (
                    <button
                      type="button"
                      onClick={onOpenCreateCategory}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                      title="Create a new category"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ New Category</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>Transactions ({filteredList.length})</span>
                  <span>Select Category</span>
                </div>

                {filteredList.map((tx) => {
                  const isSelected = selectedTxIds.has(tx.id);
                  const isDebit = tx.type === 'debit';
                  const amountVal = isDebit ? tx.debitAmount : tx.creditAmount;
                  const cleanKeyword = extractCleanKeyword(tx.description);
                  const sameNameCount = nameCounts[tx.description.trim().toLowerCase()] || 1;

                  return (
                    <div
                      key={tx.id}
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-400 ring-1 ring-emerald-400/40 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* Left: Checkbox + Date + Description + Amount */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 shrink-0 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-slate-500 font-semibold">
                              {tx.displayDate}
                            </span>
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                                isDebit
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isDebit ? `-${formatGBP(amountVal)}` : `+${formatGBP(amountVal)}`}
                            </span>
                            {sameNameCount > 1 && (
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                                title={`Selecting a category will automatically apply to all ${sameNameCount} identical transactions`}
                              >
                                {sameNameCount} identical items (will auto-categorize all)
                              </span>
                            )}
                          </div>

                          <div
                            className="font-semibold text-slate-900 text-xs sm:text-sm truncate mt-0.5"
                            title={tx.description}
                          >
                            {tx.description}
                          </div>
                          {cleanKeyword && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Keyword: <span className="font-medium text-slate-600">"{cleanKeyword}"</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Clean, Uncluttered Dropdown Selector */}
                      <div className="shrink-0 flex items-center gap-2">
                        <select
                          value=""
                          onChange={(e) => {
                            const selectedCat = e.target.value;
                            if (selectedCat) {
                              handleCategorySelect(tx, selectedCat);
                            }
                          }}
                          className="w-full sm:w-56 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 hover:bg-white hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          <option value="" disabled>
                            -- Choose Category --
                          </option>
                          {customCategories.length > 0 && (
                            <optgroup label="⭐ Custom Categories">
                              {customCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  ⭐ {cat.name} (Custom)
                                </option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Standard Categories">
                            {builtInCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {uncategorizedList.length} uncategorized transaction{uncategorizedList.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
