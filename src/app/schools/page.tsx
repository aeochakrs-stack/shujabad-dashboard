'use client';

import { useState, useEffect, useMemo } from 'react';
import { School, Search, ArrowLeft, Users, Building, ChevronDown, Filter, Pencil, X } from "lucide-react";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import ExportColumnSelector, { ExportColumn } from '@/components/ExportColumnSelector';

import { SCHOOL_COLUMNS, STAFF_COLUMNS, DEFAULT_SCHOOL_COLS, DEFAULT_STAFF_COLS } from '@/lib/columns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function MultiSelectDropdown({ label, options, selected, onChange }: { label: string, options: string[], selected: Set<string>, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCount = selected.size;

  const handleSelectAll = () => {
    options.forEach(opt => {
      if (!selected.has(opt)) onChange(opt); // Add all
    });
  };

  const handleClearAll = () => {
    options.forEach(opt => {
      if (selected.has(opt)) onChange(opt); // Remove all
    });
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 bg-white border ${selectedCount > 0 ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'} text-slate-700 text-sm rounded-lg hover:border-indigo-300 px-3 py-2 font-medium shadow-sm transition-colors whitespace-nowrap`}
      >
        <span>{label} {selectedCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs">{selectedCount}</span>}</span>
        <ChevronDown className={`w-4 h-4 ${selectedCount > 0 ? 'text-indigo-500' : 'text-slate-400'}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-20 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl max-h-72 overflow-y-auto overflow-x-hidden flex flex-col">
            <div className="p-2 border-b border-slate-100 flex justify-between gap-2 sticky top-0 bg-white z-10">
               <button onClick={handleSelectAll} className="flex-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded transition-colors">Select All</button>
               <button onClick={handleClearAll} className="flex-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-1.5 rounded transition-colors">Clear All</button>
            </div>
            <div className="p-1">
              {options.map(opt => (
                <label key={opt} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selected.has(opt)}
                    onChange={() => onChange(opt)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="text-sm text-slate-700 truncate" title={opt}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SchoolsDataPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'schools' | 'staff'>('schools');
  const [staffSubTab, setStaffSubTab] = useState<'basic' | 'degrees' | 'leaves'>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Multi-Select Filters
  const [filterMarkaz, setFilterMarkaz] = useState<Set<string>>(new Set());
  const [filterEmis, setFilterEmis] = useState<Set<string>>(new Set());
  const [filterBps, setFilterBps] = useState<Set<string>>(new Set());
  const [filterDesignation, setFilterDesignation] = useState<Set<string>>(new Set());
  const [filterSchoolType, setFilterSchoolType] = useState<Set<string>>(new Set());
  const [filterSchoolLevel, setFilterSchoolLevel] = useState<Set<string>>(new Set());
  const [filterSchoolGender, setFilterSchoolGender] = useState<Set<string>>(new Set());
  const [filterAcademic, setFilterAcademic] = useState<Set<string>>(new Set());
  const [filterProfessional, setFilterProfessional] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('Active'); // Active or Retired
  
  // Edit State
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [viewingStaff, setViewingStaff] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<Set<string>>(new Set());
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());

  const [visibleSchoolCols, setVisibleSchoolCols] = useState<string[]>(DEFAULT_SCHOOL_COLS);
  const [visibleStaffCols, setVisibleStaffCols] = useState<string[]>(DEFAULT_STAFF_COLS);

  const toggleSchoolCol = (key: string) => {
    setVisibleSchoolCols(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  };

  const toggleStaffCol = (key: string) => {
    setVisibleStaffCols(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  };

  const renderCell = (value: any, key: string, row: any) => {
    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${value ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }
    if (value === null || value === undefined || value === '') return '-';

    if (key === 'markaz') {
      return (
        <Link href={`/markaz/${encodeURIComponent(String(value))}`} className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
          {String(value)}
        </Link>
      );
    }

    if (key === 'emis_code') {
      return (
        <span className="font-mono text-slate-600 bg-white px-2 py-1 rounded text-xs border border-slate-200">
          {String(value)}
        </span>
      );
    }

    if (key === 'school_name' && row.emis_code) {
      return (
        <Link href={`/school/${row.emis_code}`} className="font-bold text-slate-800 hover:text-indigo-600 hover:underline transition-colors block max-w-xs truncate" title={String(value)}>
          {String(value)}
        </Link>
      );
    }

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

    return String(value);
  };

  const toggleFilter = (setFn: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
      setFn(prev => {
          const next = new Set(prev);
          if (next.has(val)) next.delete(val);
          else next.add(val);
          return next;
      });
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [schoolsRes, staffRes] = await Promise.all([
        supabase.from('schools').select('*'),
        supabase.from('hrmis_staff').select('*') 
      ]);

      if (staffRes.error) console.error("Staff fetch error:", staffRes.error);

      const fetchedSchools = (schoolsRes.data || []).map(sch => {
          let detectedLevel = sch.level;
          if (!detectedLevel && sch.school_name) {
              const name = sch.school_name.toUpperCase();
              if (name.includes(' GGHS ') || name.includes(' GHS ') || name.startsWith('GGHS ') || name.startsWith('GHS ')) detectedLevel = 'High';
              else if (name.includes(' GGHSS ') || name.includes(' GHSS ') || name.startsWith('GGHSS ') || name.startsWith('GHSS ')) detectedLevel = 'Higher Secondary';
              else if (name.includes(' GGES ') || name.includes(' GES ') || name.startsWith('GGES ') || name.startsWith('GES ')) detectedLevel = 'Middle';
              else if (name.includes(' GGPS ') || name.includes(' GPS ') || name.includes(' GMPS ') || name.startsWith('GGPS ') || name.startsWith('GPS ') || name.startsWith('GMPS ')) detectedLevel = 'Primary';
              else if (name.includes(' MC ') || name.startsWith('MC ')) detectedLevel = 'Primary';
          }
          return { ...sch, level: detectedLevel };
      });

      const staffWithSchools = (staffRes.data || []).map(s => {
          const school = fetchedSchools.find(sch => String(sch.emis_code) === String(s.emis_code));
          return {
              ...s,
              schools: school ? { 
                  school_name: school.school_name, 
                  markaz: school.markaz,
                  school_type: school.school_type,
                  level: school.level,
                  gender: school.gender,
                  sis_password: school.sis_password,
                  dengue_password: school.dengue_password,
                  focal_person_cell: school.focal_person_cell
              } : null
          };
      });

      setSchools(fetchedSchools);
      setStaff(staffWithSchools);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Unique lists for Dropdowns
  const uniqueMarkaz = useMemo(() => {
      const schMarkazs = schools.map(s => s.markaz);
      const stfMarkazs = staff.map(s => s.markaz);
      return Array.from(new Set([...schMarkazs, ...stfMarkazs].filter(Boolean))).sort();
  }, [schools, staff]);

  const uniqueEmis = useMemo(() => Array.from(new Set(schools.map(s => String(s.emis_code)).filter(Boolean))).sort(), [schools]);
  const uniqueBps = useMemo(() => Array.from(new Set(staff.map(s => String(s.bps)).filter(Boolean).filter(b => b !== 'null' && b !== 'undefined'))).sort((a,b) => Number(a) - Number(b)), [staff]);
  const uniqueDesignations = useMemo(() => Array.from(new Set(staff.map(s => s.designation).filter(Boolean))).sort(), [staff]);
  const uniqueTypes = useMemo(() => Array.from(new Set(schools.map(s => s.school_type).filter(Boolean))).sort(), [schools]);
  const uniqueLevels = useMemo(() => Array.from(new Set(schools.map(s => s.level).filter(Boolean))).sort(), [schools]);
  
  // FIXED: Gender filter now looks at the Teacher's gender from hrmis_staff, not the School's gender
  const uniqueGenders = useMemo(() => Array.from(new Set(staff.map(s => s.gender).filter(Boolean))).sort(), [staff]);

  const [markazInitialized, setMarkazInitialized] = useState(false);
  useEffect(() => {
      if (!markazInitialized && uniqueMarkaz.length > 0) {
          setFilterMarkaz(new Set(uniqueMarkaz as string[]));
          setMarkazInitialized(true);
      }
  }, [uniqueMarkaz, markazInitialized]);

  const matchesSearch = (rowString: string, query: string) => {
      if (!query) return true;
      const orTerms = query.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      return orTerms.some(term => rowString.includes(term));
  };

  const filteredSchools = useMemo(() => {
    let result = schools;
    if (filterMarkaz.size > 0) result = result.filter(s => filterMarkaz.has(s.markaz));
    if (filterEmis.size > 0) result = result.filter(s => filterEmis.has(String(s.emis_code)));
    if (filterSchoolType.size > 0) result = result.filter(s => filterSchoolType.has(s.school_type));
    if (filterSchoolLevel.size > 0) result = result.filter(s => filterSchoolLevel.has(s.level));
    if (filterSchoolGender.size > 0) result = result.filter(s => filterSchoolGender.has(s.gender));

    if (!searchQuery) return result;
    return result.filter(s => {
      const rowString = [
          s.school_name, s.emis_code, s.markaz, s.school_type, s.level,
          JSON.stringify(s.census_json || {})
      ].join(' ').toLowerCase();
      return matchesSearch(rowString, searchQuery);
    });
  }, [schools, searchQuery, filterMarkaz, filterEmis, filterSchoolType, filterSchoolLevel, filterSchoolGender]);

  const filteredStaff = useMemo(() => {
    let result = staff;
    // Apply Status filter
    if (filterStatus === 'Active') result = result.filter(s => !s.is_retired);
    else if (filterStatus === 'Retired') result = result.filter(s => s.is_retired);

    // Apply Staff filters
    if (filterBps.size > 0) result = result.filter(s => filterBps.has(String(s.bps)));
    if (filterDesignation.size > 0) result = result.filter(s => filterDesignation.has(s.designation));
    if (filterAcademic.size > 0) {
        result = result.filter(s => {
            if (filterAcademic.has('BA/BSc') && s.ba_bsc === 'Yes') return true;
            if (filterAcademic.has('MA/MSc') && s.ma_msc === 'Yes') return true;
            if (filterAcademic.has('MPhil') && s.mphil === 'Yes') return true;
            if (filterAcademic.has('PhD') && s.phd === 'Yes') return true;
            return false;
        });
    }
    if (filterProfessional.size > 0) {
        result = result.filter(s => {
            if (filterProfessional.has('B.Ed') && s.bed === 'Yes') return true;
            if (filterProfessional.has('M.Ed') && s.med === 'Yes') return true;
            return false;
        });
    }
    
    // Cross-filtering: Apply School filters to Staff parent schools (using correct field names)
    // If a staff member doesn't have a linked school, we shouldn't filter them out if "all" Markaz are selected.
    if (filterMarkaz.size > 0 && filterMarkaz.size < uniqueMarkaz.length) {
        result = result.filter(s => s.schools?.markaz && filterMarkaz.has(s.schools.markaz));
    }
    if (filterEmis.size > 0) result = result.filter(s => filterEmis.has(String(s.emis_code)));
    if (filterSchoolType.size > 0) result = result.filter(s => filterSchoolType.has(s.schools?.school_type));
    if (filterSchoolLevel.size > 0) result = result.filter(s => filterSchoolLevel.has(s.schools?.level));
    if (filterSchoolGender.size > 0) result = result.filter(s => filterSchoolGender.has(s.gender)); // FIXED: Teacher Gender

    if (!searchQuery) return result;
    return result.filter(s => {
      const rowString = [
          s.teacher_name, s.designation, String(s.bps), s.emis_code,
          s.dob, s.phone, s.cnic, s.schools?.school_name, s.schools?.markaz, s.gender,
          s.schools?.sis_password, s.schools?.dengue_password
      ].join(' ').toLowerCase();
      return matchesSearch(rowString, searchQuery);
    });
  }, [staff, searchQuery, filterBps, filterDesignation, filterMarkaz, filterEmis, filterSchoolType, filterSchoolLevel, filterSchoolGender, filterStatus, uniqueMarkaz.length]);

  // Row Selection logic
  const toggleSchoolSelection = (id: string) => {
      const newSet = new Set(selectedSchoolIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedSchoolIds(newSet);
  };
  const toggleStaffSelection = (id: string) => {
      const newSet = new Set(selectedStaffIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedStaffIds(newSet);
  };
  const toggleSelectAllSchools = () => {
      if (selectedSchoolIds.size === filteredSchools.length && filteredSchools.length > 0) setSelectedSchoolIds(new Set());
      else setSelectedSchoolIds(new Set(filteredSchools.map(s => s.id)));
  };
  const toggleSelectAllStaff = () => {
      if (selectedStaffIds.size === filteredStaff.length && filteredStaff.length > 0) setSelectedStaffIds(new Set());
      else setSelectedStaffIds(new Set(filteredStaff.map(s => s.id)));
  };

  const clearAllFilters = () => {
      setFilterMarkaz(new Set());
      setFilterEmis(new Set());
      setFilterBps(new Set());
      setFilterDesignation(new Set());
      setFilterSchoolType(new Set());
      setFilterSchoolLevel(new Set());
      setFilterSchoolGender(new Set());
      setFilterAcademic(new Set());
      setFilterProfessional(new Set());
      setSearchQuery('');
  };

  const handleExport = (selectedKeys: string[]) => {
    let dataToExport = [];
    if (activeTab === 'schools') {
        dataToExport = selectedSchoolIds.size > 0 ? schools.filter(s => selectedSchoolIds.has(s.id)) : filteredSchools;
    } else {
        dataToExport = selectedStaffIds.size > 0 ? staff.filter(s => selectedStaffIds.has(s.id)) : filteredStaff;
    }
    
    const exportPayload = dataToExport.map(item => {
        const fullRow: Record<string, any> = {};

        if (activeTab === 'schools') {
            const censusObj: any = {};
            if (item.census_json) {
                Object.entries(item.census_json).forEach(([section, data]: [string, any]) => {
                    if (typeof data === 'object' && data !== null) {
                        Object.entries(data).forEach(([key, val]) => {
                            censusObj[`${section} - ${key}`] = val;
                        });
                    }
                });
            }
            
            Object.assign(fullRow, {
                emis_code: item.emis_code,
                school_name: item.school_name,
                markaz: item.markaz,
                school_type: item.school_type,
                school_gender: item.gender,
                school_level: item.level,
                psrp_phase: item.psrp_phase,
                sis_password: item.sis_password,
                dengue_password: item.dengue_password,
                focal_person_cell: item.focal_person_cell,
                ...censusObj
            });
        } else {
            Object.assign(fullRow, {
                teacher_name: item.teacher_name,
                designation: item.designation,
                bps: item.bps,
                date_of_birth: item.dob,
                phone: item.phone,
                cnic: item.cnic,
                school_name: item.schools?.school_name || 'Unknown',
                school_emis: item.emis_code,
                markaz: item.schools?.markaz || 'Unknown'
            });
        }

        const filteredRow: Record<string, any> = {};
        selectedKeys.forEach(key => {
            const colDef = activeTab === 'schools' ? SCHOOLS_COLUMNS.find(c => c.key === key) : STAFF_COLUMNS.find(c => c.key === key);
            if (colDef) {
                filteredRow[colDef.label] = fullRow[key];
            } else if (activeTab === 'schools' && fullRow[key] !== undefined) {
                 // Include census dynamic columns if requested
                 filteredRow[key] = fullRow[key];
            }
        });

        // Always append dynamic census columns to schools if 'all' or specific ones are selected (for now we just include what's explicitly in selectedKeys, or we can just append them if they were checked. Since our ExportColumnSelector doesn't show dynamic census keys, let's keep it simple and just use the static ones defined in SCHOOLS_COLUMNS)
        return filteredRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportPayload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'schools' ? "Schools Data" : "Staff Data");
    XLSX.writeFile(workbook, `Shujabad_${activeTab}_Export.xlsx`);
  };

  const hasAnyFilters = filterMarkaz.size > 0 || filterBps.size > 0 || filterDesignation.size > 0 || filterSchoolType.size > 0 || filterSchoolLevel.size > 0 || filterSchoolGender.size > 0 || searchQuery !== '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen pb-12">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                <Filter className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">School and Markaz Wise Data</h1>
            </div>
            <p className="text-slate-500 text-sm">Comprehensive multi-select filter engine for cross-analyzing Schools and Staff.</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <ExportColumnSelector 
                columns={activeTab === 'schools' ? SCHOOLS_COLUMNS : STAFF_COLUMNS} 
                onExport={handleExport} 
            />
            {(activeTab === 'schools' ? selectedSchoolIds.size : selectedStaffIds.size) > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    Will export {activeTab === 'schools' ? selectedSchoolIds.size : selectedStaffIds.size} manually selected rows
                </span>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            placeholder="Search by anything... EMIS, teacher name, markaz, DOB, facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Comprehensive Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-sm font-bold text-slate-500 mr-2 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-4 h-4" /> Filters:
            </div>
            
            <MultiSelectDropdown label="Markaz" options={uniqueMarkaz as string[]} selected={filterMarkaz} onChange={(v) => toggleFilter(setFilterMarkaz, v)} />
            <MultiSelectDropdown label="EMIS Code" options={uniqueEmis as string[]} selected={filterEmis} onChange={(v) => toggleFilter(setFilterEmis, v)} />
            <MultiSelectDropdown label="School Type" options={uniqueTypes as string[]} selected={filterSchoolType} onChange={(v) => toggleFilter(setFilterSchoolType, v)} />
            <MultiSelectDropdown label="Level" options={uniqueLevels as string[]} selected={filterSchoolLevel} onChange={(v) => toggleFilter(setFilterSchoolLevel, v)} />
            <MultiSelectDropdown label="Teacher Gender" options={uniqueGenders as string[]} selected={filterSchoolGender} onChange={(v) => toggleFilter(setFilterSchoolGender, v)} />
            <MultiSelectDropdown label="BPS Scale" options={uniqueBps as string[]} selected={filterBps} onChange={(v) => toggleFilter(setFilterBps, v)} />
            <MultiSelectDropdown label="Designation" options={uniqueDesignations as string[]} selected={filterDesignation} onChange={(v) => toggleFilter(setFilterDesignation, v)} />
            <MultiSelectDropdown label="Academic Degree" options={['BA/BSc', 'MA/MSc', 'MPhil', 'PhD']} selected={filterAcademic} onChange={(v) => toggleFilter(setFilterAcademic, v)} />
            <MultiSelectDropdown label="Professional Degree" options={['B.Ed', 'M.Ed']} selected={filterProfessional} onChange={(v) => toggleFilter(setFilterProfessional, v)} />
            
            <div className="relative">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm rounded-lg hover:border-indigo-300 px-3 py-2 pr-8 font-medium shadow-sm transition-colors focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Active">Show Active Staff</option>
                <option value="Retired">Show Retired Staff</option>
                <option value="All">Show All Staff</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {hasAnyFilters && (
                <button 
                    onClick={clearAllFilters}
                    className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline ml-2"
                >
                    Clear All Filters
                </button>
            )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('schools')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors ${
                activeTab === 'schools' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Building className={`mr-2 h-5 w-5 ${activeTab === 'schools' ? 'text-indigo-500' : 'text-slate-400'}`} />
              Schools Data ({filteredSchools.length})
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors ${
                activeTab === 'staff' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users className={`mr-2 h-5 w-5 ${activeTab === 'staff' ? 'text-indigo-500' : 'text-slate-400'}`} />
              Staff Data ({filteredStaff.length})
            </button>
          </nav>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
            <p className="text-slate-500 font-medium">Loading comprehensive data records...</p>
          </div>
        ) : activeTab === 'schools' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Columns:</span>
              <div className="flex overflow-x-auto gap-2 pb-2 -mb-2 hide-scrollbar max-w-full">
                {SCHOOL_COLUMNS.map(col => {
                  const isVisible = visibleSchoolCols.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleSchoolCol(col.key)}
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
            
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm whitespace-nowrap text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        checked={selectedSchoolIds.size === filteredSchools.length && filteredSchools.length > 0}
                        onChange={toggleSelectAllSchools}
                      />
                    </th>
                    {SCHOOL_COLUMNS.filter(c => visibleSchoolCols.includes(c.key)).map(col => (
                      <th key={col.key} className="px-6 py-4 font-semibold">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSchools.slice(0, 50).map((school) => (
                    <tr key={school.id} className={`transition-colors group ${selectedSchoolIds.has(school.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          checked={selectedSchoolIds.has(school.id)}
                          onChange={() => toggleSchoolSelection(school.id)}
                        />
                      </td>
                      {SCHOOL_COLUMNS.filter(c => visibleSchoolCols.includes(c.key)).map(col => (
                        <td key={col.key} className="px-6 py-4 text-slate-700">
                          {renderCell(school[col.key], col.key, school)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSchools.length > 50 && (
                  <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                      Showing top 50 results out of {filteredSchools.length}. Selecting "All" selects all {filteredSchools.length} rows.
                  </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Columns:</span>
              <div className="flex overflow-x-auto gap-2 pb-2 -mb-2 hide-scrollbar max-w-full">
                {STAFF_COLUMNS.map(col => {
                  const isVisible = visibleStaffCols.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleStaffCol(col.key)}
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

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm" style={{ maxWidth: 'calc(100vw - 4rem)' }}>
              <table className="min-w-max divide-y divide-slate-200 text-sm whitespace-nowrap text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                        checked={selectedStaffIds.size === filteredStaff.length && filteredStaff.length > 0}
                        onChange={toggleSelectAllStaff}
                      />
                    </th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                    {STAFF_COLUMNS.filter(c => visibleStaffCols.includes(c.key)).map(col => (
                      <th key={col.key} className="px-6 py-4 font-semibold">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredStaff.slice(0, 50).map((s) => (
                    <tr key={s.id} className={`transition-colors group ${selectedStaffIds.has(s.id) ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                          checked={selectedStaffIds.has(s.id)}
                          onChange={() => toggleStaffSelection(s.id)}
                        />
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button 
                          onClick={() => setEditingStaff({...s})}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                          title="Edit Teacher"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                      {STAFF_COLUMNS.filter(c => visibleStaffCols.includes(c.key)).map(col => {
                        let val = s[col.key];
                        // In the old code, school_name was accessed via s.schools.school_name
                        if (col.key === 'school_name') val = s.schools?.school_name;
                        return (
                          <td key={col.key} className="px-6 py-4 text-slate-700">
                            {renderCell(val, col.key, s)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStaff.length > 50 && (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                    Showing top 50 results out of {filteredStaff.length}. Selecting "All" selects all {filteredStaff.length} rows.
                </div>
            )}
          </div>
        )}
      </div>

      {/* STAFF EDIT MODAL */}
      {viewingStaff && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Teacher Profile: {viewingStaff.teacher_name}</h3>
              <button onClick={() => setViewingStaff(null)} className="text-slate-400 hover:text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Basic Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-indigo-600 text-sm uppercase tracking-wider border-b border-indigo-100 pb-2">Basic Info</h4>
                  <div><span className="text-xs text-slate-500 block">Father/Husband Name</span><span className="font-medium">{viewingStaff.father_name || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">CNIC</span><span className="font-medium font-mono">{viewingStaff.cnic || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">Phone</span><span className="font-medium font-mono">{viewingStaff.phone || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">Gender</span><span className="font-medium">{viewingStaff.gender || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">Date of Birth</span><span className="font-medium font-mono">{viewingStaff.dob || '-'}</span></div>
                </div>

                {/* Service Details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-emerald-600 text-sm uppercase tracking-wider border-b border-emerald-100 pb-2">Service History</h4>
                  <div><span className="text-xs text-slate-500 block">Designation & BPS</span><span className="font-medium">{viewingStaff.designation || '-'} {viewingStaff.bps ? `(BPS-${viewingStaff.bps})` : ''}</span></div>
                  <div><span className="text-xs text-slate-500 block">Seniority No</span><span className="font-medium font-mono">{viewingStaff.seniority || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">Date of Joining</span><span className="font-medium font-mono">{viewingStaff.date_of_joining || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">Retirement Date</span><span className="font-medium font-mono text-rose-600">{viewingStaff.retirement_date || '-'}</span></div>
                </div>

                {/* Qualifications */}
                <div className="space-y-4">
                  <h4 className="font-bold text-amber-600 text-sm uppercase tracking-wider border-b border-amber-100 pb-2">Qualifications</h4>
                  <div><span className="text-xs text-slate-500 block">BA/BSc</span><span className="font-medium">{viewingStaff.ba_bsc || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">MA/MSc</span><span className="font-medium">{viewingStaff.ma_msc || '-'}</span></div>
                  <div><span className="text-xs text-slate-500 block">B.Ed / M.Ed</span><span className="font-medium">{viewingStaff.bed || '-'} {viewingStaff.med ? `/ ${viewingStaff.med}` : ''}</span></div>
                  <div><span className="text-xs text-slate-500 block">M.Phil / PhD</span><span className="font-medium">{viewingStaff.mphil || '-'} {viewingStaff.phd ? `/ ${viewingStaff.phd}` : ''}</span></div>
                </div>

                {/* Leaves & Assignments */}
                <div className="space-y-4">
                  <h4 className="font-bold text-blue-600 text-sm uppercase tracking-wider border-b border-blue-100 pb-2">Leaves & School</h4>
                  <div><span className="text-xs text-slate-500 block">Current School</span><span className="font-medium">{viewingStaff.schools?.school_name || viewingStaff.emis_code}</span></div>
                  <div><span className="text-xs text-slate-500 block">Casual Leaves Taken</span><span className="font-medium font-mono text-emerald-600">{viewingStaff.casual_leaves || 0}</span></div>
                  <div><span className="text-xs text-slate-500 block">Earned Leaves</span><span className="font-medium font-mono text-amber-600">{viewingStaff.earned_leaves || 0}</span></div>
                  <div><span className="text-xs text-slate-500 block">Medical Leaves</span><span className="font-medium font-mono text-blue-600">{viewingStaff.medical_leaves || 0}</span></div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setViewingStaff(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">Edit Teacher Record</h3>
              <button onClick={() => setEditingStaff(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Teacher Name</label>
                <input 
                  type="text" 
                  value={editingStaff.teacher_name || ''} 
                  onChange={(e) => setEditingStaff({...editingStaff, teacher_name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Designation</label>
                  <input 
                    type="text" 
                    value={editingStaff.designation || ''} 
                    onChange={(e) => setEditingStaff({...editingStaff, designation: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">BPS Scale</label>
                  <input 
                    type="number" 
                    value={editingStaff.bps || ''} 
                    onChange={(e) => setEditingStaff({...editingStaff, bps: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-indigo-700 mb-1">Transfer to New School (EMIS Code)</label>
                <p className="text-xs text-slate-500 mb-2">Change the EMIS code to transfer this teacher to a different school.</p>
                <input 
                  type="text" 
                  value={editingStaff.emis_code || ''} 
                  onChange={(e) => setEditingStaff({...editingStaff, emis_code: e.target.value})}
                  className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-indigo-900 font-mono font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="flex items-center gap-3 p-3 border border-rose-200 bg-rose-50 rounded-xl cursor-pointer hover:bg-rose-100 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={editingStaff.is_retired || false}
                    onChange={(e) => setEditingStaff({...editingStaff, is_retired: e.target.checked})}
                    className="w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-sm font-bold text-rose-900">Mark as Retired</div>
                    <div className="text-xs text-rose-700">This will move the teacher to the Retired Staff view.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setIsSaving(true);
                  const { error } = await supabase.from('staff').update({
                    teacher_name: editingStaff.teacher_name,
                    designation: editingStaff.designation,
                    bps: editingStaff.bps,
                    emis_code: editingStaff.emis_code,
                    is_retired: editingStaff.is_retired || false
                  }).eq('id', editingStaff.id);
                  
                  if (error) {
                    alert('Error saving data: ' + error.message);
                  } else {
                    // Update local state to reflect change instantly
                    setStaff(prev => prev.map(s => {
                        if (s.id === editingStaff.id) {
                            // Update school reference if EMIS changed
                            const newSchool = schools.find(sch => String(sch.emis_code) === String(editingStaff.emis_code));
                            return {
                                ...editingStaff,
                                schools: newSchool ? { 
                                    school_name: newSchool.school_name, 
                                    markaz: newSchool.markaz,
                                    school_type: newSchool.school_type,
                                    level: newSchool.level,
                                    gender: newSchool.gender
                                } : null
                            };
                        }
                        return s;
                    }));
                    setEditingStaff(null);
                  }
                  setIsSaving(false);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
