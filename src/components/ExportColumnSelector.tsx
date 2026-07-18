'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from "lucide-react";

export type ExportColumn = {
  key: string;
  label: string;
};

interface ExportColumnSelectorProps {
  columns: ExportColumn[];
  onExport: (selectedKeys: string[]) => void;
}

export default function ExportColumnSelector({ columns, onExport }: ExportColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(columns.map(c => c.key)));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedKeys(new Set(columns.map(c => c.key)));
  const clearAll = () => setSelectedKeys(new Set());

  const handleExport = () => {
    if (selectedKeys.size === 0) return;
    onExport(Array.from(selectedKeys));
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shrink-0"
      >
        <Download className="w-4 h-4" />
        Export to Excel
        <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[60vh]">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Columns</span>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">All</button>
              <span className="text-slate-300">|</span>
              <button onClick={clearAll} className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors">None</button>
            </div>
          </div>
          
          <div className="overflow-y-auto p-2 flex-grow">
            {columns.map(col => (
              <label key={col.key} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedKeys.has(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm text-slate-700 font-medium select-none truncate" title={col.label}>{col.label}</span>
              </label>
            ))}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 sticky bottom-0">
            <button 
              onClick={handleExport}
              disabled={selectedKeys.size === 0}
              className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${selectedKeys.size === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'}`}
            >
              <Download className="w-4 h-4" />
              Download {selectedKeys.size > 0 ? `(${selectedKeys.size})` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
