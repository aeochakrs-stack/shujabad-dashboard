"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle2, UserX } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MissingStaff {
  id: number;
  teacher_name: string;
  designation: string;
  emis_code: string;
  status: string;
}

export default function StaffReconciliationAlerts() {
  const [missingStaff, setMissingStaff] = useState<MissingStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const { data, error } = await supabase
        .from('hrmis_staff')
        .select('id, teacher_name, designation, emis_code, status')
        .eq('missing_from_sis', true)
        .eq('status', 'Active'); // Only show alerts for staff that are still marked Active

      if (error) throw error;
      setMissingStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, newStatus: string) {
    try {
      const { error } = await supabase
        .from('hrmis_staff')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Remove from list after updating
      setMissingStaff(prev => prev.filter(staff => staff.id !== id));
    } catch (error) {
      console.error('Error updating status:', error);
      alert("Failed to update status.");
    }
  }

  if (loading) return null;
  if (missingStaff.length === 0) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
        <h3 className="text-red-800 font-bold text-lg">Action Required: Staff Discrepancies Detected</h3>
      </div>
      
      <div className="p-5">
        <p className="text-red-700 text-sm mb-4">
          The nightly scan found {missingStaff.length} staff member(s) in your local database that are <strong>missing</strong> from the official online SIS portal. They may have transferred, retired, or passed away. Please update their status.
        </p>

        <div className="flex flex-col gap-3">
          {missingStaff.map(staff => (
            <div key={staff.id} className="bg-white rounded-lg p-4 shadow-sm border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">{staff.teacher_name}</div>
                  <div className="text-sm text-slate-500">{staff.designation} • EMIS: {staff.emis_code}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select 
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      if (confirm(`Are you sure you want to mark ${staff.teacher_name} as ${e.target.value}?`)) {
                        updateStatus(staff.id, e.target.value);
                      }
                      e.target.value = ""; // reset dropdown
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Update Status...</option>
                  <option value="Transferred">Mark as Transferred</option>
                  <option value="Retired">Mark as Retired</option>
                  <option value="Deceased">Mark as Deceased</option>
                  <option value="Other">Mark as Other</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
