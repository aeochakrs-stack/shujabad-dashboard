'use client';

import { useState } from 'react';
import { Settings, Shield, Database, Layout, Save, Server, FileText } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  const sqlScript = `
-- Run this in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  role text not null default 'aeo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.schools (
  id uuid default gen_random_uuid() primary key,
  emis_code text unique not null,
  school_name text not null,
  markaz text,
  school_type text,
  psrp_phase text,
  is_asp boolean default false,
  enrollment_total integer default 0,
  enrollment_target integer default 0
);

CREATE TABLE IF NOT EXISTS public.sti_teachers (
  id uuid default gen_random_uuid() primary key,
  sti_name text not null,
  school_name text not null,
  emis_code text not null,
  markaz text not null,
  phase text not null,
  designation text not null,
  joining_date date
);
`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account, display preferences, and database.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'general' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Layout className="w-5 h-5" /> General & Display
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'security' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Shield className="w-5 h-5" /> Security
          </button>
          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'database' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Database className="w-5 h-5" /> Database Setup
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-10 bg-white">
          
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">General & Display</h2>
              
              <div className="space-y-6 max-w-lg">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800">Force Desktop View</h3>
                    <p className="text-sm text-slate-500">Always render data tables in wide format on mobile.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800">High Contrast Font</h3>
                    <p className="text-sm text-slate-500">Increase font weight for better readability.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Save className="w-5 h-5" />}
                  Save Preferences
                </button>
                {successMsg && <p className="mt-3 text-sm font-bold text-emerald-600">{successMsg}</p>}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Security</h2>
              
              <form className="space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                  <input type="password" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                  <input type="password" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input type="password" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors">
                    Update Password
                  </button>
                  {successMsg && <p className="mt-3 text-sm font-bold text-emerald-600">{successMsg}</p>}
                </div>
              </form>
            </div>
          )}

          {/* Database Setup */}
          {activeTab === 'database' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                <Server className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Database Setup Portal</h2>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">
                <strong className="block mb-1 font-bold text-amber-900">Is your dashboard empty?</strong>
                If your Supabase database is missing tables, the dashboard will show 0 data or loading errors. Run the SQL script below in your Supabase SQL Editor to create all necessary tables instantly.
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="block text-sm font-bold text-slate-700">1. SQL Table Schema</label>
                  <button 
                    onClick={() => navigator.clipboard.writeText(sqlScript)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg"
                  >
                    <FileText className="w-3 h-3" /> Copy Script
                  </button>
                </div>
                <textarea 
                  readOnly 
                  value={sqlScript.trim()}
                  className="w-full h-48 p-4 bg-slate-900 text-slate-300 font-mono text-xs rounded-xl overflow-y-auto"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-2">2. Seed Database</label>
                <p className="text-sm text-slate-500 mb-4">After running the SQL script above, click this button to populate the tables with sample data (Schools, AEO accounts, and STI data).</p>
                <button 
                  onClick={() => alert("Sample data seeded! (Note: Connect your real Supabase keys to perform actual seeding)")}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-emerald-200"
                >
                  <Database className="w-5 h-5" /> Seed Sample Data
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
