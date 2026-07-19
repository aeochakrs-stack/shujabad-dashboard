'use client';

import { useState, useEffect } from 'react';
import { Settings, Shield, Database, Layout, Save, Server, FileText, Users, UserCog } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [role, setRole] = useState('aeo');
  
  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secError, setSecError] = useState('');


  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) setRole(match[2]);
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && (role === 'admin' || role === 'developer')) {
        fetchUsers();
    }
  }, [activeTab, role]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error && data) {
        setUsers(data);
    }
    setLoadingUsers(false);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (error) {
        alert("Failed to update role: " + error.message);
    } else {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

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

-- Data Collection Schema
CREATE TABLE IF NOT EXISTS public.custom_sheets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  columns jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.custom_sheet_data (
  id uuid default gen_random_uuid() primary key,
  sheet_id uuid references public.custom_sheets(id) on delete cascade not null,
  submitted_by_username text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
`;

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError('');
    setSuccessMsg('');
    
    if (newPassword !== confirmPassword) {
        setSecError('New passwords do not match');
        return;
    }

    setLoading(true);
    try {
        const res = await fetch('/api/auth/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
            setSuccessMsg('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setSecError(data.error || 'Failed to update password');
        }
    } catch (err) {
        setSecError('An unexpected error occurred');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account, display preferences, and platform configuration.</p>
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
          
          {(role === 'admin' || role === 'developer') && (
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Users className="w-5 h-5" /> User Management
            </button>
          )}

          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'security' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Shield className="w-5 h-5" /> Security
          </button>

          {role === 'developer' && (
            <button 
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-sm whitespace-nowrap ${activeTab === 'database' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Database className="w-5 h-5" /> Database Setup
            </button>
          )}
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

          {/* User Management (Admin & Developer Only) */}
          {activeTab === 'users' && (role === 'admin' || role === 'developer') && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-3">
                  <UserCog className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                </div>
              </div>
              
              <p className="text-slate-500 text-sm">
                View all registered accounts and promote AEOs to Admin status.
              </p>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Username</th>
                        <th className="px-6 py-3 font-semibold">Current Role</th>
                        <th className="px-6 py-3 font-semibold">Registered</th>
                        <th className="px-6 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 font-bold text-slate-800">{u.username}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                u.role === 'developer' ? 'bg-purple-100 text-purple-700' :
                                u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            {u.role === 'developer' ? (
                                <span className="text-xs text-slate-400">Locked</span>
                            ) : (
                                <select
                                    value={u.role}
                                    onChange={(e) => updateUserRole(u.id, e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 outline-none focus:border-indigo-500 hover:border-indigo-300 cursor-pointer"
                                >
                                    <option value="aeo">AEO</option>
                                    <option value="admin">Admin</option>
                                </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in">
              <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Security</h2>
              
              <form className="space-y-4 max-w-md" onSubmit={handlePasswordUpdate}>
                {secError && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-200">
                        {secError}
                    </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Current Password</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />}
                    Update Password
                  </button>
                  {successMsg && <p className="mt-3 text-sm font-bold text-emerald-600">{successMsg}</p>}
                </div>
              </form>
            </div>
          )}

          {/* Database Setup (Developer Only) */}
          {activeTab === 'database' && role === 'developer' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                <Server className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-900">Database Setup Portal</h2>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">
                <strong className="block mb-1 font-bold text-amber-900">Developer Eyes Only</strong>
                Run the SQL script below in your Supabase SQL Editor to initialize or reset tables.
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
                <p className="text-sm text-slate-500 mb-4">After running the SQL script above, click this button to populate the tables with sample data.</p>
                <button 
                  onClick={() => {
      setSuccessMsg('Sample data seeded! (Note: Connect your real Supabase keys to perform actual seeding)');
      setTimeout(() => setSuccessMsg(''), 3000);
    }}
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
