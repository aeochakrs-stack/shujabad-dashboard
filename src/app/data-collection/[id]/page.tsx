'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Plus, Save, X, DownloadCloud, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SheetDataPage() {
  const { id } = useParams();
  const [sheet, setSheet] = useState<any>(null);
  const [dataRows, setDataRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState('unknown_aeo');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const roleMatch = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    const userMatch = document.cookie.match(new RegExp('(^| )username=([^;]+)'));
    if (userMatch) setUsername(userMatch[2]);
    
    fetchSheetData();
  }, [id]);

  const fetchSheetData = async () => {
    setLoading(true);
    
    const [sheetRes, dataRes] = await Promise.all([
        supabase.from('custom_sheets').select('*').eq('id', id).single(),
        supabase.from('custom_sheet_data').select('*').eq('sheet_id', id).order('created_at', { ascending: false })
    ]);

    if (sheetRes.data) setSheet(sheetRes.data);
    if (dataRes.data) setDataRows(dataRes.data);
    
    setLoading(false);
  };

  const handleExport = () => {
    if (!sheet || dataRows.length === 0) return;
    
    const exportPayload = dataRows.map(row => {
        const out: Record<string, any> = {
            "Submitted By": row.submitted_by_username,
            "Submission Date": new Date(row.created_at).toLocaleString()
        };
        sheet.columns.forEach((col: any) => {
            let val = row.data[col.key];
            if (col.type === 'boolean') val = val ? 'Yes' : 'No';
            out[col.label] = val;
        });
        return out;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportPayload);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${sheet.title.replace(/\s+/g, '_')}_Export.xlsx`);
  };

  const handleInputChange = (key: string, value: any) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
      // Basic validation
      const missing = sheet.columns.filter((c: any) => c.type !== 'boolean' && !formData[c.key]);
      if (missing.length > 0) {
          return alert(`Please fill out: ${missing.map((c: any) => c.label).join(', ')}`);
      }

      setIsSaving(true);
      const { error } = await supabase.from('custom_sheet_data').insert([{
          sheet_id: id,
          submitted_by_username: username,
          data: formData
      }]);

      if (error) {
          alert("Failed to submit data. " + error.message);
      } else {
          setIsAdding(false);
          setFormData({});
          fetchSheetData(); // Refresh table
      }
      setIsSaving(false);
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!sheet) {
      return (
          <div className="text-center py-20">
              <h2 className="text-xl font-bold text-slate-800">Sheet not found</h2>
              <Link href="/data-collection" className="text-indigo-600 hover:underline mt-2 inline-block">Go back</Link>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <Link href="/data-collection" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Data Collection
      </Link>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">{sheet.title}</h1>
          <p className="text-slate-500 text-sm">{sheet.description || 'No description provided.'}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
                <DownloadCloud className="w-4 h-4" /> Export Excel
            </button>
            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
                <Plus className="w-4 h-4" /> Add Data
            </button>
        </div>
      </div>

      {/* TABLE VIEWER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Submitted By</th>
                {sheet.columns.map((col: any) => (
                  <th key={col.key} className="px-6 py-4 font-semibold">{col.label}</th>
                ))}
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataRows.length === 0 ? (
                <tr>
                  <td colSpan={sheet.columns.length + 2} className="px-6 py-12 text-center text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    No data has been submitted to this sheet yet.
                  </td>
                </tr>
              ) : (
                dataRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                        {row.submitted_by_username}
                    </td>
                    {sheet.columns.map((col: any) => {
                        let val = row.data[col.key];
                        if (col.type === 'boolean') {
                            val = val ? <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">Yes</span> : <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">No</span>;
                        }
                        return (
                          <td key={col.key} className="px-6 py-4 text-slate-700">
                            {val || '-'}
                          </td>
                        );
                    })}
                    <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD DATA MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800">Add New Record</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {sheet.columns.map((col: any) => (
                  <div key={col.key}>
                      <label className="block text-sm font-bold text-slate-700 mb-1">{col.label}</label>
                      
                      {col.type === 'boolean' ? (
                          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                              <input 
                                  type="checkbox" 
                                  checked={!!formData[col.key]}
                                  onChange={(e) => handleInputChange(col.key, e.target.checked)}
                                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm font-medium text-slate-700">Yes, this is applicable</span>
                          </label>
                      ) : col.type === 'number' ? (
                          <input 
                              type="number" 
                              value={formData[col.key] || ''}
                              onChange={(e) => handleInputChange(col.key, e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                      ) : col.type === 'date' ? (
                          <input 
                              type="date" 
                              value={formData[col.key] || ''}
                              onChange={(e) => handleInputChange(col.key, e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                      ) : (
                          <input 
                              type="text" 
                              value={formData[col.key] || ''}
                              onChange={(e) => handleInputChange(col.key, e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                      )}
                  </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Submit Data</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
