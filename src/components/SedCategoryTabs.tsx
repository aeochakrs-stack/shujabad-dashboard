'use client';

import { useState } from 'react';
import { School, ListFilter, LayoutList } from "lucide-react";
import DynamicTable from "@/components/DynamicTable";
import { SCHOOL_COLUMNS, DEFAULT_SCHOOL_COLS } from "@/lib/columns";
import SedPostsSummary from "@/components/SedPostsSummary";

export default function SedCategoryTabs({ schools, categoryType }: { schools: any[], categoryType: string }) {
  const [activeTab, setActiveTab] = useState<'schools' | 'summary'>('schools');

  return (
    <div className="space-y-6">
      {categoryType === 'SED' ? (
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
          <button
            onClick={() => setActiveTab('schools')}
            className={`px-6 py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'schools' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <LayoutList className="w-4 h-4" /> Schools List
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <ListFilter className="w-4 h-4" /> Posts Summary
          </button>
        </div>
      ) : null}

      {activeTab === 'schools' && (
        <DynamicTable 
          data={schools}
          columns={SCHOOL_COLUMNS}
          defaultVisibleColumns={DEFAULT_SCHOOL_COLS}
          exportFileName={`${categoryType}_Schools`}
        />
      )}

      {activeTab === 'summary' && categoryType === 'SED' && (
        <SedPostsSummary schools={schools} />
      )}
    </div>
  );
}
