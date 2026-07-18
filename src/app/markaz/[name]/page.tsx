import { MapPin, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MarkazTabs from "@/components/MarkazTabs";

export const revalidate = 0;

export default async function MarkazPage({ params, searchParams }: { params: Promise<{ name: string }>, searchParams: Promise<{ filter?: string }> }) {
  const { name } = await params;
  const { filter } = await searchParams;
  const markazName = decodeURIComponent(name);
  
  // Fetch schools for this markaz
  let query = supabase.from('schools').select('*, sanctioned_posts(*)').eq('markaz', markazName);
  
  if (filter === 'sed') {
    query = query.eq('school_type', 'SED');
  }

  let { data: schoolsData, error } = await query;

  // Graceful fallback in case the user hasn't run the SQL script to create sanctioned_posts yet
  if (error) {
    console.warn("Primary query failed (likely missing relation), falling back to basic school query.", error);
    let fallbackQuery = supabase.from('schools').select('*').eq('markaz', markazName);
    if (filter === 'sed') fallbackQuery = fallbackQuery.eq('school_type', 'SED');
    
    const fallback = await fallbackQuery;
    schoolsData = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("Error fetching schools:", error);
    return <div className="p-8 text-red-500">Failed to load markaz data</div>;
  }

  const schools = (schoolsData || []) as any[];
  
  // Fetch Staff for these schools
  const emisCodes = schools.map(s => String(s.emis_code));
  
  // Fetch all staff and filter in memory
  const { data: staffData } = await supabase.from('hrmis_staff').select('*');
  const allStaff = (staffData || []) as any[];
  const markazStaff = allStaff.filter(s => emisCodes.includes(String(s.emis_code)));

  const publicSchools = schools.filter(s => s.school_type !== 'PRIVATE');
  const privateSchools = schools.filter(s => s.school_type === 'PRIVATE').sort((a, b) => (a.school_name || '').localeCompare(b.school_name || ''));

  // Sort schools by requested order: SED, then Phase 1/2 (PSRP), then PEIMA
  publicSchools.sort((a, b) => {
    const getWeight = (s: any) => {
      if (s.school_type === 'SED') return 1;
      if (s.school_type === 'PSRP' || s.psrp_phase === 'Phase 1') return 2;
      if (s.psrp_phase === 'Phase 2') return 3;
      if (s.school_type === 'PEIMA') return 4;
      return 5;
    };
    
    const weightA = getWeight(a);
    const weightB = getWeight(b);
    
    if (weightA !== weightB) return weightA - weightB;
    
    return (a.emis_code || '').localeCompare(b.emis_code || '');
  });

  // Calculate stats
  const totalSchools = publicSchools.length;
  const sedCount = publicSchools.filter(s => s.school_type === 'SED').length;
  
  let totalCurrent = 0;
  let totalTarget = 0;
  publicSchools.forEach(s => {
    totalCurrent += (s.enrollment_current || 0);
    totalTarget += (s.enrollment_target || 0);
  });
  const percentTotal = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Back navigation */}
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{markazName}</h1>
          </div>
          <p className="text-slate-500">Showing {filter === 'sed' ? 'only SED schools' : 'all schools'} in this markaz.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col shrink-0 min-w-[150px]">
             <div className="flex items-center gap-1.5 mb-1 text-slate-500">
                <Users className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Enrollment</p>
             </div>
             <div className="flex items-baseline gap-1">
               <p className="text-xl font-black text-slate-800">{totalCurrent.toLocaleString()}</p>
               <p className="text-xs font-medium text-slate-400">/ {totalTarget.toLocaleString()}</p>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
               <div className={`h-1.5 rounded-full ${percentTotal >= 100 ? 'bg-emerald-500' : percentTotal >= 80 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${Math.min(percentTotal, 100)}%` }}></div>
             </div>
          </div>

          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex gap-6 shrink-0 h-fit">
             <div className="text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
               <p className="text-xl font-black text-slate-800">{totalSchools}</p>
             </div>
             {!filter && (
               <>
               <div className="w-px bg-slate-200"></div>
               <div className="text-center">
                 <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">SED</p>
                 <p className="text-xl font-black text-emerald-700">{sedCount}</p>
               </div>
               </>
             )}
          </div>
        </div>
      </div>

      <MarkazTabs 
        markazName={markazName} 
        schools={schools} 
        staff={markazStaff} 
        publicSchools={publicSchools}
        privateSchools={privateSchools}
      />
    </div>
  );
}
