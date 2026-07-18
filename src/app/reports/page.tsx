'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, UserMinus, Calendar, Key, AlertTriangle, Download, Filter, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ReportType = 'retirements' | 'passwords' | 'audit';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('retirements');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [staff, setStaff] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  
  // Retirement State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [staffRes, schoolsRes] = await Promise.all([
          supabase.from('hrmis_staff').select('*'),
          supabase.from('schools').select('*')
      ]);

      setStaff(staffRes.data || []);
      setSchools(schoolsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // --- REPORT 1: RETIREMENTS ---
  const retiringStaff = useMemo(() => {
      const results = [];
      for (const s of staff) {
        if (!s.dob) continue;
        
        const dob = new Date(s.dob);
        if (isNaN(dob.getTime())) continue;
        
        const retirementDate = new Date(dob);
        retirementDate.setFullYear(dob.getFullYear() + 60);
        
        if (retirementDate.getFullYear() === selectedYear) {
            const school = schools.find(sch => String(sch.emis_code) === String(s.emis_code));
            results.push({
                ...s,
                school_name: school?.school_name || 'Unknown',
                markaz: school?.markaz || 'Unknown',
                retirement_date: retirementDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                retirement_date_obj: retirementDate
            });
        }
      }
      return results.sort((a, b) => a.retirement_date_obj.getTime() - b.retirement_date_obj.getTime());
  }, [staff, schools, selectedYear]);

  // --- REPORT 2: PASSWORDS ROSTER ---
  const passwordsRoster = useMemo(() => {
      return schools.map(s => ({
          emis_code: s.emis_code,
          school_name: s.school_name,
          markaz: s.markaz,
          type: s.school_type,
          sis_password: s.sis_password || '-',
          dengue_password: s.dengue_password || '-',
          focal_person_cell: s.focal_person_cell || '-'
      })).sort((a, b) => (a.markaz || '').localeCompare(b.markaz || ''));
  }, [schools]);

  // --- REPORT 3: MISSING DATA AUDIT ---
  const missingDataAudit = useMemo(() => {
      return schools.filter(s => !s.sis_password || !s.dengue_password || !s.focal_person_cell || !s.head_name || !s.head_contact)
      .map(s => {
          const missingFields = [];
          if (!s.sis_password) missingFields.push('SIS Password');
          if (!s.dengue_password) missingFields.push('Dengue Password');
          if (!s.focal_person_cell) missingFields.push('Focal Person');
          if (!s.head_name || !s.head_contact) missingFields.push('Head/Contact');
          
          return {
              emis_code: s.emis_code,
              school_name: s.school_name,
              markaz: s.markaz,
              missing_count: missingFields.length,
              missing_fields: missingFields.join(', ')
          };
      }).sort((a, b) => b.missing_count - a.missing_count);
  }, [schools]);

  const exportExcel = (data: any[], filename: string) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report Generator</h1>
                <p className="mt-1 text-sm text-slate-500">Generate automated lists, rosters, and audits from the district database.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Container */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Menu */}
          <div className="w-full lg:w-64 shrink-0 space-y-2">
            <button 
              onClick={() => setActiveReport('retirements')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all ${activeReport === 'retirements' ? 'bg-white shadow-sm border border-indigo-200 text-indigo-700' : 'text-slate-600 hover:bg-slate-200 border border-transparent'}`}
            >
              <UserMinus className={`w-5 h-5 ${activeReport === 'retirements' ? 'text-indigo-500' : 'text-slate-400'}`} />
              Retirement Forecast
            </button>
            <button 
              onClick={() => setActiveReport('passwords')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all ${activeReport === 'passwords' ? 'bg-white shadow-sm border border-amber-200 text-amber-700' : 'text-slate-600 hover:bg-slate-200 border border-transparent'}`}
            >
              <Key className={`w-5 h-5 ${activeReport === 'passwords' ? 'text-amber-500' : 'text-slate-400'}`} />
              Passwords Roster
            </button>
            <button 
              onClick={() => setActiveReport('audit')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold text-sm transition-all ${activeReport === 'audit' ? 'bg-white shadow-sm border border-rose-200 text-rose-700' : 'text-slate-600 hover:bg-slate-200 border border-transparent'}`}
            >
              <AlertTriangle className={`w-5 h-5 ${activeReport === 'audit' ? 'text-rose-500' : 'text-slate-400'}`} />
              Missing Data Audit
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-slate-500 font-medium">Analyzing database...</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                
                {/* --- RETIREMENT REPORT --- */}
                {activeReport === 'retirements' && (
                  <>
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Staff Retirement Forecast</h2>
                        <p className="text-sm text-slate-500 mt-1">Teachers reaching 60 years of age.</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <select 
                           value={selectedYear} 
                           onChange={(e) => setSelectedYear(Number(e.target.value))}
                           className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 font-bold"
                         >
                           <option value={2025}>2025</option>
                           <option value={2026}>2026 (Current)</option>
                           <option value={2027}>2027</option>
                           <option value={2028}>2028</option>
                           <option value={2029}>2029</option>
                         </select>
                         <button onClick={() => exportExcel(retiringStaff, `Retirements_${selectedYear}`)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                           <Download className="w-4 h-4" /> Export
                         </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Teacher Name</th>
                            <th className="px-6 py-4 font-semibold">Designation & BPS</th>
                            <th className="px-6 py-4 font-semibold">School & Markaz</th>
                            <th className="px-6 py-4 font-semibold">Retirement Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {retiringStaff.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No staff retiring in {selectedYear}.</td></tr>
                          ) : (
                            retiringStaff.map((staff) => (
                              <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800">{staff.teacher_name}</div>
                                  <div className="text-xs text-slate-500 mt-1">{staff.cnic || 'No CNIC'}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-slate-700">{staff.designation}</div>
                                  <div className="text-xs text-slate-500 mt-1">BPS {staff.bps}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-medium text-slate-700">{staff.school_name}</div>
                                  <div className="text-xs text-slate-500 mt-1">{staff.markaz}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {staff.retirement_date}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* --- PASSWORDS ROSTER --- */}
                {activeReport === 'passwords' && (
                  <>
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Passwords Roster</h2>
                        <p className="text-sm text-slate-500 mt-1">SIS, Dengue, and Focal Person master list.</p>
                      </div>
                      <button onClick={() => exportExcel(passwordsRoster, `Passwords_Roster`)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                        <Download className="w-4 h-4" /> Export All
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="px-6 py-4 font-semibold">School Name & EMIS</th>
                            <th className="px-6 py-4 font-semibold">Markaz</th>
                            <th className="px-6 py-4 font-semibold">SIS Password</th>
                            <th className="px-6 py-4 font-semibold">Dengue Password</th>
                            <th className="px-6 py-4 font-semibold">Focal Person Cell</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {passwordsRoster.map((school) => (
                            <tr key={school.emis_code} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{school.school_name}</div>
                                <div className="font-mono text-slate-500 text-xs mt-1">{school.emis_code}</div>
                              </td>
                              <td className="px-6 py-4 text-slate-600">{school.markaz}</td>
                              <td className="px-6 py-4 font-mono text-slate-700">{school.sis_password}</td>
                              <td className="px-6 py-4 font-mono text-slate-700">{school.dengue_password}</td>
                              <td className="px-6 py-4 font-mono text-slate-700">{school.focal_person_cell}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* --- MISSING DATA AUDIT --- */}
                {activeReport === 'audit' && (
                  <>
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Missing Data Audit</h2>
                        <p className="text-sm text-rose-500 mt-1">{missingDataAudit.length} schools have incomplete profiles.</p>
                      </div>
                      <button onClick={() => exportExcel(missingDataAudit, `Missing_Data_Audit`)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                        <Download className="w-4 h-4" /> Export Audit
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="px-6 py-4 font-semibold">School Name & EMIS</th>
                            <th className="px-6 py-4 font-semibold">Markaz</th>
                            <th className="px-6 py-4 font-semibold text-rose-600">Missing Fields ({missingDataAudit.length} Schools)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {missingDataAudit.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-emerald-600 font-bold">All schools have complete data!</td></tr>
                          ) : (
                            missingDataAudit.map((school) => (
                              <tr key={school.emis_code} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <Link href={`/school/${school.emis_code}`} className="font-bold text-indigo-600 hover:text-indigo-800">{school.school_name}</Link>
                                  <div className="font-mono text-slate-500 text-xs mt-1">{school.emis_code}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{school.markaz}</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-2">
                                    {school.missing_fields.split(', ').map((field: string) => (
                                      <span key={field} className="px-2 py-1 rounded bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                                        {field}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
