import { MapPin, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

export const revalidate = 0;

// Leaflet uses window, so we must load it dynamically with SSR disabled
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), { 
    ssr: false,
    loading: () => (
        <div className="h-[600px] w-full rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 animate-pulse">
                <MapPin className="w-8 h-8 text-slate-300" />
                <p className="text-slate-400 font-medium">Loading Map Data...</p>
            </div>
        </div>
    )
});

export default async function LocationDashboard() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  const mappedCount = schools?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <MapPin className="w-8 h-8 text-indigo-600" />
          Location Dashboard
        </h1>
        <p className="text-slate-500 mt-2">Geographic overview of all public schools across Shujabad.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Mapped Schools</p>
            <p className="text-3xl font-black text-slate-900">{mappedCount}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm sm:col-span-2 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
                <h3 className="text-emerald-900 font-bold mb-1">Live Coordinate Sync Active</h3>
                <p className="text-emerald-700 text-sm">School GPS locations are synced nightly directly from the SIS Sanctioned Posts dashboard. Click any pin to view live class-wise enrollment.</p>
            </div>
        </div>
      </div>

      <MapWrapper schools={schools || []} />
    </div>
  );
}
