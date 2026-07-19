'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Eye, EyeOff, ChevronDown, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import ExportColumnSelector, { ExportColumn } from "@/components/ExportColumnSelector";
import * as XLSX from 'xlsx';

export interface DynamicTableProps {
  data: any[];
  columns: ExportColumn[];
  defaultVisibleColumns: string[];
  exportFileName: string;
  searchPlaceholder?: string;
}

export default function DynamicTable({ data, columns, defaultVisibleColumns, exportFileName, searchPlaceholder = "Search data..." }: DynamicTableProps) {
  const [search, setSearch] = useState('');
  const [visibleCols, setVisibleCols] = useState<string[]>(defaultVisibleColumns);
  const [selectedMarkazs, setSelectedMarkazs] = useState<string[]>([]);
  const [isMarkazDropdownOpen, setIsMarkazDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMarkazDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMarkazColumn = columns.some(c => c.key === 'markaz');
  const uniqueMarkazs = hasMarkazColumn 
    ? Array.from(new Set(data.map(d => d.markaz).filter(Boolean))).sort()
    : [];

  const toggleCol = (key: string) => {
    setVisibleCols(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  };

  const toggleMarkaz = (m: string) => {
    setSelectedMarkazs(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const filteredData = data.filter(item => {
    if (selectedMarkazs.length > 0 && !selectedMarkazs.includes(item.markaz)) return false;
    
    if (!search) return true;
    const searchLower = search.toLowerCase();
    // Search across all string/number fields
    return Object.values(item).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(searchLower)
    );
  });

  const handleExport = (selectedKeys: string[]) => {
      const exportPayload = filteredData.map(item => {
          const filteredRow: Record<string, any> = {};
          selectedKeys.forEach(key => {
              const colDef = columns.find(c => c.key === key);
              if (colDef) {
                  const val = item[key];
                  filteredRow[colDef.label] = (typeof val === 'boolean') ? (val ? 'Yes' : 'No') : val;
              }
          });
          return filteredRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportPayload);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
  };

  const renderCell = (key: string, value: any, row: any) => {
    // Boolean badges
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${value ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    
    if (value === null || value === undefined || value === '') return '-';

    // Clickable links for Markaz
    if (key === 'markaz') {
      return (
        <Link href={`/markaz/${encodeURIComponent(String(value))}`} className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
          {String(value)}
        </Link>
      );
    }

    // Clickable links for Categories (SED, PEIMA, PSRP Phase 1, Phase 2, Phase 3, PRIVATE)
    if (key === 'school_type' || key === 'psrp_phase') {
      let urlType = '';
      const strVal = String(value).toUpperCase();
      if (strVal === 'SED') urlType = 'sed';
      else if (strVal === 'PEIMA') urlType = 'peima';
      else if (strVal === 'PRIVATE') urlType = 'private';
      else if (strVal === 'PHASE 1') urlType = 'phase1';
      else if (strVal === 'PHASE 2') urlType = 'phase2';
      else if (strVal === 'PHASE 3') urlType = 'phase3';

      if (urlType) {
        return (
          <Link href={`/category/${urlType}`} className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
            {String(value)}
          </Link>
        );
      }
    }

    // School Name link (if emis_code exists in row)
    if (key === 'school_name' && row.emis_code) {
      return (
        <Link href={`/school/${row.emis_code}`} className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline block max-w-xs truncate" title={String(value)}>
          {String(value)}
        </Link>
      );
    }

    return String(value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      
      {/* Controls Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          
          {hasMarkazColumn && uniqueMarkazs.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsMarkazDropdownOpen(!isMarkazDropdownOpen)}
                className="w-full sm:w-48 px-4 py-2 border border-slate-200 rounded-xl text-sm transition-all bg-white font-medium text-slate-700 flex items-center justify-between hover:bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <span className="truncate pr-2">
                  {selectedMarkazs.length === 0 
                    ? 'All Markazs' 
                    : `${selectedMarkazs.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {isMarkazDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto py-1">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1 flex justify-between items-center sticky top-0 bg-white">
                    <span className="text-xs font-bold text-slate-500 uppercase">Filter by Markaz</span>
                    {selectedMarkazs.length > 0 && (
                      <button 
                        onClick={() => setSelectedMarkazs([])}
                        className="text-xs text-indigo-600 font-bold hover:text-indigo-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {uniqueMarkazs.map((m: any) => {
                    const isSelected = selectedMarkazs.includes(String(m));
                    return (
                      <button
                        key={String(m)}
                        onClick={() => toggleMarkaz(String(m))}
                        className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={`text-sm truncate ${isSelected ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>
                          {String(m)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Columns:</span>
          <div className="flex overflow-x-auto gap-2 pb-2 -mb-2 hide-scrollbar max-w-full sm:max-w-xl">
            {columns.map(col => {
              const isVisible = visibleCols.includes(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isVisible 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-50" />}
                  {col.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="shrink-0">
          <ExportColumnSelector columns={columns} onExport={handleExport} />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              {columns.filter(c => visibleCols.includes(c.key)).map((col) => (
                <th key={col.key} className="px-6 py-4 font-semibold whitespace-nowrap">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.length === 0 ? (
              <tr><td colSpan={visibleCols.length} className="px-6 py-12 text-center text-slate-500">No data found.</td></tr>
            ) : (
              filteredData.map((s, idx) => (
                <tr key={s.id || s.emis_code || s.personnel_no || idx} className="hover:bg-slate-50 transition-colors">
                  {columns.filter(c => visibleCols.includes(c.key)).map((col) => (
                    <td key={col.key} className="px-6 py-4 text-slate-700">
                      {renderCell(col.key, s[col.key], s)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
