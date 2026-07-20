import { School, Building, MapPin, GraduationCap, Users, BookOpen, RefreshCw, Smartphone, Phone, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AeoBadge from "@/components/AeoBadge";
import SyncEnrollmentButton from "@/components/SyncEnrollmentButton";

export const revalidate = 0;

export default async function Home() {
  const { data: schoolsData, error } = await supabase.from('schools').select('*');
  const { data: stiData, error: stiError } = await supabase.from('sti_teachers').select('id');

  if (error) {
    console.warn("Error fetching schools (tables might be missing):", error.message);
  }

  const schools = (schoolsData || []) as any[];
  const totalSti = stiData?.length || 0;

  const safeSchools = schools.filter(s => s.emis_code && s.markaz);

  // Filter out private schools from totals
  const publicSchools = safeSchools.filter(s => s.school_type !== 'PRIVATE');
  const privateTotal = safeSchools.filter(s => s.school_type === 'PRIVATE').length;

  const totalSchools = publicSchools.length;
  const sedSchools = publicSchools.filter(s => s.school_type === 'SED').length;
  const peimaSchools = publicSchools.filter(s => s.school_type === 'PEIMA').length;
  const psrpSchools = publicSchools.filter(s => s.school_type === 'PSRP').length;
  const phase3Schools = publicSchools.filter(s => s.psrp_phase === 'Phase 3').length;
  const aspSchools = publicSchools.filter(s => s.is_asp === true).length;

  let totalCurrentEnrollment = 0;
  let totalTargetEnrollment = 0;
  publicSchools.forEach(s => {
    totalCurrentEnrollment += (s.enrollment_total || 0);
    totalTargetEnrollment += (s.enrollment_target || 0);
  });

  const enrollmentPercent = totalTargetEnrollment > 0 ? Math.round((totalCurrentEnrollment / totalTargetEnrollment) * 100) : 0;
  
  // Dynamically get ALL Markazs from the database (Male, Female, High, Higher Secondary, etc)
  const targetMarkazs = Array.from(new Set(safeSchools.map(s => s.markaz).filter(Boolean))).sort() as string[];

  const markazMap: Record<string, { total: number, phase1: number, phase2: number, phase3: number, sed: number, peima: number, enrollCurrent: number, enrollTarget: number }> = {};
  targetMarkazs.forEach(m => { 
    markazMap[m] = { total: 0, phase1: 0, phase2: 0, phase3: 0, sed: 0, peima: 0, enrollCurrent: 0, enrollTarget: 0 }; 
  });

  safeSchools.forEach(s => {
    const m = s.markaz || '';
    if (targetMarkazs.includes(m)) {
      markazMap[m].total += 1;
      if (s.school_type === 'PSRP' && s.psrp_phase === 'Phase 1') markazMap[m].phase1 += 1;
      if (s.school_type === 'PSRP' && s.psrp_phase === 'Phase 2') markazMap[m].phase2 += 1;
      if (s.psrp_phase === 'Phase 3') markazMap[m].phase3 += 1;
      if (s.school_type === 'SED') markazMap[m].sed += 1;
      if (s.school_type === 'PEIMA') markazMap[m].peima += 1;
      
      // Track enrollment (only for public schools)
      if (s.school_type !== 'PRIVATE') {
        markazMap[m].enrollCurrent += (s.enrollment_total || 0);
        markazMap[m].enrollTarget += (s.enrollment_target || 0);
      }
    }
  });

  const markazStats = targetMarkazs.map(m => ({
    name: m,
    ...markazMap[m]
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <Link href="/">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer">Shujabad<span className="text-indigo-600">Edu</span></h1>
          </Link>
          <p className="text-sm text-slate-500 mt-1">Real-time educational monitoring and reporting</p>
        </div>
        <SyncEnrollmentButton />
      </header>

      {/* Categories Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Link href="/category/SED" className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <Building className="w-6 h-6 text-emerald-600 mb-2" />
           <span className="text-xl font-black text-emerald-900">{sedSchools}</span>
           <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">SED</span>
        </Link>
        <Link href="/category/PEIMA" className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <Building className="w-6 h-6 text-indigo-600 mb-2" />
           <span className="text-xl font-black text-indigo-900">{peimaSchools}</span>
           <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">PEIMA</span>
        </Link>
        <Link href="/category/PSRP" className="bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <GraduationCap className="w-6 h-6 text-amber-600 mb-2" />
           <span className="text-xl font-black text-amber-900">{psrpSchools}</span>
           <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">PSRP</span>
        </Link>
        <Link href="/category/Phase 3" className="bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <Building className="w-6 h-6 text-rose-600 mb-2" />
           <span className="text-xl font-black text-rose-900">{phase3Schools}</span>
           <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Phase 3</span>
        </Link>
        <Link href="/category/ASP" className="bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <BookOpen className="w-6 h-6 text-fuchsia-600 mb-2" />
           <span className="text-xl font-black text-fuchsia-900">{aspSchools}</span>
           <span className="text-xs font-bold text-fuchsia-700 uppercase tracking-wider">ASP</span>
        </Link>
        <Link href="/category/STI" className="bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <Users className="w-6 h-6 text-cyan-600 mb-2" />
           <span className="text-xl font-black text-cyan-900">{totalSti}</span>
           <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">STI</span>
        </Link>
        <Link href="/category/PRIVATE" className="bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <School className="w-6 h-6 text-slate-600 mb-2" />
           <span className="text-xl font-black text-slate-900">{privateTotal}</span>
           <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">PRIVATE</span>
        </Link>
        <Link href="/aeos" className="bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm">
           <UserCheck className="w-6 h-6 text-sky-600 mb-2" />
           <span className="text-xl font-black text-sky-900">12</span>
           <span className="text-xs font-bold text-sky-700 uppercase tracking-wider text-center px-2">Assistant Education Officers</span>
        </Link>
        <Link href="/budget" className="bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm shadow-emerald-200 col-span-2 md:col-span-1">
           <Building className="w-6 h-6 text-white mb-2" />
           <span className="text-xl font-black text-white">Budget</span>
           <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Account Office Data</span>
        </Link>
        <Link href="/schools" className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-700 transition-colors rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm shadow-indigo-200 col-span-2 md:col-span-1">
           <Users className="w-6 h-6 text-white mb-2" />
           <span className="text-xl font-black text-white">All Data</span>
           <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">School and Markaz Wise Data</span>
        </Link>
      </div>

      {/* Enrollment Card (Collapsed) */}
      <Link href="/enrollment" className="block bg-white hover:bg-indigo-50/30 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm overflow-hidden group">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1 group-hover:text-indigo-600 transition-colors">
              <Users className="w-6 h-6 text-indigo-500"/> Tehsil Enrollment Drill-Down &rarr;
            </h2>
            <p className="text-sm text-slate-500">Click to view Markaz-wise, School-wise, and Class-wise breakdowns.</p>
          </div>
          
          <div className="flex-1 max-w-sm">
             <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-slate-900">{totalCurrentEnrollment.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-500">/ {totalTargetEnrollment.toLocaleString()} Target</span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-3 mb-1 overflow-hidden shadow-inner">
                <div 
                  className={`h-full ${enrollmentPercent >= 100 ? 'bg-emerald-500' : enrollmentPercent >= 80 ? 'bg-amber-400' : 'bg-rose-500'} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(enrollmentPercent, 100)}%` }}
                ></div>
             </div>
             <p className="text-xs font-bold text-slate-400 text-right">{enrollmentPercent}% Achieved</p>
          </div>
        </div>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Markaz Overview
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
            {totalSchools} Total Schools
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Markaz</th>
                <th className="px-6 py-4 font-semibold text-center">Officer</th>
                <th className="px-6 py-4 font-semibold text-center bg-indigo-50/50 text-indigo-800">Total</th>
                <th className="px-6 py-4 font-semibold text-center text-emerald-700">SED</th>
                <th className="px-6 py-4 font-semibold text-center text-rose-700">Phase 3</th>
                <th className="px-6 py-4 font-semibold text-center text-amber-700">PSRP (Ph 1/2)</th>
                <th className="px-6 py-4 font-semibold text-center text-indigo-700">PEIMA</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {markazStats.map((m) => (
                <tr key={m.name} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/markaz/${encodeURIComponent(m.name)}`} className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      <School className="w-4 h-4 text-slate-400" />
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AeoBadge markazName={m.name} defaultName="AEO" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold bg-indigo-100 text-indigo-700 min-w-[2.5rem]">
                      {m.total}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-700 font-medium">{m.sed}</td>
                  <td className="px-6 py-4 text-center">
                     {m.phase3 > 0 ? (
                       <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 min-w-[2rem]">
                         {m.phase3}
                       </span>
                     ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4 text-center text-amber-700 font-medium">
                    {(m.phase1 > 0 || m.phase2 > 0) ? `${m.phase1 + m.phase2}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-indigo-700 font-medium">{m.peima || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/markaz/${encodeURIComponent(m.name)}`}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
