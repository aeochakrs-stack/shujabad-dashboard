export const dynamic = 'force-dynamic';

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, UserMinus, History } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function StaffArchivePage() {
  const { data: formerStaff, error } = await supabase
    .from('hrmis_staff')
    .select('*')
    .neq('status', 'Active')
    .order('teacher_name');

  if (error) {
    console.error('Error fetching former staff:', error);
  }

  const staffList = formerStaff || [];
  
  // Group by status
  const grouped = staffList.reduce((acc, staff) => {
    const status = staff.status || 'Other';
    if (!acc[status]) acc[status] = [];
    acc[status].push(staff);
    return acc;
  }, {} as Record<string, any[]>);

  const statuses = ['Transferred', 'Retired', 'Deceased', 'Other'];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Staff Archive
            </h1>
            <div className="text-xs text-slate-500">Former and Transferred Staff Records</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8 mt-4">
        {staffList.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <UserMinus className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No former staff records found.</p>
            <p className="text-sm">Staff marked as Transferred or Retired will appear here.</p>
          </div>
        ) : (
          statuses.map(status => {
            const items = grouped[status];
            if (!items || items.length === 0) return null;
            
            return (
              <div key={status} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h2 className="font-bold text-slate-700">{status}</h2>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {items.map((staff: any, idx: number) => (
                    <div key={staff.id || idx} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-800">{staff.teacher_name}</div>
                        <div className="text-sm text-slate-500">{staff.designation}</div>
                      </div>
                      <div className="text-sm text-slate-500 sm:text-right">
                        <div>EMIS: <span className="font-mono text-slate-700">{staff.emis_code}</span></div>
                        {staff.cnic && <div className="text-xs mt-1">CNIC: {staff.cnic}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
