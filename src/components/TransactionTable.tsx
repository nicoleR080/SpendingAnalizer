import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  Tag,
  PlusCircle,
  Calendar,
  X,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { CategoryDefinition, FilterOptions, SortField, Transaction } from '../types';
import { CATEGORIES, CATEGORY_LIST, getCategory } from '../constants/categories';
import { AlertCircle, Wand2 } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  filters: FilterOptions;
  customCategories?: CategoryDefinition[];
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onUpdateCategory: (transactionId: string, categoryId: string, description: string) => void;
  onCreateRuleFromTx: (merchant: string, categoryId: string) => void;
  onOpenReviewModal?: () => void;
  onOpenCreateCategory?: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  filters,
  customCategories = [],
  onFilterChange,
  onUpdateCategory,
  onCreateRuleFromTx,
  onOpenReviewModal,
  onOpenCreateCategory,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [activeDropdownTxId, setActiveDropdownTxId] = useState<string | null>(null);

  const customCategoriesMap = useMemo(() => {
    return customCategories.reduce<Record<string, CategoryDefinition>>((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [customCategories]);

  const allCategoryList = useMemo(() => {
    return [...CATEGORY_LIST, ...customCategories];
  }, [customCategories]);

  const formatGBP = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search term
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const catObj = getCategory(tx.category, customCategoriesMap);
        const matchesCat = (catObj?.name || '').toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat) return false;
      }

      // Category filter
      if (filters.category !== 'all' && tx.category !== filters.category) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }

      // Date range filter
      if (filters.startDate && tx.date < filters.startDate) {
        return false;
      }
      if (filters.endDate && tx.date > filters.endDate) {
        return false;
      }

      // Amount filter
      if (filters.minAmount !== undefined && tx.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && tx.amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (filters.sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (filters.sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (filters.sortField === 'description') {
        comparison = a.description.localeCompare(b.description);
      } else if (filters.sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredTransactions, filters.sortField, filters.sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const handleSort = (field: SortField) => {
    if (filters.sortField === field) {
      onFilterChange({
        sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onFilterChange({
        sortField: field,
        sortOrder: 'desc',
      });
    }
  };

  const getSortIcon = (field: SortField) => {
    if (filters.sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    }
    return filters.sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Controls / Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="tx-search-input"
              value={filters.search}
              onChange={(e) => {
                onFilterChange({ search: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="Search description, payee or category (e.g. Asda, Loan, Spotify)..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all placeholder:text-slate-400"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Type & Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs">
              <button
                id="filter-type-all"
                onClick={() => {
                  onFilterChange({ type: 'all' });
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  filters.type === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                id="filter-type-debits"
                onClick={() => {
                  onFilterChange({ type: 'debit' });
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  filters.type === 'debit'
                    ? 'bg-white text-rose-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Debits
              </button>
              <button
                id="filter-type-credits"
                onClick={() => {
                  onFilterChange({ type: 'credit' });
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                  filters.type === 'credit'
                    ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Credits
              </button>
            </div>

            {/* Date range inputs */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="bg-transparent text-xs focus:outline-none"
                title="Start date"
              />
              <span className="text-slate-300">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="bg-transparent text-xs focus:outline-none"
                title="End date"
              />
              {(filters.startDate || filters.endDate) && (
                <button
                  onClick={() => onFilterChange({ startDate: '', endDate: '' })}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills & Action Buttons */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                onFilterChange({ category: 'all' });
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-full font-medium shrink-0 transition-colors ${
                filters.category === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Categories ({transactions.length})
            </button>
            {allCategoryList.map((cat) => {
              const count = transactions.filter((t) => t.category === cat.id).length;
              const isSelected = filters.category === cat.id;
              const isUncategorized = cat.id === 'uncategorized';

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onFilterChange({ category: isSelected ? 'all' : cat.id });
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium shrink-0 border transition-all ${
                    isSelected
                      ? `${cat.badgeBg} ring-2 ring-slate-900/10 font-bold`
                      : isUncategorized && count > 0
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold hover:bg-amber-200'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-semibold ${isUncategorized && count > 0 ? 'text-amber-900 font-bold' : 'opacity-75'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}

            {/* Quick Add Category Button in Filter Bar */}
            {onOpenCreateCategory && (
              <button
                id="table-create-category-btn"
                type="button"
                onClick={onOpenCreateCategory}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold shrink-0 border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                title="Create a new custom category"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ New Category</span>
              </button>
            )}
          </div>

          {onOpenReviewModal && transactions.some((t) => t.category === 'uncategorized') && (
            <button
              type="button"
              onClick={onOpenReviewModal}
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-bold text-xs shadow-2xs transition-colors shrink-0 ml-auto"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Review Uncategorized</span>
            </button>
          )}
        </div>

        {/* Uncategorized active banner */}
        {filters.category === 'uncategorized' && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-950 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Showing <strong>{filteredTransactions.length} uncategorized</strong> transactions. Click any row's category tag to assign it.
              </span>
            </div>
            {onOpenReviewModal && (
              <button
                onClick={onOpenReviewModal}
                className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-2xs"
              >
                Open 1-Click Review Assistant
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-28"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date</span>
                  {getSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleSort('description')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Transaction Description</span>
                  {getSortIcon('description')}
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors w-48"
              >
                <div className="flex items-center gap-1.5">
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-right w-32"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Debit Amount</span>
                  {getSortIcon('amount')}
                </div>
              </th>
              <th className="py-3 px-4 text-right w-32">Credit Amount</th>
              <th className="py-3 px-4 text-center w-20">Rule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const cat = getCategory(tx.category, customCategoriesMap);
                const isDropdownOpen = activeDropdownTxId === tx.id;

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {tx.displayDate}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 group-hover:text-slate-950">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{tx.matchReason}</span>
                        {tx.isOverridden && (
                          <span className="text-[10px] px-1 py-0.2 bg-purple-50 text-purple-700 font-semibold rounded">
                            Manual
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category with Inline Dropdown */}
                    <td className="py-3 px-4 relative">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveDropdownTxId(isDropdownOpen ? null : tx.id)
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${cat.badgeBg} hover:opacity-90 cursor-pointer shadow-2xs`}
                          title="Click to modify category or create rule"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate max-w-[120px]">{cat.name}</span>
                          <Tag className="w-3 h-3 ml-0.5 opacity-60" />
                        </button>

                        {/* Inline Dropdown Popover */}
                        {isDropdownOpen && (
                          <div
                            className="absolute z-50 left-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 ring-1 ring-black/5"
                            onMouseLeave={() => setActiveDropdownTxId(null)}
                          >
                            <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                              <span>Change Category</span>
                              {customCategories.length > 0 && (
                                <span className="text-[10px] text-emerald-600 font-bold">
                                  +{customCategories.length} custom
                                </span>
                              )}
                            </div>
                            <div className="max-h-52 overflow-y-auto">
                              {allCategoryList.map((c) => {
                                const isCurrent = tx.category === c.id;
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => {
                                      onUpdateCategory(tx.id, c.id, tx.description);
                                      setActiveDropdownTxId(null);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                      isCurrent
                                        ? 'font-bold text-slate-900 bg-slate-50/70'
                                        : 'text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: c.color }}
                                      />
                                      <span className="truncate">{c.name}</span>
                                      {c.isCustom && (
                                        <span className="text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 rounded font-semibold shrink-0">
                                          Custom
                                        </span>
                                      )}
                                    </div>
                                    {isCurrent && (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="border-t border-slate-100 mt-1 pt-1 px-2 space-y-1">
                              {onOpenCreateCategory && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onOpenCreateCategory();
                                    setActiveDropdownTxId(null);
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Create New Category</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  onCreateRuleFromTx(tx.description, tx.category);
                                  setActiveDropdownTxId(null);
                                }}
                                className="w-full text-left px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors"
                              >
                                <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span>Create Keyword Rule</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Debit Amount */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {tx.debitAmount !== null ? (
                        <span className="text-rose-600 font-semibold">
                          -{formatGBP(tx.debitAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Credit Amount */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {tx.creditAmount !== null ? (
                        <span className="text-emerald-600 font-semibold">
                          +{formatGBP(tx.creditAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Quick Action / Rule creation */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onCreateRuleFromTx(tx.description, tx.category)}
                        className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title={`Make rule for "${tx.description.slice(0, 15)}..."`}
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {filteredTransactions.length > 0
              ? (currentPage - 1) * pageSize + 1
              : 0}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(currentPage * pageSize, filteredTransactions.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-900">
            {filteredTransactions.length}
          </span>{' '}
          transactions
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
