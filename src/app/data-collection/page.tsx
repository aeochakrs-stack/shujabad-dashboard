'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Plus, ClipboardList, Settings, X, Save, Trash2, Calendar } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DataCollectionPage() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('aeo');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [columns, setColumns] = useState<{key: string, label: string, type: string}[]>([
    { key: 'emis_code', label: 'School EMIS Code', type: 'text' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) setRole(match[2]);
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('custom_sheets').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setSheets(data);
    }
    setLoading(false);
  };

  const handleAddColumn = () => {
    setColumns([...columns, { key: `col_${Date.now()}`, label: 'New Column', type: 'text' }]);
  };

  const handleUpdateColumn = (index: number, field: string, value: string) => {
    const newCols = [...columns];
    newCols[index] = { ...newCols[index], [field]: value };
    // Auto-generate key from label if they update label
    if (field === 'label') {
        newCols[index].key = value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }
    setColumns(newCols);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleCreateSheet = async () => {
    if (!newTitle.trim()) return alert("Please provide a title");
    if (columns.length === 0) return alert("You must add at least one column");
    
    setIsSaving(true);
    const { error } = await supabase.from('custom_sheets').insert([{
      title: newTitle.trim(),
      description: newDesc.trim(),
      columns: columns
    }]);
    
    if (error) {
      alert("Failed to create sheet. " + error.message);
    } else {
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      setColumns([{ key: 'emis_code', label: 'School EMIS Code', type: 'text' }]);
      fetchSheets();
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Data Collection</h1>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl">
            Custom data collection sheets. Select a sheet below to add new data or view existing records.
          </p>
        </div>
        
        {(role === 'admin' || role === 'developer') && (
          <button 
            onClick={() => setIsCreating(true)}
            className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm shadow-indigo-200"
          >
            <Plus className="w-5 h-5" />
            Create New Sheet
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : sheets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No active data sheets</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {(role === 'admin' || role === 'developer') ? 'Click the button above to create your first custom data collection sheet.' : 'There are currently no active data collection campaigns assigned by the admin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sheets.map(sheet => (
            <Link key={sheet.id} href={`/data-collection/${sheet.id}`} className="group">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(sheet.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{sheet.title}</h3>
                <p className="text-sm text-slate-500 mb-6 flex-1 line-clamp-2">
                  {sheet.description || 'No description provided.'}
                </p>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                   <span className="font-bold text-slate-400">{sheet.columns?.length || 0} Columns</span>
                   <span className="font-bold text-indigo-600 flex items-center gap-1">Open Sheet &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-500" />
                Sheet Designer
              </h3>
              <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sheet Title <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g., Dengue Spray Status - Oct 2026"
                    value={newTitle} 
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                  <textarea 
                    rows={2}
                    placeholder="Brief instructions for AEOs..."
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 outline-none resize-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                   <h4 className="font-bold text-slate-800">Define Table Columns</h4>
                   <button onClick={handleAddColumn} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                     <Plus className="w-4 h-4" /> Add Column
                   </button>
                </div>
                
                <div className="space-y-3">
                  {columns.map((col, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Column Label (Heading)</label>
                            <input 
                              type="text" 
                              value={col.label} 
                              onChange={(e) => handleUpdateColumn(idx, 'label', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                              placeholder="e.g. Number of Books"
                            />
                          </div>
                          <div className="w-1/3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Data Type</label>
                            <select 
                              value={col.type} 
                              onChange={(e) => handleUpdateColumn(idx, 'type', e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
                            >
                              <option value="text">Text / String</option>
                              <option value="number">Number</option>
                              <option value="boolean">Yes / No (Checkbox)</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveColumn(idx)}
                        disabled={columns.length === 1}
                        className="mt-6 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-6 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateSheet}
                disabled={isSaving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? "Saving..." : <><Save className="w-4 h-4" /> Create Sheet</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
