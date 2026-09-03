import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  Search,
  Sparkles,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { CategoryDefinition, CustomRule } from '../types';
import { CATEGORIES, CATEGORY_LIST, getCategory } from '../constants/categories';
import { categorizeDescription, getActiveKeywordsForCategory } from '../utils/categorizer';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customRules: CustomRule[];
  customCategories?: CategoryDefinition[];
  categoryKeywords?: Record<string, string[]>;
  onOpenCreateCategory?: () => void;
  onAddRule: (keyword: string, categoryId: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onResetRules: () => void;
  onRemoveKeywordFromCategory?: (categoryId: string, keyword: string) => void;
  onAddKeywordToCategory?: (categoryId: string, keyword: string) => void;
  onResetCategoryKeywords?: (categoryId: string) => void;
  initialKeyword?: string;
  initialCategory?: string;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  isOpen,
  onClose,
  customRules,
  customCategories = [],
  categoryKeywords = {},
  onOpenCreateCategory,
  onAddRule,
  onDeleteRule,
  onResetRules,
  onRemoveKeywordFromCategory,
  onAddKeywordToCategory,
  onResetCategoryKeywords,
  initialKeyword = '',
  initialCategory = 'food',
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'categoryKeywords' | 'test'>('custom');
  const [newKeyword, setNewKeyword] = useState(initialKeyword);
  const [newCategory, setNewCategory] = useState(initialCategory);
  const [testDescription, setTestDescription] = useState('AMAZON EU SARL');
  const [testType, setTestType] = useState<'debit' | 'credit'>('debit');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryKeywordSearch, setCategoryKeywordSearch] = useState('');
  const [inlineCategoryInputs, setInlineCategoryInputs] = useState<Record<string, string>>({});

  const customCategoriesMap = React.useMemo(() => {
    return customCategories.reduce<Record<string, CategoryDefinition>>((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [customCategories]);

  const allCategoryList = React.useMemo(() => {
    return [...CATEGORY_LIST, ...customCategories];
  }, [customCategories]);

  // Sync initialKeyword if modal opened with prefill
  React.useEffect(() => {
    if (initialKeyword) {
      setNewKeyword(initialKeyword);
    }
    if (initialCategory) {
      setNewCategory(initialCategory);
    }
  }, [initialKeyword, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onAddRule(newKeyword.trim(), newCategory);
    setNewKeyword('');
  };

  const handleInlineAddKeyword = (categoryId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = (inlineCategoryInputs[categoryId] || '').trim();
    if (!val || !onAddKeywordToCategory) return;
    onAddKeywordToCategory(categoryId, val);
    setInlineCategoryInputs((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const testResult = categorizeDescription(
    testDescription,
    testType,
    customRules,
    customCategories,
    categoryKeywords
  );
  const testCat = getCategory(testResult.category, customCategoriesMap);

  const filteredCustomRules = customRules.filter((r) =>
    r.keyword.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Sliders className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rule-Based Categorization Engine
              </h3>
              <p className="text-xs text-slate-500">
                Custom rules, category keywords & keyword removal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="px-5 border-b border-slate-200 flex space-x-6 text-xs font-semibold bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'custom'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Custom Keyword Rules</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {customRules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categoryKeywords')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'categoryKeywords'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Category Keywords & Bank Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'test'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rule Tester</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'custom' && (
            <div>
              {/* Add New Rule Form */}
              <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Add New Keyword Rule
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Merchant Keyword (case-insensitive)
                    </label>
                    <input
                      type="text"
                      id="new-rule-keyword-input"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="e.g. eBay, Sainsbury, PureGym..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Assign To Category
                      </label>
                      {onOpenCreateCategory && (
                        <button
                          type="button"
                          onClick={onOpenCreateCategory}
                          className="text-[10px] text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>New Category</span>
                        </button>
                      )}
                    </div>
                    <select
                      id="new-rule-category-select"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    >
                      {allCategoryList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.isCustom ? '(Custom)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      disabled={!newKeyword.trim()}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* List of Custom Rules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Active Custom Rules ({customRules.length})
                  </h4>
                  {customRules.length > 0 && (
                    <div className="relative w-48">
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search rules..."
                        className="w-full pl-7 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {customRules.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <Sliders className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-700">No custom rules added yet</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Add a merchant keyword above to automatically categorize specific transactions and persist them across sessions.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {filteredCustomRules.map((rule) => {
                      const cat = getCategory(rule.categoryId, customCategoriesMap);
                      return (
                        <div
                          key={rule.id}
                          className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate">
                              "{rule.keyword}"
                            </span>
                            <span className="text-slate-400">maps to</span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cat.badgeBg}`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span>{cat.name}</span>
                            </span>
                          </div>
                          <button
                            onClick={() => onDeleteRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'categoryKeywords' && (
            <div className="space-y-4">
              {/* Informational Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Category Keyword Rules</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click the <span className="font-bold text-rose-600">×</span> on any keyword tag to remove it from that category. You can also add new keywords directly below.
                  </p>
                </div>

                <div className="relative w-full sm:w-60 shrink-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={categoryKeywordSearch}
                    onChange={(e) => setCategoryKeywordSearch(e.target.value)}
                    placeholder="Search keywords or categories..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              {/* Category Keywords List */}
              <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {allCategoryList
                  .filter((cat) => cat.id !== 'uncategorized')
                  .filter((cat) => {
                    if (!categoryKeywordSearch) return true;
                    const searchLower = categoryKeywordSearch.toLowerCase();
                    const nameMatches = cat.name.toLowerCase().includes(searchLower);
                    const activeKws = getActiveKeywordsForCategory(cat.id, categoryKeywords, customCategories);
                    const kwMatches = activeKws.some((k) => k.toLowerCase().includes(searchLower));
                    return nameMatches || kwMatches;
                  })
                  .map((cat) => {
                    const activeKeywords = getActiveKeywordsForCategory(cat.id, categoryKeywords, customCategories);
                    const defaultKeywords = cat.defaultKeywords || [];
                    const removedCount = defaultKeywords.filter(
                      (dkw) => !activeKeywords.some((akw) => akw.toLowerCase() === dkw.toLowerCase())
                    ).length;
                    const isCustom = Boolean(cat.isCustom);

                    return (
                      <div
                        key={cat.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-all"
                      >
                        {/* Header of category card */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs font-bold text-slate-900">
                              {cat.name}
                            </span>
                            {isCustom && (
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Custom
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 rounded bg-slate-100">
                              {activeKeywords.length} active keyword{activeKeywords.length === 1 ? '' : 's'}
                            </span>
                          </div>

                          {/* Reset keywords button if any defaults were removed */}
                          {removedCount > 0 && onResetCategoryKeywords && (
                            <button
                              type="button"
                              onClick={() => onResetCategoryKeywords(cat.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                              title="Restore all original default keywords for this category"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore {removedCount} removed default{removedCount > 1 ? 's' : ''}</span>
                            </button>
                          )}
                        </div>

                        {/* Inline Add Keyword for this specific category */}
                        {onAddKeywordToCategory && (
                          <form
                            onSubmit={(e) => handleInlineAddKeyword(cat.id, e)}
                            className="flex items-center gap-2 mb-3"
                          >
                            <input
                              type="text"
                              value={inlineCategoryInputs[cat.id] || ''}
                              onChange={(e) =>
                                setInlineCategoryInputs((prev) => ({
                                  ...prev,
                                  [cat.id]: e.target.value,
                                }))
                              }
                              placeholder={`+ Add keyword to ${cat.name}...`}
                              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 flex-1"
                            />
                            <button
                              type="submit"
                              disabled={!(inlineCategoryInputs[cat.id] || '').trim()}
                              className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </form>
                        )}

                        {/* Keywords Tag Grid with explicit removal button */}
                        {activeKeywords.length === 0 ? (
                          <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
                            <p className="text-xs text-slate-500">
                              No active keywords for this category. Transactions will not auto-match.
                            </p>
                            {defaultKeywords.length > 0 && onResetCategoryKeywords && (
                              <button
                                type="button"
                                onClick={() => onResetCategoryKeywords(cat.id)}
                                className="mt-1.5 text-xs text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore default keywords</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {activeKeywords.map((kw) => (
                              <span
                                key={kw}
                                className="group inline-flex items-center gap-1 text-[11px] pl-2 pr-1 py-0.5 rounded-lg bg-slate-50 text-slate-800 border border-slate-200 font-mono hover:border-slate-300 hover:bg-slate-100 transition-colors"
                              >
                                <span>{kw}</span>
                                {onRemoveKeywordFromCategory && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveKeywordFromCategory(cat.id, kw)}
                                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title={`Remove "${kw}" from ${cat.name}`}
                                    aria-label={`Remove "${kw}" from ${cat.name}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Live Rule Simulator
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Type any merchant string to see how the engine processes it with current rules and active keywords:
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Transaction Description:
                    </label>
                    <input
                      type="text"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                      placeholder="e.g. TRADING 212 UK LTD..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 font-medium">Type:</span>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={testType === 'debit'}
                        onChange={() => setTestType('debit')}
                      />
                      <span>Debit (Outflow)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={testType === 'credit'}
                        onChange={() => setTestType('credit')}
                      />
                      <span>Credit (Inflow)</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Result:
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${testCat.badgeBg}`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: testCat.color }}
                          />
                          <span>{testCat.name}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Reason: <span className="font-semibold text-slate-700">{testResult.matchReason}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={onResetRules}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Custom Rules</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
