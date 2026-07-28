import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import aeosData from "@/data/aeos.json";
import AeoClient from "@/components/AeoClient";

export const revalidate = 0;

export default async function AeoDirectoryPage() {
  const { data: schoolsData, error } = await supabase.from('schools').select('*');
  const schools = (schoolsData || []) as any[];
  const safeSchools = schools.filter(s => s.emis_code && s.markaz);
  const targetMarkazs = Array.from(new Set(safeSchools.map(s => s.markaz).filter(Boolean))).sort() as string[];

  const markazMap: Record<string, { total: number, phase1: number, phase2: number, phase3: number, sed: number, peima: number }> = {};
  targetMarkazs.forEach(m => { 
    markazMap[m] = { total: 0, phase1: 0, phase2: 0, phase3: 0, sed: 0, peima: 0 }; 
  });

  safeSchools.forEach(s => {
    const m = s.markaz || '';
    if (targetMarkazs.includes(m)) {
      if (s.school_type !== 'PRIVATE') markazMap[m].total += 1;
      if (s.school_type === 'PSRP' && s.psrp_phase === 'Phase 1') markazMap[m].phase1 += 1;
      if (s.school_type === 'PSRP' && s.psrp_phase === 'Phase 2') markazMap[m].phase2 += 1;
      if (s.psrp_phase === 'Phase 3') markazMap[m].phase3 += 1;
      if (s.school_type === 'SED') markazMap[m].sed += 1;
      if (s.school_type === 'PEIMA') markazMap[m].peima += 1;
    }
  });

  const markazStats = targetMarkazs.map(m => ({
    name: m,
    ...markazMap[m]
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen pb-12">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Assistant Education Officers</h1>
        </div>
        <p className="text-slate-500 text-sm mb-6">Complete directory of all {aeosData.length} AEOs in Shujabad.</p>

        <AeoClient aeosData={aeosData} markazStats={markazStats} />
      </div>
    </div>
  );
}
