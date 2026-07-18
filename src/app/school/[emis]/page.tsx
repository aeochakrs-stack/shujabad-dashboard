"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowLeft, Users, Building, X, Zap, Hash, MapPin, BookOpen } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FilterInput = ({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) => (
  <input 
    type="text" 
    value={value} 
    onChange={(e) => onChange(e.target.value)} 
    placeholder={placeholder}
    className="mt-2 block w-full min-w-[100px] text-xs px-2 py-1.5 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-normal text-slate-800 bg-white"
  />
);

export default function SchoolDetails({ params }: { params: Promise<{ emis: string }> }) {
  const { emis } = use(params);
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolData, setSchoolData] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [censusData, setCensusData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [viewingStaff, setViewingStaff] = useState<any>(null);

  // Column Filters State
  const [filters, setFilters] = useState({
    name: '',
    designation: '',
    bps: '',
    seniority: '',
    cnic: '',
    phone: '',
    gender: '',
    ba_bsc: '',
    ma_msc: '',
    prof: '',
    higher: '',
    dob: '',
    join_date: '',
    retirement: ''
  });

  useEffect(() => {
    async function fetchData() {
      const [staffRes, schoolRes] = await Promise.all([
        supabase.from("hrmis_staff").select("*").eq("emis_code", emis),
        supabase.from("schools").select("*").eq("emis_code", emis).single()
      ]);

      setStaff(staffRes.data || []);
      
      const school = schoolRes.data;
      setSchoolData(school);
      
      if (school && school.census_json) {
        setCensusData(school.census_json);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [emis]);

  // Combine Staff tab with dynamic Census tabs
  const censusTabs = Object.keys(censusData).map(key => ({
    id: key,
    label: key,
    icon: Building
  }));
  
  const tabs = [
    { id: "overview", label: "School Overview", icon: Building },
    { id: "staff", label: "Staff Data", icon: Users },
    ...censusTabs
  ];

  const filteredStaff = staff.filter(s => {
    if (filters.name && !(s.teacher_name || '').toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.designation && !(s.designation || '').toLowerCase().includes(filters.designation.toLowerCase())) return false;
    if (filters.bps && !String(s.bps || '').includes(filters.bps)) return false;
    if (filters.seniority && !String(s.seniority || '').includes(filters.seniority)) return false;
    if (filters.cnic && !(s.cnic || '').includes(filters.cnic)) return false;
    if (filters.phone && !(s.phone || '').includes(filters.phone)) return false;
    if (filters.gender && !(s.gender || '').toLowerCase().includes(filters.gender.toLowerCase())) return false;
    if (filters.ba_bsc && !(s.ba_bsc || '').toLowerCase().includes(filters.ba_bsc.toLowerCase())) return false;
    if (filters.ma_msc && !(s.ma_msc || '').toLowerCase().includes(filters.ma_msc.toLowerCase())) return false;
    if (filters.prof && !((s.bed || '') + (s.med || '')).toLowerCase().includes(filters.prof.toLowerCase())) return false;
    if (filters.higher && !((s.mphil || '') + (s.phd || '')).toLowerCase().includes(filters.higher.toLowerCase())) return false;
    if (filters.dob && !(s.dob || '').includes(filters.dob)) return false;
    if (filters.join_date && !(s.date_of_joining || '').includes(filters.join_date)) return false;
    if (filters.retirement && !(s.retirement_date || '').includes(filters.retirement)) return false;
    return true;
  });

  if (loading) return <div className="p-10 text-center text-slate-500">Loading data...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[100vw] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900">{schoolData?.school_name || `School EMIS: ${emis}`}</h1>
            <p className="mt-1 text-sm text-slate-500">Comprehensive HRMIS and School Census profile (EMIS: {emis}).</p>
          </div>
        </div>

        {/* Tabs - Multi-line Wrap */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2 pb-2" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors
                  ${activeTab === tab.id 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                `}
              >
                <tab.icon className={`mr-2 h-4 w-4 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-6 h-6 text-indigo-600"/>
                  School Overview
                </h2>
              </div>
              
              {schoolData?.solar_meter_reference && (
                <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      Solar System
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-800 uppercase tracking-widest border border-amber-300">
                        Solarized
                      </span>
                    </p>
                    <p className="font-mono text-slate-900 mt-0.5 text-sm" title="Electricity Bill Reference Number">
                      Ref: {schoolData.solar_meter_reference}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Identification */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Identification</h3>
                  <div className="space-y-3">
                    <div><span className="text-xs text-slate-500 block">School Name</span><span className="font-bold text-slate-800">{schoolData?.school_name || '-'}</span></div>
                    <div><span className="text-xs text-slate-500 block">EMIS Code</span><span className="font-mono font-bold text-indigo-600">{schoolData?.emis_code || '-'}</span></div>
                    <div><span className="text-xs text-slate-500 block">Markaz</span><span className="font-medium text-slate-700">{schoolData?.markaz || '-'}</span></div>
                  </div>
                </div>

                {/* Classification */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Classification</h3>
                  <div className="space-y-3">
                    <div><span className="text-xs text-slate-500 block">School Type</span><span className="font-bold text-emerald-600">{schoolData?.school_type || '-'}</span></div>
                    <div><span className="text-xs text-slate-500 block">Level</span><span className="font-medium text-slate-700">{schoolData?.level || '-'}</span></div>
                    <div><span className="text-xs text-slate-500 block">Gender</span><span className="font-medium text-slate-700">{schoolData?.gender || '-'}</span></div>
                  </div>
                </div>

                {/* Enrollment & Status */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Enrollment & Status</h3>
                  <div className="space-y-3">
                    <div><span className="text-xs text-slate-500 block">Total Enrollment</span><span className="font-bold text-amber-600 text-lg">{schoolData?.enrollment_total || 0}</span></div>
                    <div><span className="text-xs text-slate-500 block">PSRP Phase</span><span className="font-medium text-slate-700">{schoolData?.psrp_phase || '-'}</span></div>
                    {schoolData?.school_type !== 'PRIVATE' && (
                      <div><span className="text-xs text-slate-500 block">Sanctioned Posts</span><span className="font-medium text-slate-700">{schoolData?.sanctioned_posts || 0}</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAFF TABS */}
          {activeTab === "staff" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500"/>
                  Teaching & Support Staff ({filteredStaff.length} found)
                </h2>
                <button 
                  onClick={() => setFilters({ name: '', designation: '', seniority: '', cnic: '', phone: '', gender: '', ba_bsc: '', ma_msc: '', prof: '', higher: '', dob: '', join_date: '', retirement: '' })}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Clear Column Filters
                </button>
              </div>
              
              {staff.length === 0 ? (
                <p className="text-sm text-slate-500">No staff records found for this school.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 w-full" style={{ maxWidth: 'calc(100vw - 4rem)' }}>
                  <table className="min-w-max divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Teacher Name</span>
                          <FilterInput value={filters.name} onChange={v => setFilters({...filters, name: v})} placeholder="Search name..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Designation</span>
                          <FilterInput value={filters.designation} onChange={v => setFilters({...filters, designation: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">BPS Scale</span>
                          <FilterInput value={filters.bps} onChange={v => setFilters({...filters, bps: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Seniority</span>
                          <FilterInput value={filters.seniority} onChange={v => setFilters({...filters, seniority: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gender</span>
                          <FilterInput value={filters.gender} onChange={v => setFilters({...filters, gender: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CNIC</span>
                          <FilterInput value={filters.cnic} onChange={v => setFilters({...filters, cnic: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone</span>
                          <FilterInput value={filters.phone} onChange={v => setFilters({...filters, phone: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">BA/BSc</span>
                          <FilterInput value={filters.ba_bsc} onChange={v => setFilters({...filters, ba_bsc: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">MA/MSc</span>
                          <FilterInput value={filters.ma_msc} onChange={v => setFilters({...filters, ma_msc: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">B.Ed/M.Ed</span>
                          <FilterInput value={filters.prof} onChange={v => setFilters({...filters, prof: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">MPhil/PhD</span>
                          <FilterInput value={filters.higher} onChange={v => setFilters({...filters, higher: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DOB</span>
                          <FilterInput value={filters.dob} onChange={v => setFilters({...filters, dob: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Join Date</span>
                          <FilterInput value={filters.join_date} onChange={v => setFilters({...filters, join_date: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Retirement</span>
                          <FilterInput value={filters.retirement} onChange={v => setFilters({...filters, retirement: v})} placeholder="Filter..." />
                        </th>
                        <th className="px-4 py-3 text-left align-top">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Leaves (C/E/M)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredStaff.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div onClick={() => setViewingStaff(s)} className="font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 text-sm hover:underline">{s.teacher_name}</div>
                            {s.father_name && <div className="text-[10px] text-slate-500 mt-0.5">D/O {s.father_name}</div>}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-medium text-slate-700 text-sm">{s.designation || '-'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {s.bps ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">BPS-{s.bps}</span> : '-'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm font-mono whitespace-nowrap">{s.seniority || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{s.gender || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm font-mono whitespace-nowrap">{s.cnic || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm font-mono whitespace-nowrap">{s.phone || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{s.ba_bsc || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">{s.ma_msc || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">
                            {s.bed ? `B.Ed: ${s.bed}` : ''}
                            {s.bed && s.med ? <br /> : ''}
                            {s.med ? `M.Ed: ${s.med}` : (!s.bed ? '-' : '')}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">
                            {s.mphil ? `M.Phil: ${s.mphil}` : ''}
                            {s.mphil && s.phd ? <br /> : ''}
                            {s.phd ? `PhD: ${s.phd}` : (!s.mphil ? '-' : '')}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-sm font-mono whitespace-nowrap">{s.dob || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm font-mono whitespace-nowrap">{s.date_of_joining || '-'}</td>
                          <td className="px-4 py-3 text-rose-600 text-sm font-medium font-mono whitespace-nowrap">{s.retirement_date || '-'}</td>
                          <td className="px-4 py-3 text-slate-600 text-sm font-mono whitespace-nowrap">
                            <span className="text-emerald-600 font-bold">{s.casual_leaves || 0}</span> / <span className="text-amber-600 font-bold">{s.earned_leaves || 0}</span> / <span className="text-blue-600 font-bold">{s.medical_leaves || 0}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC CENSUS TABS */}
          {!activeTab.startsWith("staff") && censusData[activeTab] && (
            <div>
              <h2 className="text-lg font-medium text-slate-900 mb-6 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500"/>
                {activeTab}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(censusData[activeTab]).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                    <p className="text-base font-medium text-slate-900">
                      {val === 'Yes' || val === true ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-700">Yes</span>
                      ) : val === 'No' || val === false ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-rose-100 text-rose-700">No</span>
                      ) : (
                        String(val) || 'N/A'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

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
    </div>
  );
}
