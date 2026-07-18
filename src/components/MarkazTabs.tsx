'use client';

import { useState } from 'react';
import { School, LayoutGrid, FileText, UserMinus } from "lucide-react";
import Link from "next/link";
import DynamicTable from "@/components/DynamicTable";
import { SCHOOL_COLUMNS, STAFF_COLUMNS, DEFAULT_SCHOOL_COLS, DEFAULT_STAFF_COLS } from "@/lib/columns";

export default function MarkazTabs({ markazName, schools, staff, publicSchools, privateSchools }: { 
  markazName: string, 
  schools: any[], 
  staff: any[],
  publicSchools: any[],
  privateSchools: any[]
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'staff'>('overview');
  const [filter, setFilter] = useState<'Public' | 'Private'>('Public');

  const staffWithSchoolNames = staff.map(item => {
    const school = schools.find(s => String(s.emis_code) === String(item.emis_code));
    return { ...item, school_name: school?.school_name || 'Unknown' };
  });

  const schoolsWithTotals = schools.map(s => {
    let total_sanctioned = 0;
    let total_filled = 0;
    let total_vacant = 0;
    
    if (s.sanctioned_posts) {
      s.sanctioned_posts.forEach((p: any) => {
        total_sanctioned += (p.sanctioned || 0);
        total_filled += (p.filled || 0);
        total_vacant += (p.vacant || 0);
      });
    }

    const enr_primary = (s.enr_katchi||0) + (s.enr_class_1||0) + (s.enr_class_2||0) + (s.enr_class_3||0) + (s.enr_class_4||0) + (s.enr_class_5||0);
    const enr_middle = (s.enr_class_6||0) + (s.enr_class_7||0) + (s.enr_class_8||0);
    const enr_high = (s.enr_class_9||0) + (s.enr_class_10||0);
    const enr_hsec = (s.enr_class_11||0) + (s.enr_class_12||0);

    return { ...s, total_sanctioned, total_filled, total_vacant, enr_primary, enr_middle, enr_high, enr_hsec };
  });

  const processedSchools = schoolsWithTotals
    .filter(s => {
      const isPrivate = String(s.emis_code).startsWith('PRIV-') || String(s.emis_code).startsWith('ZC-');
      return filter === 'Public' ? !isPrivate : isPrivate;
    })
    .sort((a, b) => {
      const getWeight = (s: any) => {
        if (s.school_type === 'SED') return 1;
        if (s.school_type === 'PSRP' || s.psrp_phase === 'Phase 1') return 2;
        if (s.psrp_phase === 'Phase 2') return 3;
        if (s.school_type === 'PEIMA') return 4;
        return 5; // Private or other
      };
      
      const weightA = getWeight(a);
      const weightB = getWeight(b);
      
      if (weightA !== weightB) return weightA - weightB;
      
      // Secondary sort: by enrollment descending
      const enrA = a.enrollment_current || 0;
      const enrB = b.enrollment_current || 0;
      if (enrA !== enrB) return enrB - enrA;
      
      return (a.school_name || '').localeCompare(b.school_name || '');
    });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <LayoutGrid className="w-4 h-4" /> Cards Overview
        </button>
        <button
          onClick={() => setActiveTab('schools')}
          className={`px-6 py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'schools' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <FileText className="w-4 h-4" /> All School Data
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'staff' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <UserMinus className="w-4 h-4" /> Staff Directory
        </button>
      </div>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-500"/>
              Public Schools <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs ml-2">{publicSchools.length}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {processedSchools.map((school: any) => (
                <Link key={school.emis_code} href={`/school/${school.emis_code}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-mono text-slate-400 mb-1">{school.emis_code}</p>
                        <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors" title={school.school_name}>
                          {school.school_name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4 flex-wrap">
                      {school.is_asp === true && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">
                          ASP (2nd Shift)
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {school.level}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {school.gender}
                      </span>
                      {school.school_type === 'SED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                          SED
                        </span>
                      )}
                      {school.school_type === 'PEIMA' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                          PEIMA
                        </span>
                      )}
                      {school.school_type === 'PSRP' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 uppercase tracking-wider">
                          {school.psrp_phase || 'PSRP'}
                        </span>
                      )}
                      {school.school_type === 'SED' && school.psrp_phase === 'Phase 3' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                          Phase 3
                        </span>
                      )}
                    </div>

                    {(school.enr_primary > 0 || school.enr_middle > 0 || school.enr_high > 0) && (
                      <div className="flex gap-2 mb-4">
                        {school.enr_primary > 0 && (
                          <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Primary</p>
                            <p className="text-sm font-black text-blue-700">{school.enr_primary}</p>
                          </div>
                        )}
                        {school.enr_middle > 0 && (
                          <div className="flex-1 bg-amber-50 rounded-lg p-2 text-center border border-amber-100 relative group/tooltip">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">{school.is_asp ? 'ASP Middle' : 'Middle'}</p>
                            <p className="text-sm font-black text-amber-700">{school.enr_middle}</p>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 w-max px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                              C6: {school.enr_class_6 || 0} | C7: {school.enr_class_7 || 0} | C8: {school.enr_class_8 || 0}
                            </div>
                          </div>
                        )}
                        {school.enr_high > 0 && (
                          <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100 relative group/tooltip">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">High</p>
                            <p className="text-sm font-black text-emerald-700">{school.enr_high}</p>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 w-max px-2 py-1 bg-slate-800 text-white text-[10px] font-bold rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity">
                              C9: {school.enr_class_9 || 0} | C10: {school.enr_class_10 || 0}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {school.sanctioned_posts && school.sanctioned_posts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <table className="w-full text-xs text-left text-slate-600">
                          <thead>
                            <tr className="text-slate-400 uppercase">
                              <th className="pb-1">Post</th>
                              <th className="pb-1 text-right">S</th>
                              <th className="pb-1 text-right">F</th>
                              <th className="pb-1 text-right text-rose-500">V</th>
                            </tr>
                          </thead>
                          <tbody>
                            {school.sanctioned_posts.map((p: any, i: number) => (
                              <tr key={i} className="border-b border-slate-50 last:border-0">
                                <td className="py-0.5 font-medium text-slate-700">{p.designation}</td>
                                <td className="py-0.5 text-right font-bold">{p.sanctioned}</td>
                                <td className="py-0.5 text-right font-bold">{p.filled}</td>
                                <td className="py-0.5 text-right font-bold text-rose-500">{p.vacant}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {privateSchools.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <School className="w-5 h-5 text-slate-500"/>
                Private Schools <span className="bg-slate-100 text-slate-700 py-0.5 px-2 rounded-full text-xs ml-2">{privateSchools.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {privateSchools.map((school: any) => {
                  const isRegistered = school.emis_code?.startsWith('PRIV-R-');
                  
                  return (
                    <Link key={school.emis_code} href={`/school/${school.emis_code}`}>
                      <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-slate-300 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs font-mono text-slate-400 mb-1">{school.emis_code}</p>
                            <h3 className="font-bold text-slate-700 line-clamp-2 group-hover:text-slate-900 transition-colors" title={school.school_name}>
                              {school.school_name}
                            </h3>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-500 uppercase tracking-wider border border-slate-200">
                            PRIVATE
                          </span>
                          {isRegistered ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                              REGISTERED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
                              NOT REGISTERED
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: SCHOOLS TABLE */}
      {activeTab === 'schools' && (
        <DynamicTable 
          data={schoolsWithTotals}
          columns={SCHOOL_COLUMNS}
          defaultVisibleColumns={DEFAULT_SCHOOL_COLS}
          exportFileName={`${markazName}_Schools`}
          searchPlaceholder="Search schools by name or EMIS..."
        />
      )}

      {/* Tab Content: STAFF TABLE */}
      {activeTab === 'staff' && (
        <DynamicTable 
          data={staffWithSchoolNames}
          columns={STAFF_COLUMNS}
          defaultVisibleColumns={DEFAULT_STAFF_COLS}
          exportFileName={`${markazName}_Staff`}
          searchPlaceholder="Search staff by name, CNIC, Personnel No..."
        />
      )}

    </div>
  );
}
