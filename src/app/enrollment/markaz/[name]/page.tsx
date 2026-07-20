import { School, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import SyncEnrollmentButton from "@/components/SyncEnrollmentButton";

export const revalidate = 0;

export default async function EnrollmentSchoolPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ name: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const markazName = decodeURIComponent(resolvedParams.name);
  const filterType = resolvedSearch.filter || 'all';
  
  const { data: schoolsData, error } = await supabase
    .from('schools')
    .select('*')
    .eq('markaz', markazName)
    .order('school_name', { ascending: true });

  if (error) {
    console.warn("Error fetching schools:", error.message);
  }

  const schools = ((schoolsData || []) as any[]).filter(s => {
    // Always exclude High/Higher Secondary
    if (['High', 'Higher Secondary'].includes(s.level)) return false;
    
    // Apply UI Filters
    if (filterType === 'sed') {
        return s.school_type === 'SED';
    }
    if (filterType === 'phase3') {
        return s.psrp_phase === 'Phase 3';
    }
    
    // Default: All public schools (exclude PRIVATE)
    return s.school_type !== 'PRIVATE';
  });

  let markazCurrentEnrollment = 0;
  let markazTargetEnrollment = 0;
  
  schools.forEach(s => {
    markazCurrentEnrollment += (s.enrollment_total || 0);
    markazTargetEnrollment += (s.enrollment_target || 0);
  });

  const enrollmentPercent = markazTargetEnrollment > 0 ? Math.round((markazCurrentEnrollment / markazTargetEnrollment) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/enrollment" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Markaz List
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            {markazName}
          </h1>
          <p className="text-slate-500 mt-2">Level 2: School-wise Enrollment Breakdown</p>
        </div>
        <SyncEnrollmentButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-8 border-b border-slate-100 bg-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Total Markaz Enrollment</h2>
            <p className="text-sm text-slate-500 mb-4">Combined student count for {schools.length} schools matching filters.</p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-500 mr-2 uppercase tracking-wider">Filter:</span>
              <Link href={`/enrollment/markaz/${encodeURIComponent(markazName)}`} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>All Public Schools</Link>
              <Link href={`/enrollment/markaz/${encodeURIComponent(markazName)}?filter=sed`} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'sed' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>SED Only</Link>
              <Link href={`/enrollment/markaz/${encodeURIComponent(markazName)}?filter=phase3`} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'phase3' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Phase 3 Only</Link>
            </div>
          </div>
          
          <div className="flex-1 max-w-sm w-full">
             <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-slate-900">{markazCurrentEnrollment.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-500">/ {markazTargetEnrollment.toLocaleString()} Target</span>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-3 mb-1 overflow-hidden shadow-inner">
                <div 
                  className={`h-full ${enrollmentPercent >= 100 ? 'bg-emerald-500' : enrollmentPercent >= 80 ? 'bg-amber-400' : 'bg-rose-500'} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(enrollmentPercent, 100)}%` }}
                ></div>
             </div>
             <p className="text-xs font-bold text-slate-500 text-right">{enrollmentPercent}% Achieved</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold">EMIS Code</th>
                <th className="px-6 py-4 font-semibold">School Name</th>
                <th className="px-6 py-4 font-semibold text-center">Level</th>
                <th className="px-6 py-4 font-semibold text-right">Current</th>
                <th className="px-6 py-4 font-semibold text-right">Target</th>
                <th className="px-6 py-4 font-semibold text-center">Achievement</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map(s => {
                  const sCurrent = s.enrollment_total || 0;
                  const sTarget = s.enrollment_target || 0;
                  const sPercent = sTarget > 0 ? Math.round((sCurrent / sTarget) * 100) : 0;
                  
                  return (
                      <tr key={s.emis_code} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{s.emis_code}</td>
                          <td className="px-6 py-4">
                             <Link href={`/enrollment/school/${s.emis_code}`} className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {s.school_name}
                             </Link>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">{s.level}</span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">{sCurrent.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-500">{sTarget.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold ${sPercent >= 100 ? 'bg-emerald-100 text-emerald-700' : sPercent >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {sPercent}%
                              </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                              <Link 
                                href={`/enrollment/school/${s.emis_code}`}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                              >
                                View Classes
                              </Link>
                          </td>
                      </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
