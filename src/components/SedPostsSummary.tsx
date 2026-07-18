'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import DynamicTable from "@/components/DynamicTable";
import { SCHOOL_COLUMNS } from "@/lib/columns";

export default function SedPostsSummary({ schools }: { schools: any[] }) {
  const [groupBy, setGroupBy] = useState<'Designation' | 'Markaz' | 'School'>('Designation');
  const [selectedMarkazes, setSelectedMarkazes] = useState<string[]>([]);
  const [isMarkazDropdownOpen, setIsMarkazDropdownOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  
  // Drilldown state
  const [drilldown, setDrilldown] = useState<{ key: string, filterType: 'all' | 'vacant' } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMarkazDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract all unique markazes for the filter dropdown
  const uniqueMarkazes = useMemo(() => {
    const m = new Set(schools.map(s => s.markaz).filter(Boolean));
    return Array.from(m).sort();
  }, [schools]);

  const toggleMarkaz = (m: string) => {
    setSelectedMarkazes(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  // 1. Filter schools (used for both the summary table AND the drilldown)
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      if (selectedMarkazes.length > 0 && !selectedMarkazes.includes(s.markaz)) return false;
      if (levelFilter !== 'All' && s.level !== levelFilter) return false;
      if (search) {
        const lowerSearch = search.toLowerCase();
        if (
          !(s.school_name || '').toLowerCase().includes(lowerSearch) &&
          !(s.emis_code || '').toLowerCase().includes(lowerSearch)
        ) {
          // Check if any post matches search if searching by designation
        }
      }
      return true;
    });
  }, [schools, selectedMarkazes, levelFilter, search]);


  // 2. Aggregate the data for the main table
  const summaryData = useMemo(() => {
    const aggregates: Record<string, { key: string; sanctioned: number; filled: number; vacant: number }> = {};
    let grandTotalSanctioned = 0;
    let grandTotalFilled = 0;
    let grandTotalVacant = 0;

    filteredSchools.forEach(school => {
      if (!school.sanctioned_posts) return;

      school.sanctioned_posts.forEach((post: any) => {
        const lowerSearch = search.toLowerCase();
        const schoolMatches = (school.school_name || '').toLowerCase().includes(lowerSearch) || (school.emis_code || '').toLowerCase().includes(lowerSearch);
        const postMatches = (post.designation || '').toLowerCase().includes(lowerSearch);
        
        if (search && !schoolMatches && !postMatches) return;

        let key = '';
        if (groupBy === 'Designation') key = post.designation || 'Unknown';
        else if (groupBy === 'Markaz') key = school.markaz || 'Unknown';
        else if (groupBy === 'School') key = `${school.emis_code} - ${school.school_name}`;

        if (!aggregates[key]) {
          aggregates[key] = { key, sanctioned: 0, filled: 0, vacant: 0 };
        }

        aggregates[key].sanctioned += (post.sanctioned || 0);
        aggregates[key].filled += (post.filled || 0);
        aggregates[key].vacant += (post.vacant || 0);

        grandTotalSanctioned += (post.sanctioned || 0);
        grandTotalFilled += (post.filled || 0);
        grandTotalVacant += (post.vacant || 0);
      });
    });

    return {
      rows: Object.values(aggregates).sort((a, b) => b.vacant - a.vacant || a.key.localeCompare(b.key)),
      grandTotalSanctioned,
      grandTotalFilled,
      grandTotalVacant
    };
  }, [filteredSchools, groupBy, search]);

  // 3. Drilldown data calculation
  const drilldownSchools = useMemo(() => {
    if (!drilldown) return [];
    
    let matchingSchools: any[] = [];

    filteredSchools.forEach(school => {
       if (!school.sanctioned_posts) return;

       if (groupBy === 'Designation') {
           const post = school.sanctioned_posts.find((p: any) => p.designation === drilldown.key);
           if (post) {
               if (drilldown.filterType === 'all' && post.sanctioned > 0) {
                   matchingSchools.push({ ...school, post_sanctioned: post.sanctioned, post_filled: post.filled, post_vacant: post.vacant });
               } else if (drilldown.filterType === 'vacant' && post.vacant > 0) {
                   matchingSchools.push({ ...school, post_sanctioned: post.sanctioned, post_filled: post.filled, post_vacant: post.vacant });
               }
           }
       }
       else if (groupBy === 'Markaz') {
           if (school.markaz === drilldown.key) {
               let t_sanc = 0, t_fill = 0, t_vac = 0;
               school.sanctioned_posts.forEach((p: any) => {
                   t_sanc += p.sanctioned || 0; t_fill += p.filled || 0; t_vac += p.vacant || 0;
               });
               if (drilldown.filterType === 'all' || (drilldown.filterType === 'vacant' && t_vac > 0)) {
                   matchingSchools.push({ ...school, post_sanctioned: t_sanc, post_filled: t_fill, post_vacant: t_vac });
               }
           }
       }
       else if (groupBy === 'School') {
           const s_key = `${school.emis_code} - ${school.school_name}`;
           if (s_key === drilldown.key) {
               let t_sanc = 0, t_fill = 0, t_vac = 0;
               school.sanctioned_posts.forEach((p: any) => {
                   t_sanc += p.sanctioned || 0; t_fill += p.filled || 0; t_vac += p.vacant || 0;
               });
               if (drilldown.filterType === 'all' || (drilldown.filterType === 'vacant' && t_vac > 0)) {
                   matchingSchools.push({ ...school, post_sanctioned: t_sanc, post_filled: t_fill, post_vacant: t_vac });
               }
           }
       }
    });

    return matchingSchools;
  }, [drilldown, filteredSchools, groupBy]);

  // Extended columns for the drilldown modal
  const drilldownColumns = [
    ...SCHOOL_COLUMNS.filter(c => ['emis_code', 'school_name', 'markaz', 'level'].includes(c.key)),
    { key: 'post_sanctioned', label: 'Sanctioned' },
    { key: 'post_filled', label: 'Filled' },
    { key: 'post_vacant', label: 'Vacant' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-indigo-500">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Sanctioned</p>
          <p className="text-3xl font-black text-slate-800">{summaryData.grandTotalSanctioned.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-emerald-500">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Filled</p>
          <p className="text-3xl font-black text-slate-800">{summaryData.grandTotalFilled.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 border-l-4 border-l-rose-500">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Vacant</p>
          <p className="text-3xl font-black text-rose-600">{summaryData.grandTotalVacant.toLocaleString()}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setGroupBy('Designation')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${groupBy === 'Designation' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              By Designation
            </button>
            <button 
              onClick={() => setGroupBy('Markaz')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${groupBy === 'Markaz' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              By Markaz
            </button>
            <button 
              onClick={() => setGroupBy('School')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${groupBy === 'School' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              By School
            </button>
          </div>

          <div className="flex gap-2 relative">
            
            {/* Custom Multi-Select Dropdown for Markaz */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsMarkazDropdownOpen(!isMarkazDropdownOpen)}
                className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium hover:border-indigo-300 transition-colors"
              >
                {selectedMarkazes.length === 0 ? 'All Markazes' : `${selectedMarkazes.length} Markaz${selectedMarkazes.length > 1 ? 'es' : ''}`}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {isMarkazDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-20 py-2 max-h-80 overflow-y-auto">
                  <div 
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                    onClick={() => setSelectedMarkazes([])}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMarkazes.length === 0 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                      {selectedMarkazes.length === 0 && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">All Markazes</span>
                  </div>
                  <div className="h-px bg-slate-100 my-1"></div>
                  {uniqueMarkazes.map(m => (
                    <div 
                      key={m} 
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                      onClick={() => toggleMarkaz(m)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMarkazes.includes(m) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                        {selectedMarkazes.includes(m) && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm text-slate-700">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select 
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Levels</option>
              <option value="Primary">Primary</option>
              <option value="Elementary">Elementary</option>
              <option value="High">High</option>
              <option value="Higher Secondary">Higher Secondary</option>
            </select>
          </div>
        </div>

        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${groupBy.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Normal Summary View or Drilldown View */}
      {!drilldown ? (
        <>
          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-bold">{groupBy}</th>
                    <th className="px-6 py-4 font-bold text-right">Sanctioned</th>
                    <th className="px-6 py-4 font-bold text-right">Filled</th>
                    <th className="px-6 py-4 font-bold text-right">Vacant</th>
                    <th className="px-6 py-4 font-bold w-48">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No posts found matching your criteria.</td>
                    </tr>
                  ) : (
                    summaryData.rows.map((row, idx) => {
                      const percentFilled = row.sanctioned > 0 ? (row.filled / row.sanctioned) * 100 : 0;
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <button 
                              onClick={() => setDrilldown({ key: row.key, filterType: 'all' })}
                              className="hover:text-indigo-600 hover:underline transition-colors text-left"
                            >
                              {row.key}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">{row.sanctioned}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">{row.filled}</td>
                          <td className="px-6 py-4 text-right">
                            {row.vacant > 0 ? (
                              <button 
                                onClick={() => setDrilldown({ key: row.key, filterType: 'vacant' })}
                                className="font-bold text-rose-500 hover:text-rose-700 hover:underline transition-colors bg-rose-50 px-2 py-0.5 rounded-md"
                              >
                                {row.vacant}
                              </button>
                            ) : (
                              <span className="font-bold text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${percentFilled >= 90 ? 'bg-emerald-500' : percentFilled >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                                style={{ width: `${Math.min(percentFilled, 100)}%` }}
                              ></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {drilldown.key} <span className="text-slate-400 font-normal">Schools</span>
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Showing {drilldown.filterType === 'vacant' ? 'only schools with vacant posts' : 'all schools with this post'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Markaz Filter Clone for convenience */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsMarkazDropdownOpen(!isMarkazDropdownOpen)}
                  className="flex items-center gap-2 border border-slate-200 bg-white shadow-sm rounded-lg px-3 py-2 text-sm font-medium hover:border-indigo-300 transition-colors"
                >
                  {selectedMarkazes.length === 0 ? 'All Markazes' : `${selectedMarkazes.length} Markaz${selectedMarkazes.length > 1 ? 'es' : ''}`}
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                
                {isMarkazDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-xl z-20 py-2 max-h-80 overflow-y-auto">
                    <div 
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                      onClick={() => setSelectedMarkazes([])}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMarkazes.length === 0 ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                        {selectedMarkazes.length === 0 && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm font-medium text-slate-700">All Markazes</span>
                    </div>
                    <div className="h-px bg-slate-100 my-1"></div>
                    {uniqueMarkazes.map(m => (
                      <div 
                        key={m} 
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                        onClick={() => toggleMarkaz(m)}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedMarkazes.includes(m) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'}`}>
                          {selectedMarkazes.includes(m) && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-sm text-slate-700">{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setDrilldown(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 font-bold text-slate-600 rounded-lg transition-colors shadow-sm"
              >
                <X className="w-4 h-4" /> Close View
              </button>
            </div>
          </div>
          
          <div className="p-0">
            <DynamicTable 
              data={drilldownSchools}
              columns={drilldownColumns}
              defaultVisibleColumns={['emis_code', 'school_name', 'markaz', 'post_sanctioned', 'post_filled', 'post_vacant']}
              exportFileName={`${drilldown.key}_${drilldown.filterType}_Drilldown`}
              searchPlaceholder="Search within these schools..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
