import { School, ArrowLeft, Building, GraduationCap, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import SyncEnrollmentButton from "@/components/SyncEnrollmentButton";

export const revalidate = 0;

export default async function EnrollmentClassPage({ params }: { params: { emis: string } }) {
  const emisCode = params.emis;
  
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('emis_code', emisCode)
    .single();

  if (error || !data) {
    return (
        <div className="p-20 text-center">
            <h1 className="text-2xl font-bold text-slate-800">School Not Found</h1>
            <Link href="/enrollment" className="text-indigo-600 mt-4 inline-block">Back to Enrollment</Link>
        </div>
    );
  }

  const sCurrent = data.enrollment_total || 0;
  const sTarget = data.enrollment_target || 0;
  const sPercent = sTarget > 0 ? Math.round((sCurrent / sTarget) * 100) : 0;

  // Standard classes to show (Katchi to 10th)
  // Higher secondary can go up to 12th if data exists, but mostly standard
  const classStats = [
      { name: 'Katchi', key: 'enr_katchi' },
      { name: 'Class 1', key: 'enr_class_1' },
      { name: 'Class 2', key: 'enr_class_2' },
      { name: 'Class 3', key: 'enr_class_3' },
      { name: 'Class 4', key: 'enr_class_4' },
      { name: 'Class 5', key: 'enr_class_5' },
      { name: 'Class 6', key: 'enr_class_6' },
      { name: 'Class 7', key: 'enr_class_7' },
      { name: 'Class 8', key: 'enr_class_8' },
      { name: 'Class 9', key: 'enr_class_9' },
      { name: 'Class 10', key: 'enr_class_10' },
  ];
  
  if (data.level === 'H Sec.') {
      classStats.push({ name: 'Class 11', key: 'enr_class_11' });
      classStats.push({ name: 'Class 12', key: 'enr_class_12' });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={`/enrollment/markaz/${encodeURIComponent(data.markaz || '')}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {data.markaz}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building className="w-8 h-8 text-indigo-600" />
            {data.school_name}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 font-medium">
             <span className="px-2 py-0.5 bg-slate-100 rounded-md">EMIS: {data.emis_code}</span>
             <span className="px-2 py-0.5 bg-slate-100 rounded-md">Level: {data.level}</span>
             <span className="px-2 py-0.5 bg-slate-100 rounded-md">Type: {data.school_type}</span>
          </div>
        </div>
        <SyncEnrollmentButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-8 border-b border-slate-100 bg-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Total School Enrollment</h2>
            <p className="text-sm text-slate-500">Current vs Assigned Target</p>
          </div>
          
          <div className="flex-1 max-w-sm w-full">
             <div className="flex justify-between items-end mb-2">
                <span className="text-3xl font-black text-slate-900">{sCurrent.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-500">/ {sTarget.toLocaleString()} Target</span>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-3 mb-1 overflow-hidden shadow-inner">
                <div 
                  className={`h-full ${sPercent >= 100 ? 'bg-emerald-500' : sPercent >= 80 ? 'bg-amber-400' : 'bg-rose-500'} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(sPercent, 100)}%` }}
                ></div>
             </div>
             <p className="text-xs font-bold text-slate-500 text-right">{sPercent}% Achieved</p>
          </div>
        </div>
        
        <div className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <Info className="w-5 h-5 shrink-0" />
                <p><strong>Note:</strong> Class-wise targets are not assigned in the database. Achievement is only calculated at the total school level.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                        <th className="px-6 py-4 font-semibold w-1/2">Class</th>
                        <th className="px-6 py-4 font-semibold text-right">Current Enrollment</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {classStats.map(c => {
                        const val = data[c.key] || 0;
                        return (
                            <tr key={c.key} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                                        <GraduationCap className="w-4 h-4" />
                                    </div>
                                    {c.name}
                                </td>
                                <td className="px-6 py-4 text-right font-black text-slate-900 text-lg">
                                    {val > 0 ? val.toLocaleString() : <span className="text-slate-300">-</span>}
                                </td>
                            </tr>
                        );
                    })}
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td className="px-6 py-4 font-black text-slate-900 text-right">TOTAL</td>
                        <td className="px-6 py-4 text-right font-black text-indigo-700 text-xl">{sCurrent.toLocaleString()}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
