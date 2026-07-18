'use client';

import { useState } from 'react';
import { Users, MapPin, Phone, Smartphone, Calendar, Hash, CreditCard, Shield, Search } from "lucide-react";
import * as XLSX from 'xlsx';
import ExportColumnSelector, { ExportColumn } from './ExportColumnSelector';

const AEO_COLUMNS: ExportColumn[] = [
  { key: 'name', label: 'AEO Name' },
  { key: 'father_name', label: 'Father Name' },
  { key: 'markaz', label: 'Markaz' },
  { key: 'charge', label: 'Charge' },
  { key: 'cnic', label: 'CNIC' },
  { key: 'personal_no', label: 'Personal No' },
  { key: 'cell_no', label: 'Cell No' },
  { key: 'dob', label: 'DOB' },
  { key: 'doj', label: 'Joining Date' },
  { key: 'device', label: 'Device' },
  { key: 'imei', label: 'IMEI' },
  { key: 'address', label: 'Address' },
  { key: 'total_schools', label: 'Total Schools' },
  { key: 'sed_schools', label: 'SED Schools' },
  { key: 'psrp_schools', label: 'PSRP Schools' },
  { key: 'peima_schools', label: 'PEIMA Schools' }
];

export default function AeoClient({ aeosData, markazStats }: { aeosData: any[], markazStats: any[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAeos = aeosData.filter(aeo => {
      const q = searchQuery.toLowerCase();
      return (
          String(aeo.name || '').toLowerCase().includes(q) ||
          String(aeo.markaz || '').toLowerCase().includes(q) ||
          String(aeo.cell_no || '').toLowerCase().includes(q) ||
          String(aeo.cnic || '').toLowerCase().includes(q) ||
          String(aeo.personal_no || '').toLowerCase().includes(q) ||
          String(aeo.imei || '').toLowerCase().includes(q) ||
          String(aeo.charge || '').toLowerCase().includes(q)
      );
  });

  const handleExport = (selectedKeys: string[]) => {
      const exportPayload = filteredAeos.map(aeo => {
          const mStats = markazStats.find(m => m.name.toLowerCase().replace(/[^a-z]/g, '').includes((aeo.markaz||'').toLowerCase().replace(/[^a-z]/g, '')));
          
          const fullRow: Record<string, any> = {
              name: aeo.name,
              father_name: aeo.father_name,
              markaz: aeo.markaz,
              charge: aeo.charge,
              cnic: aeo.cnic,
              personal_no: aeo.personal_no,
              cell_no: aeo.cell_no,
              dob: aeo.dob,
              doj: aeo.doj,
              device: aeo.device,
              imei: aeo.imei,
              address: aeo.address,
              total_schools: mStats?.total || 0,
              sed_schools: mStats?.sed || 0,
              psrp_schools: (mStats?.phase1 || 0) + (mStats?.phase2 || 0),
              peima_schools: mStats?.peima || 0
          };

          const filteredRow: Record<string, any> = {};
          selectedKeys.forEach(key => {
            const colDef = AEO_COLUMNS.find(c => c.key === key);
            if (colDef) {
              filteredRow[colDef.label] = fullRow[key];
            }
          });
          return filteredRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(exportPayload);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "AEO Directory");
      XLSX.writeFile(workbook, `AEO_Directory_Export.xlsx`);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <p className="text-slate-500 text-sm">Showing {filteredAeos.length} AEOs in Shujabad.</p>
        <ExportColumnSelector columns={AEO_COLUMNS} onExport={handleExport} />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
          placeholder="Search AEOs by name, markaz, cell no, personal no, CNIC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAeos.map((aeo: any, idx: number) => {
          const mStats = markazStats.find(m => m.name.toLowerCase().replace(/[^a-z]/g, '').includes((aeo.markaz||'').toLowerCase().replace(/[^a-z]/g, '')));
          
          return (
            <div key={idx} className="flex flex-col p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all bg-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">{aeo.name}</h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">D/O {aeo.father_name}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  {aeo.charge}
                </span>
              </div>
              
              <div className="space-y-3 mt-2 relative z-10 flex-grow">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="font-bold text-slate-700 truncate" title={aeo.markaz}>{aeo.markaz}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="font-mono font-semibold text-slate-600 text-xs">{aeo.cell_no}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="font-mono font-semibold text-slate-600 text-xs">{aeo.cnic}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="font-mono font-semibold text-slate-600 text-xs">{aeo.personal_no}</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> DOB</span>
                    <span className="font-bold text-slate-700">{aeo.dob}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined</span>
                    <span className="font-bold text-slate-700">{aeo.doj}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-500 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Device</span>
                    <span className="font-bold text-slate-700 truncate max-w-[120px]" title={aeo.device}>{aeo.device}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> IMEI</span>
                    <span className="font-mono font-bold text-slate-700">{aeo.imei}</span>
                  </div>
                </div>
              </div>

              {mStats && (
                <div className="mt-6 grid grid-cols-4 gap-2 border-t border-slate-100 pt-4 relative z-10">
                  <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-200">
                    <div className="text-lg font-black text-slate-700">{mStats.total}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Total</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                    <div className="text-lg font-black text-emerald-700">{mStats.sed}</div>
                    <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">SED</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
                    <div className="text-lg font-black text-amber-700">{(mStats.phase1 || 0) + (mStats.phase2 || 0)}</div>
                    <div className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">PSRP</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-2 text-center border border-indigo-100">
                    <div className="text-lg font-black text-indigo-700">{mStats.peima || 0}</div>
                    <div className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">PEIMA</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
