import { School, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import DynamicTable from "@/components/DynamicTable";
import SedCategoryTabs from "@/components/SedCategoryTabs";

export const revalidate = 0;

export default async function CategoryPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const categoryType = decodeURIComponent(type);
  
  if (categoryType === 'STI') {
    const { data: stis, error } = await supabase.from('sti_teachers').select('*').order('markaz', { ascending: true });
    if (error) return <div className="p-8 text-red-500">Failed to load STI data</div>;
    const safeStis = stis || [];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-cyan-100 text-cyan-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">STI Teachers</h1>
            </div>
            <p className="text-slate-500">Showing all School Teacher Interns (Phases 1 & 2).</p>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex gap-6 shrink-0">
             <div className="text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Interns</p>
               <p className="text-xl font-black text-slate-800">{safeStis.length}</p>
             </div>
          </div>
        </div>
        
        <DynamicTable 
          data={safeStis}
          columns={[
            { key: 'sti_name', label: 'Teacher Name' },
            { key: 'school_name', label: 'School' },
            { key: 'emis_code', label: 'EMIS' },
            { key: 'markaz', label: 'Markaz' },
            { key: 'phase', label: 'Phase' },
            { key: 'designation', label: 'Designation' },
            { key: 'joining_date', label: 'Joining Date' }
          ]}
          defaultVisibleColumns={['sti_name', 'school_name', 'emis_code', 'markaz', 'phase', 'joining_date']}
          exportFileName={`STI_Teachers`}
        />
      </div>
    );
  }

  let query = supabase.from('schools').select('*, sanctioned_posts(*)');
  
  if (categoryType === 'SED') query = query.eq('school_type', 'SED');
  else if (categoryType === 'PEIMA') query = query.eq('school_type', 'PEIMA');
  else if (categoryType === 'PSRP') query = query.eq('school_type', 'PSRP');
  else if (categoryType === 'Phase 3') query = query.eq('psrp_phase', 'Phase 3');
  else if (categoryType === 'ASP') query = query.eq('is_asp', true);
  else if (categoryType === 'PRIVATE') query = query.eq('school_type', 'PRIVATE');

  let { data: schoolsData, error } = await query;

  if (error) {
    console.warn("Primary category query failed, falling back to basic query.", error);
    let fallbackQuery = supabase.from('schools').select('*');
    if (categoryType === 'SED') fallbackQuery = fallbackQuery.eq('school_type', 'SED');
    else if (categoryType === 'PEIMA') fallbackQuery = fallbackQuery.eq('school_type', 'PEIMA');
    else if (categoryType === 'PSRP') fallbackQuery = fallbackQuery.eq('school_type', 'PSRP');
    else if (categoryType === 'Phase 3') fallbackQuery = fallbackQuery.eq('psrp_phase', 'Phase 3');
    else if (categoryType === 'ASP') fallbackQuery = fallbackQuery.eq('is_asp', true);
    else if (categoryType === 'PRIVATE') fallbackQuery = fallbackQuery.eq('school_type', 'PRIVATE');
    
    const fallback = await fallbackQuery;
    schoolsData = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("Error fetching category:", error);
    return <div className="p-8 text-red-500">Failed to load data</div>;
  }

  const schools = (schoolsData || []) as any[];

  // Calculate totals for dynamic table compatibility
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
    return { ...s, total_sanctioned, total_filled, total_vacant };
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <School className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {categoryType === 'ASP' ? 'ASP Schools' : categoryType === 'Phase 3' ? 'SED Phase 3' : categoryType}
            </h1>
          </div>
          <p className="text-slate-500">Showing all {categoryType} schools in the district.</p>
        </div>
        
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm flex gap-6 shrink-0">
           <div className="text-center">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
             <p className="text-xl font-black text-slate-800">{schools.length}</p>
           </div>
        </div>
      </div>

      <SedCategoryTabs schools={schoolsWithTotals} categoryType={categoryType} />
    </div>
  );
}
