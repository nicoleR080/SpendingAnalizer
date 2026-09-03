import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Bookmark,
  Sliders,
  FileText,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';
import { CategoryDefinition, CustomRule, SystemSettings, UserDataBackup } from '../types';
import { downloadUserDataBackup, parseAndValidateUserDataBackup } from '../utils/categorizer';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customCategories: CategoryDefinition[];
  customRules: CustomRule[];
  categoryKeywords: Record<string, string[]>;
  overrides: Record<string, string>;
  settings?: SystemSettings;
  onImportBackup: (backup: UserDataBackup) => void;
  onResetToDefaults: () => void;
  showToast: (text: string, type?: 'success' | 'info') => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  customCategories,
  customRules,
  categoryKeywords,
  overrides,
  settings,
  onImportBackup,
  onResetToDefaults,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'backup' | 'report'>('backup');

  if (!isOpen) return null;

  const handleExport = () => {
    const backup: UserDataBackup = {
      version: '1.0.0',
      appName: 'Bank of Scotland & Lloyds Spending Analyzer',
      exportedAt: new Date().toISOString(),
      settings: settings || {
        currency: 'GBP',
        currencySymbol: '£',
        autoApplyToSameItems: true,
        autoCreateRuleOnAssign: true,
        savingsCategoryIds: ['savings'],
      },
      customCategories,
      customRules,
      categoryKeywords,
      overrides,
    };

    downloadUserDataBackup(backup);
    showToast('Exported all categories & rules to "my_categories_backup.json"', 'success');
  };

  const processJsonFile = (file: File) => {
    setImportError(null);
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setImportError('Please select a valid .json backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setImportError('File is empty.');
        return;
      }

      const result = parseAndValidateUserDataBackup(content);
      if (result.success && result.data) {
        onImportBackup(result.data);
        showToast(
          `Imported ${result.data.customCategories.length} categories & ${result.data.customRules.length} rules!`,
          'success'
        );
        onClose();
      } else {
        setImportError(result.error || 'Failed to parse JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processJsonFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processJsonFile(file);
    }
  };

  const overrideCount = Object.keys(overrides).length;
  const keywordCount = Object.values(categoryKeywords).reduce<number>(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Settings & Data Persistence
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  user_data.json active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Export, import, and backup your custom categories, keyword rules, and overrides.
              </p>
            </div>
          </div>

          <button
            id="close-data-management-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 px-5 pt-3 bg-slate-50/50 gap-2">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Export & Import Backups</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>System Logic Report</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'backup' ? (
            <>
              {/* Current Active Data Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Custom Categories
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {customCategories.length}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Keyword Rules
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {customRules.length}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Item Overrides
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {overrideCount}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Dictionary Words
                  </span>
                  <span className="text-xl font-bold text-slate-900 mt-1 block">
                    {keywordCount}
                  </span>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Export Card */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Export Data (Download JSON)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Download a complete backup (<code className="bg-white px-1 py-0.5 rounded border border-emerald-200 text-emerald-900 font-mono text-[11px]">my_categories_backup.json</code>) containing all your custom categories, rules, overrides, and keyword mappings.
                    </p>
                  </div>

                  <button
                    id="btn-export-json-backup"
                    onClick={handleExport}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data (my_categories_backup.json)</span>
                  </button>
                </div>

                {/* 2. Import Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Import Data (Restore JSON)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Upload a previously exported <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-800 font-mono text-[11px]">.json</code> backup to instantly restore all categories, rules, and item categorizations.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json,application/json"
                    className="hidden"
                    id="import-backup-file-input"
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-white'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                    <span className="text-xs font-bold text-indigo-900 block">
                      Click to Select or Drop .JSON
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Restores all categories instantly
                    </span>
                  </div>
                </div>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Reset to user_data.json Seed */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Reset to Default Config File (<code className="font-mono">user_data.json</code>)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Reload the clean default categories and rules defined in the root config file.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to reload default categories and rules from user_data.json?'
                      )
                    ) {
                      onResetToDefaults();
                    }
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  Reload user_data.json
                </button>
              </div>
            </>
          ) : (
            /* System Logic Report Preview */
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-900">PROJECT_LOGIC_REPORT.md Summary</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Saved at /PROJECT_LOGIC_REPORT.md
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-bold text-slate-900">1. Categorization Priority Ladder:</h5>
                  <p className="text-slate-600 mt-0.5">
                    Manual Item Override ➔ Exact Merchant Name Override ➔ Custom User Rules ➔ Custom Category Dictionaries ➔ Built-in Dictionaries ➔ Inflow Heuristic ➔ Uncategorized.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900">2. Same-Name Auto-Propagation:</h5>
                  <p className="text-slate-600 mt-0.5">
                    Assigning a category to any transaction automatically updates all identical transactions across the statement and creates a persistent rule.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900">3. Outgoings Minus Saving Metric:</h5>
                  <p className="text-slate-600 mt-0.5">
                    Calculated as <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">Total Outflows - Total Saved</code> to isolate living costs from investment transfers.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900">4. Data Persistence & Export/Import:</h5>
                  <p className="text-slate-600 mt-0.5">
                    Seed loaded from <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">user_data.json</code>; full state exportable as <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">my_categories_backup.json</code> with zero data loss.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Changes made to categories are immediately exportable.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
