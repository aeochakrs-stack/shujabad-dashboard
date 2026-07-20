"use client";

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MapWrapper = dynamic(() => import('./MapWrapper'), { 
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

export default function DynamicMap({ schools }: { schools: any[] }) {
    return <MapWrapper schools={schools} />;
}
