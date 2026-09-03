import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { CategoryBreakdownItem, Transaction } from '../types';
import { CATEGORIES } from '../constants/categories';
import { PieChart as PieIcon, BarChart3, Filter, Plus, Tag } from 'lucide-react';

interface ChartsSectionProps {
  categoryData: CategoryBreakdownItem[];
  transactions: Transaction[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenCreateCategory?: () => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  categoryData,
  transactions,
  selectedCategory,
  onSelectCategory,
  onOpenCreateCategory,
}) => {
  const [chartView, setChartView] = useState<'donut' | 'bars'>('donut');

  const formatGBP = (val: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const totalOutflows = categoryData.reduce((sum, item) => sum + item.amount, 0);

  // Compute top merchants for bar comparison
  const merchantTotals: Record<string, { amount: number; category: string }> = {};
  transactions
    .filter((tx) => tx.type === 'debit')
    .forEach((tx) => {
      const cleanName = tx.description.slice(0, 20);
      if (!merchantTotals[cleanName]) {
        merchantTotals[cleanName] = { amount: 0, category: tx.category };
      }
      merchantTotals[cleanName].amount += tx.amount;
    });

  const topMerchantsData = Object.entries(merchantTotals)
    .map(([merchant, data]) => ({
      merchant,
      amount: data.amount,
      color: CATEGORIES[data.category]?.color || '#64748B',
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryBreakdownItem;
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-700">
          <p className="font-semibold text-slate-100">{item.name}</p>
          <p className="text-emerald-400 font-bold mt-1">{formatGBP(item.amount)}</p>
          <p className="text-slate-300 mt-0.5">
            {item.percentage.toFixed(1)}% of total outflows ({item.count} txs)
          </p>
          <p className="text-[10px] text-slate-400 mt-1 italic">Click to filter table</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-700">
          <p className="font-semibold text-slate-100">{data.merchant}</p>
          <p className="text-emerald-400 font-bold mt-1">{formatGBP(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Category Breakdown Donut / Pie Chart */}
      <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Spending Breakdown by Category</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenCreateCategory && (
              <button
                id="charts-create-category-btn"
                type="button"
                onClick={onOpenCreateCategory}
                className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold transition-colors shadow-2xs"
                title="Create a new custom category"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Category</span>
              </button>
            )}
            {selectedCategory !== 'all' && (
              <button
                onClick={() => onSelectCategory('all')}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Filter className="w-3 h-3" />
                Reset Filter
              </button>
            )}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs">
              <button
                onClick={() => setChartView('donut')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  chartView === 'donut'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setChartView('bars')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  chartView === 'bars'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Top Merchants
              </button>
            </div>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            No spending data available
          </div>
        ) : chartView === 'donut' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-7 h-64 sm:h-72 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="amount"
                    onClick={(entry: any) => {
                      const id = entry?.id || entry?.payload?.id;
                      if (id) onSelectCategory(id);
                    }}
                    cursor="pointer"
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={entry.color}
                        stroke={selectedCategory === entry.id ? '#0f172a' : '#ffffff'}
                        strokeWidth={selectedCategory === entry.id ? 3 : 1}
                        opacity={selectedCategory === 'all' || selectedCategory === entry.id ? 1 : 0.4}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Outflows
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900">
                  {formatGBP(totalOutflows)}
                </span>
              </div>
            </div>

            {/* Interactive Category Legend list */}
            <div className="md:col-span-5 space-y-2 max-h-72 overflow-y-auto pr-1">
              {categoryData.map((item) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectCategory(isSelected ? 'all' : item.id)}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {item.count} txs • {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0 ml-2">
                      {formatGBP(item.amount)}
                    </span>
                  </button>
                );
              })}

              {onOpenCreateCategory && (
                <button
                  id="legend-create-category-btn"
                  type="button"
                  onClick={onOpenCreateCategory}
                  className="w-full text-center py-2 px-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Create Custom Category</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topMerchantsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(v) => `£${v}`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="merchant" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {topMerchantsData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Highlights & Allocations */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Allocation Health</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Comparison across primary expense and wealth buckets:
          </p>

          <div className="space-y-3.5">
            {categoryData.slice(0, 4).map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-slate-900 font-bold">
                    {formatGBP(item.amount)} ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Quick Tip:</p>
          <p className="mt-0.5">
            Click any category slice or row in the chart to immediately filter the transaction table below.
          </p>
        </div>
      </div>
    </div>
  );
};
