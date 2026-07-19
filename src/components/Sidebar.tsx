'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, School, UploadCloud, FileText, Settings, LogOut, Menu, X, ClipboardList } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState('aeo');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) setRole(match[2]);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/schools', label: 'School and Markaz Wise Data', icon: School },
    { href: '/data-collection', label: 'Data Collection', icon: ClipboardList },
    ...((role === 'admin' || role === 'developer') ? [{ href: '/upload', label: 'Import Excel', icon: UploadCloud }] : []),
    { href: '/reports', label: 'Generate Reports', icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Shujabad<span className="text-indigo-600">Edu</span></span>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`flex flex-col w-64 h-screen bg-white border-r border-slate-200 fixed top-0 left-0 z-50 shadow-sm transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex items-center justify-between md:justify-center h-16 md:h-20 px-4 md:px-0 border-b border-slate-100 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">Shujabad<span className="text-indigo-600">Edu</span></span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
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
        <div className="p-4 pb-12 md:pb-4 border-t border-slate-100 space-y-1 shrink-0">
          <Link href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-colors ${isActive('/settings') ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-100 hover:text-red-700 font-bold transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}


