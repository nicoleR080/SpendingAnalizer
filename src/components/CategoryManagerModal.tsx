import React, { useState } from 'react';
import {
  X,
  Tag,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FolderPlus,
  Sparkles,
  Info,
  RotateCcw,
} from 'lucide-react';
import { CategoryDefinition, Transaction } from '../types';
import { CATEGORIES, PALETTE_OPTIONS, createCustomCategoryDefinition } from '../constants/categories';
import { getActiveKeywordsForCategory } from '../utils/categorizer';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CategoryDefinition[];
  categoryKeywords?: Record<string, string[]>;
  onAddCategory: (category: CategoryDefinition) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRemoveKeywordFromCategory?: (categoryId: string, keyword: string) => void;
  onAddKeywordToCategory?: (categoryId: string, keyword: string) => void;
  onResetCategoryKeywords?: (categoryId: string) => void;
  transactions?: Transaction[];
  initialOpenInCreateMode?: boolean;
}

const PRESET_SUGGESTIONS = [
  { name: 'Holidays & Travel', colorIdx: 0, keywords: 'hotel, airbnb, booking, flight, easyjet, ryanair, travel' },
  { name: 'Health & Gym', colorIdx: 1, keywords: 'gym, puregym, boots, pharmacy, doctor, dentist, fitness' },
  { name: 'Pet Care', colorIdx: 2, keywords: 'vet, pets at home, rover, pet, zooplus' },
  { name: 'Car & Transport', colorIdx: 4, keywords: 'fuel, bp, shell, petrol, trainline, parking, dvla, mot' },
  { name: 'Education & Courses', colorIdx: 5, keywords: 'course, udemy, book, tuition, university, training' },
  { name: 'Subscriptions', colorIdx: 6, keywords: 'patreon, substack, apple, icloud, storage, adobe' },
  { name: 'Personal Care', colorIdx: 7, keywords: 'hairdresser, barber, salon, cosmetics, spa, skincare' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  customCategories,
  categoryKeywords = {},
  onAddCategory,
  onDeleteCategory,
  onRemoveKeywordFromCategory,
  onAddKeywordToCategory,
  onResetCategoryKeywords,
  transactions = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inlineInputs, setInlineInputs] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Calculate transaction count per category
  const txCountByCategory: Record<string, number> = {};
  (transactions || []).forEach((tx) => {
    txCountByCategory[tx.category] = (txCountByCategory[tx.category] || 0) + 1;
  });

  const handleApplyPreset = (preset: typeof PRESET_SUGGESTIONS[0]) => {
    setName(preset.name);
    setSelectedColorIndex(preset.colorIdx);
    setKeywordsText(preset.keywords);
    setDescription(`Transactions related to ${preset.name.toLowerCase()}`);
    setError(null);
  };

  const handleInlineAdd = (categoryId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = (inlineInputs[categoryId] || '').trim();
    if (!val || !onAddKeywordToCategory) return;
    onAddKeywordToCategory(categoryId, val);
    setInlineInputs((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setError('Please enter a category name.');
      return;
    }

    // Generate slug ID
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      setError('Invalid category name.');
      return;
    }

    // Check collision with built-in or existing custom categories
    if (CATEGORIES[slug]) {
      setError(`"${cleanName}" conflicts with a built-in category name. Please choose another name.`);
      return;
    }

    if (customCategories.some((c) => c.id === slug)) {
      setError(`A category with this name already exists.`);
      return;
    }

    const keywordList = keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const colorOption = PALETTE_OPTIONS[selectedColorIndex] || PALETTE_OPTIONS[0];

    const newCategory = createCustomCategoryDefinition(
      slug,
      cleanName,
      description.trim(),
      colorOption,
      keywordList
    );

    onAddCategory(newCategory);

    // Reset form
    setName('');
    setDescription('');
    setKeywordsText('');
    setSelectedColorIndex(0);
    setError(null);
  };

  const selectedPalette = PALETTE_OPTIONS[selectedColorIndex] || PALETTE_OPTIONS[0];
  const builtInList = Object.values(CATEGORIES).filter((c) => c.id !== 'uncategorized');

  const filteredCustom = customCategories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (getActiveKeywordsForCategory(c.id, categoryKeywords, customCategories).some((k) =>
        k.toLowerCase().includes(searchTerm.toLowerCase())
      ))
  );

  const filteredBuiltIn = builtInList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getActiveKeywordsForCategory(c.id, categoryKeywords, customCategories).some((k) =>
        k.toLowerCase().includes(searchTerm.toLowerCase())
      ))
  );

  return (
    <div
      id="category-manager-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="category-manager-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Manage & Create Categories
                {customCategories.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {customCategories.length} Custom
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Create new categories, add or remove keywords, and manage auto-categorization
              </p>
            </div>
          </div>
          <button
            id="close-category-manager-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create New Category Card */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">Create a New Category</h3>
              </div>
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Immediate Auto-Categorization
              </span>
            </div>

            {/* Quick Preset Ideas */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-semibold text-slate-700">Quick suggestions:</span>
                <span className="text-[11px] text-slate-500">Click to autofill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/30 transition-colors shadow-2xs font-medium cursor-pointer"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-category-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. Pet Care, Gym & Fitness, Car & Fuel"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="new-category-desc-input"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Vets, pet food, medicine, grooming"
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Keywords to match */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auto-Match Keywords <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  id="new-category-keywords-input"
                  type="text"
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="e.g. rover, vet, pets at home, purina, pedigree"
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-slate-400" />
                  Any transaction containing these words will automatically be assigned to this category.
                </p>
              </div>

              {/* Color Swatch Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Category Color Badge
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                  {PALETTE_OPTIONS.map((pal, idx) => {
                    const isSelected = selectedColorIndex === idx;
                    return (
                      <button
                        key={pal.name}
                        type="button"
                        onClick={() => setSelectedColorIndex(idx)}
                        className={`group relative h-9 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-emerald-600 ring-offset-1 border-transparent shadow-xs scale-105'
                            : 'border-slate-200 hover:scale-102 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: pal.color }}
                        title={pal.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview & Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-emerald-200/60 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Badge Preview:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedPalette.bg} ${selectedPalette.border}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selectedPalette.color }}
                    />
                    {name.trim() || 'Category Name'}
                  </span>
                </div>

                <button
                  id="submit-create-category-btn"
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Category
                </button>
              </div>
            </form>
          </div>

          {/* Search Existing Categories */}
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-900">Existing Categories</h3>
            <div className="w-56">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter categories or keywords..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
              />
            </div>
          </div>

          {/* Custom Categories List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Custom Categories ({customCategories.length})
              </h4>
            </div>

            {customCategories.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500">
                No custom categories created yet. Use the form above to add your first category!
              </div>
            ) : filteredCustom.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                No custom categories matched your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCustom.map((cat) => {
                  const txCount = txCountByCategory[cat.id] || 0;
                  const activeKws = getActiveKeywordsForCategory(cat.id, categoryKeywords, customCategories);

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Custom
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                          )}
                        </div>

                        <button
                          onClick={() => onDeleteCategory(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inline add keyword for this custom category */}
                      {onAddKeywordToCategory && (
                        <form
                          onSubmit={(e) => handleInlineAdd(cat.id, e)}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={inlineInputs[cat.id] || ''}
                            onChange={(e) =>
                              setInlineInputs((prev) => ({
                                ...prev,
                                [cat.id]: e.target.value,
                              }))
                            }
                            placeholder="+ Add keyword..."
                            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 flex-1"
                          />
                          <button
                            type="submit"
                            disabled={!(inlineInputs[cat.id] || '').trim()}
                            className="text-xs px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-30 text-white font-medium rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </form>
                      )}

                      {/* Keywords list with removable tags */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Keywords ({activeKws.length})
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Click <span className="text-rose-500 font-bold">×</span> to remove
                          </span>
                        </div>

                        {activeKws.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No keywords assigned yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activeKws.map((kw) => (
                              <span
                                key={kw}
                                className="group inline-flex items-center gap-1 text-[11px] pl-2 pr-1 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                              >
                                <span>{kw}</span>
                                {onRemoveKeywordFromCategory && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveKeywordFromCategory(cat.id, kw)}
                                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title={`Remove keyword "${kw}"`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                        <span>Used in {txCount} transactions</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Built-in Categories Reference */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Built-In Categories ({builtInList.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBuiltIn.map((cat) => {
                const txCount = txCountByCategory[cat.id] || 0;
                const activeKeywords = getActiveKeywordsForCategory(cat.id, categoryKeywords, customCategories);
                const defaultKeywords = cat.defaultKeywords || [];
                const removedCount = defaultKeywords.filter(
                  (dkw) => !activeKeywords.some((akw) => akw.toLowerCase() === dkw.toLowerCase())
                ).length;

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                        </div>
                        {removedCount > 0 && onResetCategoryKeywords && (
                          <button
                            type="button"
                            onClick={() => onResetCategoryKeywords(cat.id)}
                            className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-0.5 cursor-pointer"
                            title="Restore default keywords"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Restore ({removedCount})</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{cat.description}</p>
                    </div>

                    {/* Inline Add Keyword */}
                    {onAddKeywordToCategory && (
                      <form
                        onSubmit={(e) => handleInlineAdd(cat.id, e)}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={inlineInputs[cat.id] || ''}
                          onChange={(e) =>
                            setInlineInputs((prev) => ({
                              ...prev,
                              [cat.id]: e.target.value,
                            }))
                          }
                          placeholder="+ Add keyword..."
                          className="text-xs px-2.5 py-0.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 flex-1"
                        />
                        <button
                          type="submit"
                          disabled={!(inlineInputs[cat.id] || '').trim()}
                          className="text-xs px-2 py-0.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-30 text-white font-medium rounded-lg transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Add</span>
                        </button>
                      </form>
                    )}

                    {/* Removable Keywords */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Keywords ({activeKeywords.length})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {txCount} transactions
                        </span>
                      </div>
                      {activeKeywords.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No active keywords.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {activeKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="group inline-flex items-center gap-1 text-[10px] pl-1.5 pr-0.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono"
                            >
                              <span>{kw}</span>
                              {onRemoveKeywordFromCategory && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveKeywordFromCategory(cat.id, kw)}
                                  className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                  title={`Remove "${kw}" from ${cat.name}`}
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Categories, keywords, and rules are saved to your browser local storage</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
