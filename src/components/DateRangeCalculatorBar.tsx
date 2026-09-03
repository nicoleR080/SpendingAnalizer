import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Calculator,
  RotateCcw,
  Clock,
  Check,
  ChevronDown,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Transaction } from '../types';

interface DateRangeCalculatorBarProps {
  transactions: Transaction[];
  appliedStartDate: string;
  appliedEndDate: string;
  appliedMonth: string; // e.g. "2026-08", "all", or "custom"
  onApplyDateRange: (startDate: string, endDate: string, monthKey?: string) => void;
  onResetDates: () => void;
  activeTransactionCount: number;
  totalTransactionCount: number;
}

export const DateRangeCalculatorBar: React.FC<DateRangeCalculatorBarProps> = ({
  transactions,
  appliedStartDate,
  appliedEndDate,
  appliedMonth,
  onApplyDateRange,
  onResetDates,
  activeTransactionCount,
  totalTransactionCount,
}) => {
  // Local uncommitted date states for the inputs
  const [draftStartDate, setDraftStartDate] = useState<string>(appliedStartDate);
  const [draftEndDate, setDraftEndDate] = useState<string>(appliedEndDate);

  // Sync draft dates whenever applied dates change externally
  useEffect(() => {
    setDraftStartDate(appliedStartDate);
    setDraftEndDate(appliedEndDate);
  }, [appliedStartDate, appliedEndDate]);

  // Extract available distinct months from transactions
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { count: number; minDate: string; maxDate: string }>();
    
    transactions.forEach((tx) => {
      if (!tx.date) return;
      const monthKey = tx.date.slice(0, 7); // "YYYY-MM"
      const existing = monthMap.get(monthKey);
      if (existing) {
        existing.count += 1;
        if (tx.date < existing.minDate) existing.minDate = tx.date;
        if (tx.date > existing.maxDate) existing.maxDate = tx.date;
      } else {
        monthMap.set(monthKey, { count: 1, minDate: tx.date, maxDate: tx.date });
      }
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // latest first
      .map(([monthKey, info]) => {
        const [yearStr, monthStr] = monthKey.split('-');
        const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        const label = dateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        return {
          monthKey,
          label,
          count: info.count,
          minDate: info.minDate,
          maxDate: info.maxDate,
        };
      });
  }, [transactions]);

  // Handle Month dropdown selection
  const handleSelectMonth = (val: string) => {
    if (val === 'all') {
      setDraftStartDate('');
      setDraftEndDate('');
      onResetDates();
    } else {
      const selected = availableMonths.find((m) => m.monthKey === val);
      if (selected) {
        const [yearStr, monthStr] = val.split('-');
        const y = parseInt(yearStr);
        const m = parseInt(monthStr);
        const firstDay = `${val}-01`;
        // Last day of that month
        const lastDayNum = new Date(y, m, 0).getDate();
        const lastDay = `${val}-${String(lastDayNum).padStart(2, '0')}`;
        
        setDraftStartDate(firstDay);
        setDraftEndDate(lastDay);
        // Automatically calculate when picked from month dropdown for instant ease of use
        onApplyDateRange(firstDay, lastDay, val);
      }
    }
  };

  // Explicit calculation button click handler
  const handleCalculateClick = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyDateRange(draftStartDate, draftEndDate, 'custom');
  };

  // Preset handlers
  const handlePreset = (preset: 'all' | 'last30' | 'last90' | 'thisMonth') => {
    if (preset === 'all') {
      setDraftStartDate('');
      setDraftEndDate('');
      onResetDates();
      return;
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    if (preset === 'last30') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      const startStr = past.toISOString().slice(0, 10);
      setDraftStartDate(startStr);
      setDraftEndDate(todayStr);
      onApplyDateRange(startStr, todayStr, 'custom');
    } else if (preset === 'last90') {
      const past = new Date();
      past.setDate(today.getDate() - 90);
      const startStr = past.toISOString().slice(0, 10);
      setDraftStartDate(startStr);
      setDraftEndDate(todayStr);
      onApplyDateRange(startStr, todayStr, 'custom');
    } else if (preset === 'thisMonth') {
      if (availableMonths.length > 0) {
        handleSelectMonth(availableMonths[0].monthKey);
      }
    }
  };

  const isFiltered = Boolean(appliedStartDate || appliedEndDate || (appliedMonth && appliedMonth !== 'all'));
  const hasPendingChanges = draftStartDate !== appliedStartDate || draftEndDate !== appliedEndDate;

  // Format nice display string for active period
  const getPeriodLabel = () => {
    if (!isFiltered) return 'All available transactions';
    if (appliedStartDate && appliedEndDate) {
      return `${appliedStartDate} to ${appliedEndDate}`;
    }
    if (appliedStartDate) return `From ${appliedStartDate} onwards`;
    if (appliedEndDate) return `Up to ${appliedEndDate}`;
    if (appliedMonth && appliedMonth !== 'all') {
      const match = availableMonths.find((m) => m.monthKey === appliedMonth);
      return match ? match.label : appliedMonth;
    }
    return 'Custom range';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6 space-y-4">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Date Range & Month Calculator
              </h2>
              {isFiltered && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3" /> Filter Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Filter and calculate total income, expenses, and savings between specific dates.
            </p>
          </div>
        </div>

        {/* Current Active Badge */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            <span className="font-semibold text-slate-900">{getPeriodLabel()}</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="font-bold text-emerald-700">{activeTransactionCount}</span> of{' '}
            <span className="text-slate-600">{totalTransactionCount} transactions</span>
          </span>
        </div>
      </div>

      {/* Main Controls Form: Quick Month Dropdown + From/To Inputs + Calculate Button */}
      <form onSubmit={handleCalculateClick} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Quick Month Dropdown */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 shrink-0">
          <CalendarDays className="w-4 h-4 text-slate-500" />
          <label htmlFor="quick-month-select" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Month:
          </label>
          <div className="relative flex-1 sm:w-48">
            <select
              id="quick-month-select"
              value={appliedMonth}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-900 py-1.5 pl-2.5 pr-7 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              <option value="all">All Months ({totalTransactionCount} txs)</option>
              {availableMonths.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.label} ({m.count} txs)
                </option>
              ))}
              {appliedMonth === 'custom' && <option value="custom">Custom Date Range</option>}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Inputs: From (Von) ... To (Bis) */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-1.5 sm:px-3 sm:py-2">
          {/* Start Date (From) */}
          <div className="flex items-center gap-2 flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              From (Von):
            </span>
            <input
              type="date"
              id="input-date-from"
              value={draftStartDate}
              onChange={(e) => setDraftStartDate(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none cursor-pointer"
              title="Select start date"
            />
          </div>

          <span className="hidden sm:inline text-slate-400 font-bold px-0.5">→</span>

          {/* End Date (To / Bis) */}
          <div className="flex items-center gap-2 flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              To (Bis):
            </span>
            <input
              type="date"
              id="input-date-to"
              value={draftEndDate}
              onChange={(e) => setDraftEndDate(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none cursor-pointer"
              title="Select end date"
            />
          </div>
        </div>

        {/* Action Buttons: Explicit "Calculate / Recalculate" Button + Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="submit"
            id="btn-calculate-date-range"
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs transition-all ${
              hasPendingChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500 ring-offset-1 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]'
            }`}
            title="Click to calculate the overview for the selected dates"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate Date Range</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              id="btn-reset-dates"
              onClick={() => {
                setDraftStartDate('');
                setDraftEndDate('');
                onResetDates();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              title="Reset date filters and show all transactions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </form>

      {/* Quick Presets Row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
        <span className="text-slate-500 font-semibold text-[11px] mr-1">Quick Presets:</span>
        <button
          type="button"
          onClick={() => handlePreset('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
            !appliedStartDate && !appliedEndDate && appliedMonth === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          All Time
        </button>
        {availableMonths.slice(0, 3).map((m) => (
          <button
            key={m.monthKey}
            type="button"
            onClick={() => handleSelectMonth(m.monthKey)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
              appliedMonth === m.monthKey
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handlePreset('last30')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Last 30 Days
        </button>
        <button
          type="button"
          onClick={() => handlePreset('last90')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Last 90 Days
        </button>
      </div>
    </div>
  );
};
