import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Info,
  Layers
} from 'lucide-react';

interface DropzoneProps {
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileUpload, onLoadDemo }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type.includes('csv') || file.type.includes('excel'))) {
      onFileUpload(file);
    }
  };

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
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>100% Client-Side & Private • No data sent to any server</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Analyze Bank of Scotland & Lloyds Statements
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Instantly parse statement exports, categorize investments, bills, groceries, and leisure with smart keyword rules.
        </p>
      </div>

      {/* Main Upload Box */}
      <div
        id="csv-dropzone-box"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-500/10'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,text/csv,application/vnd.ms-excel"
          className="hidden"
          id="csv-dropzone-input"
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
          <UploadCloud className="w-8 h-8 text-emerald-600" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
          Drop your Bank of Scotland / Lloyds CSV here
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          or click anywhere to browse files on your computer
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Select CSV File</span>
          </button>

          <button
            type="button"
            id="dropzone-demo-data-btn"
            onClick={(e) => {
              e.stopPropagation();
              onLoadDemo();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Load Demo Statement</span>
          </button>
        </div>
      </div>

      {/* Specifications & Schema Mapping info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column Mapping Guide */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Auto-Mapped CSV Columns</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="font-mono font-medium text-slate-800">Transaction Date</span>
              <span className="text-slate-500">DD/MM/YYYY format</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="font-mono font-medium text-slate-800">Transaction Description</span>
              <span className="text-slate-500">Merchant / Payee text</span>
            </li>
            <li className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="font-mono font-medium text-slate-800">Debit Amount</span>
              <span className="text-rose-600 font-medium">Expenses / Outflows</span>
            </li>
            <li className="flex items-center justify-between py-1">
              <span className="font-mono font-medium text-slate-800">Credit Amount</span>
              <span className="text-emerald-600 font-medium">Income / Inflows</span>
            </li>
          </ul>
        </div>

        {/* Preset Sample Rules & Examples */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Demo Includes Verified Test Cases</h4>
            </div>
            <button
              onClick={onLoadDemo}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              Try Demo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              TRADING 212 (£500)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              AJ BELL (£500)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              SAVETHECHANGE (£1.24)
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-mono">
              ASDA (£39.87)
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-mono">
              UBER *EATS (£14.47)
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono">
              Spotify (£12.99)
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              BOS LOAN (£284.59)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
