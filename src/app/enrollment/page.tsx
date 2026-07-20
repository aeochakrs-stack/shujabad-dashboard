import { Users, ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import SyncEnrollmentButton from "@/components/SyncEnrollmentButton";

export const revalidate = 0;

export default async function EnrollmentMarkazPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const filterType = resolvedParams.filter || 'all';

  const { data: schoolsData, error } = await supabase.from('schools').select('*');

  if (error) {
    console.warn("Error fetching schools:", error.message);
  }

  const schools = (schoolsData || []) as any[];
  const safeSchools = schools.filter(s => s.emis_code && s.markaz);
  
  const publicSchools = safeSchools.filter(s => {
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

  let totalCurrentEnrollment = 0;
  let totalTargetEnrollment = 0;
  publicSchools.forEach(s => {
    totalCurrentEnrollment += (s.enrollment_total || 0);
    totalTargetEnrollment += (s.enrollment_target || 0);
  });

  const enrollmentPercent = totalTargetEnrollment > 0 ? Math.round((totalCurrentEnrollment / totalTargetEnrollment) * 100) : 0;
  
  const targetMarkazs = Array.from(new Set(safeSchools.map(s => s.markaz).filter(Boolean))).sort() as string[];

  const markazMap: Record<string, { totalSchools: number, enrollCurrent: number, enrollTarget: number }> = {};
  targetMarkazs.forEach(m => { 
    markazMap[m] = { totalSchools: 0, enrollCurrent: 0, enrollTarget: 0 }; 
  });

  safeSchools.forEach(s => {
    const m = s.markaz || '';
    
    let include = false;
    if (targetMarkazs.includes(m) && !['High', 'Higher Secondary'].includes(s.level)) {
        if (filterType === 'sed') {
            include = s.school_type === 'SED';
        } else if (filterType === 'phase3') {
            include = s.psrp_phase === 'Phase 3';
        } else {
            include = s.school_type !== 'PRIVATE';
        }
    }

    if (include) {
      markazMap[m].totalSchools += 1;
      markazMap[m].enrollCurrent += (s.enrollment_total || 0);
      markazMap[m].enrollTarget += (s.enrollment_target || 0);
    }
  });

  const markazStats = targetMarkazs.map(m => ({
    name: m,
    ...markazMap[m]
  })).sort((a, b) => {
      // Sort by achievement percentage (highest first)
      const aPercent = a.enrollTarget > 0 ? (a.enrollCurrent / a.enrollTarget) : 0;
      const bPercent = b.enrollTarget > 0 ? (b.enrollCurrent / b.enrollTarget) : 0;
      return bPercent - aPercent;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Enrollment Drill-Down
          </h1>
          <p className="text-slate-500 mt-2">Level 1: Markaz-wise Tehsil Breakdown</p>
        </div>
        <SyncEnrollmentButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-8 border-b border-slate-100 bg-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Total Tehsil Enrollment</h2>
            <p className="text-sm text-slate-500 mb-4">Overall student count for the selected filters.</p>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-500 mr-2 uppercase tracking-wider">Filter:</span>
              <Link href="/enrollment" className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>All Public Schools</Link>
              <Link href="/enrollment?filter=sed" className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'sed' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>SED Only</Link>
              <Link href="/enrollment?filter=phase3" className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterType === 'phase3' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Phase 3 Only</Link>
            </div>
          </div>
          
          <div className="flex-1 max-w-sm w-full">
             <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-slate-900">{totalCurrentEnrollment.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-500">/ {totalTargetEnrollment.toLocaleString()} Target</span>
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
        
        <div className="p-6">
           <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
             <MapPin className="w-4 h-4 text-indigo-500" /> Select a Markaz to Drill Down
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             {markazStats.map(m => {
               const mPercent = m.enrollTarget > 0 ? Math.round((m.enrollCurrent / m.enrollTarget) * 100) : 0;
               return (
                 <Link key={m.name} href={`/enrollment/markaz/${encodeURIComponent(m.name)}${filterType !== 'all' ? `?filter=${filterType}` : ''}`} className="group">
                    <div className="flex flex-col p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all shadow-sm group-hover:shadow-md cursor-pointer">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-800 truncate mr-2 group-hover:text-indigo-700 transition-colors" title={m.name}>{m.name.replace(' - FEMALE', '')}</span>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${mPercent >= 100 ? 'bg-emerald-100 text-emerald-700' : mPercent >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{mPercent}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500 mb-3 font-medium">
                            <span>{m.enrollCurrent.toLocaleString()} / {m.enrollTarget.toLocaleString()}</span>
                            <span>{m.totalSchools} Schools</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className={`h-full ${mPercent >= 100 ? 'bg-emerald-500' : mPercent >= 80 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                style={{ width: `${Math.min(mPercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                 </Link>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
}
