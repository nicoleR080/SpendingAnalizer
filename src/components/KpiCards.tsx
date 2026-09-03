import React from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  PiggyBank, 
  Scale, 
  AlertCircle,
  Percent,
  Wallet
} from 'lucide-react';
import { SpendingSummary } from '../types';

interface KpiCardsProps {
  summary: SpendingSummary;
  onFilterUncategorized: () => void;
  onOpenReviewModal?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  summary,
  onFilterUncategorized,
  onOpenReviewModal,
}) => {
  const formatGBP = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isNetPositive = summary.netCashFlow >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {/* 1. Total Inflows (Credits) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Inflows
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatGBP(summary.totalInflows)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Income, salary & credits
          </p>
        </div>
      </div>

      {/* 2. Total Outflows (Debits) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Outflows
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatGBP(summary.totalOutflows)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            All debits, bills & transfers
          </p>
        </div>
      </div>

      {/* 3. Outgoings Minus Savings (Living & Core Expenses) */}
      <div className="bg-white rounded-xl p-5 border border-indigo-200/70 shadow-xs flex flex-col justify-between bg-gradient-to-b from-indigo-50/20 to-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
            Outgoing Minus Saving
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-indigo-950 tracking-tight">
            {formatGBP(summary.outflowsExcludingSavings)}
          </div>
          <p className="mt-1 text-xs text-indigo-600/90 font-medium">
            Outflows minus saved money
          </p>
        </div>
      </div>

      {/* 4. Total Saved & Invested */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Saved & Invested
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">
              {formatGBP(summary.totalSaved)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <Percent className="w-3.5 h-3.5" />
            <span>
              {summary.savingsRate > 0 ? `${summary.savingsRate}% savings rate` : '0% of income'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Net Cash Flow */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Cash Flow
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isNetPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl font-bold tracking-tight ${
              isNetPositive ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {isNetPositive ? `+${formatGBP(summary.netCashFlow)}` : formatGBP(summary.netCashFlow)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isNetPositive ? 'Surplus retained' : 'Deficit spent'}
          </p>
        </div>
      </div>

      {/* Uncategorized Warning banner if any */}
      {summary.uncategorizedCount > 0 && (
        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 bg-amber-50 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-950">
                <span>{summary.uncategorizedCount} transactions</span> ({formatGBP(summary.uncategorizedAmount)}) need categorization
              </p>
              <p className="text-xs text-amber-700">
                Categorize them to get 100% accurate spending charts and monthly savings calculations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenReviewModal && (
              <button
                id="btn-kpi-review-uncategorized"
                onClick={onOpenReviewModal}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Review & Categorize ({summary.uncategorizedCount})</span>
              </button>
            )}
            <button
              id="btn-kpi-filter-table"
              onClick={onFilterUncategorized}
              className="inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 transition-colors cursor-pointer"
              title="Show only uncategorized in table below"
            >
              Filter Table
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
