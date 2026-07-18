'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, School, UploadCloud, FileText, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const [role, setRole] = useState('aeo');

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) setRole(match[2]);
  }, []);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/schools', label: 'School and Markaz Wise Data', icon: School },
    ...(role === 'admin' ? [{ href: '/upload', label: 'Import Excel', icon: UploadCloud }] : []),
    { href: '/reports', label: 'Generate Reports', icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    document.cookie = 'auth_session=; path=/; max-age=0';
    document.cookie = 'user_role=; path=/; max-age=0';
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col w-64 h-screen bg-white border-r border-slate-200 fixed top-0 left-0 z-10 shadow-sm">
      <div className="flex items-center justify-center h-20 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Shujabad<span className="text-indigo-600">Edu</span></span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive(href) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100 space-y-1">
        <Link href="/settings"
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${isActive('/settings') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors">
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
