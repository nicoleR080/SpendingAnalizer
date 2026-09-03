import React, { useRef } from 'react';
import { 
  Building2, 
  Upload, 
  Sparkles, 
  Sliders, 
  Download, 
  RotateCcw,
  AlertCircle,
  Tag,
  Database
} from 'lucide-react';
import { Transaction } from '../types';

interface HeaderProps {
  transactionCount: number;
  onLoadDemo: () => void;
  onFileUpload: (file: File) => void;
  onOpenRules: () => void;
  onOpenCategories?: () => void;
  customCategoryCount?: number;
  onClear: () => void;
  onExportCsv: () => void;
  hasData: boolean;
  ruleCount: number;
  uncategorizedCount?: number;
  onOpenUncategorizedReview?: () => void;
  onOpenDataManagement?: () => void;
  onExportBackup?: () => void;
  onImportBackupFile?: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  transactionCount,
  onLoadDemo,
  onFileUpload,
  onOpenRules,
  onOpenCategories,
  customCategoryCount = 0,
  onClear,
  onExportCsv,
  hasData,
  ruleCount,
  uncategorizedCount = 0,
  onOpenUncategorizedReview,
  onOpenDataManagement,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs ring-1 ring-slate-800/10 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Spending Analyzer
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  BoS & Lloyds CSV
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden lg:block leading-tight">
                Categorization & cash flow breakdown
              </p>
            </div>
          </div>

          {/* Actions - Sleek, Uniform Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv,application/vnd.ms-excel"
              className="hidden"
              id="csv-file-upload-header"
            />

            {/* Uncategorized Review Alert Pill */}
            {hasData && uncategorizedCount > 0 && onOpenUncategorizedReview && (
              <button
                id="header-uncategorized-btn"
                onClick={onOpenUncategorizedReview}
                className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 text-xs font-semibold rounded-lg text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300/80 transition-colors shadow-2xs cursor-pointer"
                title="Review uncategorized transactions"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="hidden sm:inline">Review</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950">
                  {uncategorizedCount}
                </span>
              </button>
            )}

            {/* Categories */}
            {onOpenCategories && (
              <button
                id="header-categories-btn"
                onClick={onOpenCategories}
                className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 text-xs font-medium rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 transition-colors shadow-2xs cursor-pointer"
                title="Manage categories"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Categories</span>
                {customCategoryCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                    {customCategoryCount}
                  </span>
                )}
              </button>
            )}

            {/* Rules */}
            <button
              id="header-rules-btn"
              onClick={onOpenRules}
              className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Manage keyword rules"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Rules</span>
              {ruleCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                  {ruleCount}
                </span>
              )}
            </button>

            {/* Single Data & Backup Button */}
            {onOpenDataManagement && (
              <button
                id="header-data-management-btn"
                onClick={onOpenDataManagement}
                className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 text-xs font-medium rounded-lg text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                title="Backup, export, import and restore data"
              >
                <Database className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <span>Data & Backup</span>
              </button>
            )}

            {/* Demo Button */}
            <button
              id="header-load-demo-btn"
              onClick={onLoadDemo}
              className="hidden lg:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Load demo data"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Demo</span>
            </button>

            {/* Upload CSV */}
            <button
              id="header-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Upload CSV</span>
            </button>

            {/* Export CSV & Clear Button */}
            {hasData && (
              <>
                <button
                  id="header-export-btn"
                  onClick={onExportCsv}
                  className="hidden xl:inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                  title="Export categorized CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Export CSV</span>
                </button>

                <button
                  id="header-clear-btn"
                  onClick={onClear}
                  className="inline-flex items-center justify-center h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs shrink-0"
                  title="Clear current data"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
