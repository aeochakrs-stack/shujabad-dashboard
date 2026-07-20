"use client";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { School } from 'lucide-react';
import Link from 'next/link';

export default function MapWrapper({ schools }: { schools: any[] }) {
  // Center roughly on Shujabad
  const defaultCenter: [number, number] = [29.8735, 71.2828];

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer center={defaultCenter} zoom={11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {schools.map((school) => {
          if (!school.latitude || !school.longitude) return null;
          
          return (
            <Marker key={school.emis_code} position={[school.latitude, school.longitude]}>
              <Popup className="rounded-xl">
                <div className="font-sans min-w-[200px]">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-1">
                    <School className="w-4 h-4 text-indigo-600" />
                    {school.school_name}
                  </h3>
                  <div className="text-sm text-slate-500 mb-3 space-y-1">
                    <p><strong>EMIS:</strong> {school.emis_code}</p>
                    <p><strong>Markaz:</strong> {school.markaz}</p>
                    <p><strong>Type:</strong> {school.school_type}</p>
                    <p><strong>Level:</strong> {school.level}</p>
                  </div>
                  <Link 
                    href={`/enrollment/school/${school.emis_code}`}
                    className="block w-full text-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium py-1.5 rounded-lg transition-colors text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
