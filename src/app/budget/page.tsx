'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UploadCloud, FileSpreadsheet, Calculator, Save, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BudgetPage() {
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBudget();
  }, []);

  async function fetchBudget() {
    setLoading(true);
    const { data, error } = await supabase.from('account_office_budget').select('*').order('created_at', { ascending: true });
    if (!error && data) {
      setBudgetData(data);
    }
    setLoading(false);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Skip first 5 lines (header) and read as JSON
        const data = XLSX.utils.sheet_to_json(ws, { range: 5, header: 1 }) as any[][];
        
        // Ensure there is data
        if (data.length === 0) {
          alert('No data found in file.');
          setUploading(false);
          return;
        }

        // Find header row (usually the first row after the 5 skipped rows, or within)
        // Since we range: 5, data[0] should be the headers if exactly 5 lines are metadata
        // Let's assume data[0] is header, data[1...] are rows
        const headers = data[0].map(String).map(h => h.toLowerCase().trim());
        
        const colIdx = {
            code: headers.findIndex(h => h.includes('account_office_code') || h.includes('code')),
            desig: headers.findIndex(h => h.includes('designation') || h.includes('name of post')),
            bps: headers.findIndex(h => h.includes('scale/bs') || h.includes('bps') || h.includes('scale')),
            s24: headers.findIndex(h => h.includes('sanctioned') && h.includes('24-25')),
            s25: headers.findIndex(h => h.includes('sanctioned') && h.includes('25-26')),
            b24: headers.findIndex(h => h.includes('budget') && h.includes('24-25') && !h.includes('proposed')),
            b25: headers.findIndex(h => h.includes('budget') && h.includes('25-26') && !h.includes('proposed')),
            prop25: headers.findIndex(h => h.includes('proposed') && h.includes('25-26')),
        };

        const recordsToInsert = [];
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0 || !row[colIdx.code]) continue; // Skip empty rows

            recordsToInsert.push({
                account_office_code: String(row[colIdx.code] || ''),
                designation: String(row[colIdx.desig] || ''),
                bps: String(row[colIdx.bps] || ''),
                sanctioned_24_25: Number(row[colIdx.s24]) || 0,
                sanctioned_25_26: Number(row[colIdx.s25]) || 0,
                abolished_seats: 0,
                budget_24_25: Number(row[colIdx.b24]) || 0,
                budget_25_26: Number(row[colIdx.b25]) || 0,
                proposed_estimate_25_26: Number(row[colIdx.prop25]) || 0
            });
        }

        // Wipe old data and insert new
        if (recordsToInsert.length > 0) {
            await supabase.from('account_office_budget').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
            await supabase.from('account_office_budget').insert(recordsToInsert);
            await fetchBudget();
            alert(`Successfully imported ${recordsToInsert.length} budget rows!`);
        } else {
            alert('Could not parse rows. Please check file format.');
        }

      } catch (err) {
        console.error(err);
        alert('Error parsing Excel file.');
      }
      setUploading(false);
      if (e.target) e.target.value = ''; // Reset file input
    };
    reader.readAsBinaryString(file);
  };

  const handleAbolishedChange = (id: string, val: string) => {
      const num = parseInt(val) || 0;
      setBudgetData(prev => prev.map(row => 
          row.id === id ? { ...row, abolished_seats: num } : row
      ));
  };

  const saveAbolishedSeats = async () => {
      setSaving(true);
      for (const row of budgetData) {
          await supabase.from('account_office_budget').update({ abolished_seats: row.abolished_seats }).eq('id', row.id);
      }
      setSaving(false);
      alert('Budget updated successfully!');
  };

  const revisedBudgetsMap = useMemo(() => {
    if (budgetData.length === 0) return {};
    const rb: Record<string, number> = {};

    // 1. Calculate leaves
    budgetData.forEach(row => {
      const revisedSanctioned = Math.max(0, (row.sanctioned_25_26 || 0) - (row.abolished_seats || 0));
      let val = row.proposed_estimate_25_26;
      if (row.sanctioned_25_26 > 0 && revisedSanctioned < row.sanctioned_25_26) {
          val = Math.round((row.proposed_estimate_25_26 / row.sanctioned_25_26) * revisedSanctioned);
      }
      rb[row.id] = val;
    });

    const getIndex = (desig: string) => budgetData.findIndex(r => r.designation === desig);
    const sumByIndex = (startIdx: number, endIdx: number) => {
        if (startIdx < 0 || endIdx < 0 || startIdx > endIdx) return 0;
        let sum = 0;
        for(let i = startIdx; i <= endIdx; i++) sum += rb[budgetData[i].id];
        return sum;
    };

    const idxA01101 = getIndex("Total Basic Pay of Officers");
    const idxA011_2 = getIndex("TOTAL PAY OF OTHER STAFF");
    
    const officersSum = sumByIndex(idxA01101 + 1, idxA011_2 - 1);
    if (idxA01101 !== -1) rb[budgetData[idxA01101].id] = officersSum;
    const idxA011_1 = getIndex("TOTAL PAY OF OFFICERS");
    if (idxA011_1 !== -1) rb[budgetData[idxA011_1].id] = officersSum;

    const idxA01151 = getIndex("Total Basic Pay of Other Staff");
    const idxA012 = getIndex("TOTAL ALLOWANCES");
    const staffSum = sumByIndex(idxA01151 + 1, idxA012 - 1);
    if (idxA01151 !== -1) rb[budgetData[idxA01151].id] = staffSum;
    if (idxA011_2 !== -1) rb[budgetData[idxA011_2].id] = staffSum;

    const idxA011 = getIndex("TOTAL PAY");
    if (idxA011 !== -1) rb[budgetData[idxA011].id] = officersSum + staffSum;

    const idxHR = getIndex("House Rent Allowance");
    const idxSSB = getIndex("Other (SSB etc.)");
    const regAllowancesSum = sumByIndex(idxHR, idxSSB);
    const idxA012_1 = getIndex("TOTAL REGULAR ALLOWANCES");
    if (idxA012_1 !== -1) rb[budgetData[idxA012_1].id] = regAllowancesSum;

    const idxHonoraria = getIndex("Honoraria");
    const idxLeave = getIndex("Leave Salary");
    const otherAllowancesSum = sumByIndex(idxHonoraria, idxLeave);
    const idxA012_2 = getIndex("TOTAL OTHER ALLOWANCES(EXCLUDING TA)");
    if (idxA012_2 !== -1) rb[budgetData[idxA012_2].id] = otherAllowancesSum;

    if (idxA012 !== -1) rb[budgetData[idxA012].id] = regAllowancesSum + otherAllowancesSum;

    const idxStipend = getIndex("Stipend Incentives Awards");
    const idxOthers = getIndex("Others");
    const generalSum = sumByIndex(idxStipend, idxOthers);
    const idxA039 = getIndex("TOTAL GENERAL");
    if (idxA039 !== -1) rb[budgetData[idxA039].id] = generalSum;

    const idxA01 = getIndex("TOTAL EMPLOYEES RELATED EXPENSES");
    const sumA01 = (officersSum + staffSum) + (regAllowancesSum + otherAllowancesSum) + generalSum;
    if (idxA01 !== -1) rb[budgetData[idxA01].id] = sumA01;

    const idxPensionLeaf = getIndex("Superannuation Encashment on L.P.R");
    const pensionVal = idxPensionLeaf !== -1 ? rb[budgetData[idxPensionLeaf].id] : 0;
    const idxPension1 = getIndex("PENSION");
    const idxPension2 = getIndex("EMPLOYEES RETIREMENT BENEFITS");
    if (idxPension1 !== -1) rb[budgetData[idxPension1].id] = pensionVal;
    if (idxPension2 !== -1) rb[budgetData[idxPension2].id] = pensionVal;

    const idxGrantLeaf = getIndex("Financial Assistance");
    const grantVal = idxGrantLeaf !== -1 ? rb[budgetData[idxGrantLeaf].id] : 0;
    const idxGrant1 = getIndex("GRANTS DOMESTIC");
    const idxGrant2 = getIndex("GRANTS, SUBSIDIES & WRITEOFFS");
    if (idxGrant1 !== -1) rb[budgetData[idxGrant1].id] = grantVal;
    if (idxGrant2 !== -1) rb[budgetData[idxGrant2].id] = grantVal;

    const idxGrand = getIndex("GRAND TOTAL");
    const idxSalary = getIndex("Salary");
    const idxNonSalary = getIndex("Non-Salary");
    const idxTotal = getIndex("Total");

    if (idxSalary !== -1) rb[budgetData[idxSalary].id] = sumA01;
    if (idxNonSalary !== -1) rb[budgetData[idxNonSalary].id] = pensionVal + grantVal;
    if (idxGrand !== -1) rb[budgetData[idxGrand].id] = sumA01 + pensionVal + grantVal;
    if (idxTotal !== -1) rb[budgetData[idxTotal].id] = sumA01 + pensionVal + grantVal;

    return rb;
  }, [budgetData]);

  const exportRevisedBudget = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Revised Budget');

    // Headers
    worksheet.columns = [
        { header: 'Object Code', key: 'obj', width: 12 },
        { header: 'Designation', key: 'desig', width: 45 },
        { header: 'Scale/BS', key: 'bps', width: 10 },
        { header: 'Sanctioned (24-25)', key: 's24', width: 18 },
        { header: 'Sanctioned (25-26)', key: 's25', width: 18 },
        { header: 'Annual Budget (24-25)', key: 'b24', width: 22 },
        { header: 'Revised Budget (24-25)', key: 'rev24', width: 22 },
        { header: 'Original Estimate (25-26)', key: 'prop25', width: 25 },
        { header: 'Abolished Seats', key: 'abol', width: 18 },
        { header: 'Revised Sanctioned', key: 'revs', width: 20 },
        { header: 'Revised Estimate', key: 'revb', width: 25 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    budgetData.forEach((row) => {
        const revisedSanctioned = Math.max(0, (row.sanctioned_25_26 || 0) - (row.abolished_seats || 0));
        const revisedBudget = revisedBudgetsMap[row.id] || 0;

        // Determine if row should be bold
        const isBoldTotal = ["A01", "A011", "A012", "A039", "A04", "A05", "A012-2"].includes(row.object_code) || 
                            ["GRAND TOTAL", "Total"].includes(row.designation);

        // Add blank row if it's a major section start to recreate PDF gaps
        const addBlankBefore = ["A012", "A012-2", "A039", "A04", "A05"].includes(row.object_code) || row.designation === "GRAND TOTAL";
        if (addBlankBefore) {
            worksheet.addRow({});
        }

        const excelRow = worksheet.addRow({
            obj: row.object_code || "",
            desig: row.designation || "",
            bps: row.bps || "", // Leaves cell completely empty if no BPS
            s24: row.sanctioned_24_25 || "",
            s25: row.sanctioned_25_26 || "",
            b24: row.budget_24_25 || "",
            rev24: row.revised_budget_24_25 || "",
            prop25: row.proposed_estimate_25_26 || "",
            abol: row.abolished_seats || "",
            revs: row.sanctioned_25_26 > 0 ? revisedSanctioned : "",
            revb: revisedBudget || ""
        });

        // Apply bold styling
        if (isBoldTotal) {
            excelRow.font = { bold: true };
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Revised_Budget_25_26.xlsx');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Calculator className="w-8 h-8 text-indigo-600" />
            Budget Management
          </h1>
          <p className="text-slate-500 mt-2">Import budget WPS, abolish seats, and automatically generate revised estimates.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <label className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 border border-indigo-200 shadow-sm">
              <UploadCloud className="w-5 h-5" />
              {uploading ? 'Processing...' : 'Upload WPS Excel'}
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
            <button 
              onClick={exportRevisedBudget}
              className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
                <Download className="w-5 h-5" /> Export Revised Budget
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Overall Budget & Seat Allocation</h3>
              <button 
                  onClick={saveAbolishedSeats}
                  disabled={saving}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm"
              >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Abolished Seats'}
              </button>
          </div>

          <div className="overflow-x-auto max-h-[70vh]">
              {loading ? (
                  <div className="p-10 text-center text-slate-500">Loading Budget Data...</div>
              ) : budgetData.length === 0 ? (
                  <div className="p-20 text-center text-slate-500 flex flex-col items-center">
                      <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="font-medium text-lg">No Budget Data Found</p>
                      <p className="text-sm">Click "Upload WPS Excel" at the top to import your sheet.</p>
                  </div>
              ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white border-b border-slate-200 text-slate-600 sticky top-0 z-10 shadow-sm">
                          <tr>
                              <th className="px-4 py-3 font-semibold">Obj Code</th>
                              <th className="px-4 py-3 font-semibold">Designation</th>
                              <th className="px-4 py-3 font-semibold text-center">BS</th>
                              <th className="px-4 py-3 font-semibold text-center bg-slate-50">Sanctioned<br/><span className="text-[10px]">24-25</span></th>
                              <th className="px-4 py-3 font-semibold text-center bg-slate-50">Sanctioned<br/><span className="text-[10px]">25-26</span></th>
                              <th className="px-4 py-3 font-semibold text-right bg-slate-50">Annual Budget<br/><span className="text-[10px]">24-25</span></th>
                              <th className="px-4 py-3 font-semibold text-right bg-slate-50">Revised Budget<br/><span className="text-[10px]">24-25</span></th>
                              <th className="px-4 py-3 font-semibold text-right bg-slate-50">Original Estimate<br/><span className="text-[10px]">25-26</span></th>
                              <th className="px-4 py-3 font-bold text-center bg-rose-50 text-rose-700">Abolished<br/><span className="text-[10px]">Seats</span></th>
                              <th className="px-4 py-3 font-bold text-center bg-emerald-50 text-emerald-700">Revised<br/><span className="text-[10px]">Sanctioned</span></th>
                              <th className="px-4 py-3 font-bold text-right bg-indigo-50 text-indigo-700">Revised Estimate<br/><span className="text-[10px]">26-27</span></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {budgetData.map((row) => {
                              const revisedSanctioned = Math.max(0, (row.sanctioned_25_26 || 0) - (row.abolished_seats || 0));
                              const revisedBudget = revisedBudgetsMap[row.id] || 0;

                              const isBoldTotal = ["A01", "A011", "A012", "A039", "A04", "A05", "A012-2"].includes(row.object_code) || 
                                                  ["GRAND TOTAL", "Total"].includes(row.designation);

                              return (
                                  <tr key={row.id} className={`hover:bg-slate-50 ${isBoldTotal ? 'bg-indigo-50/20 font-semibold' : ''}`}>
                                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.object_code}</td>
                                      <td className={`px-4 py-3 text-slate-800 ${isBoldTotal ? 'font-black uppercase' : 'font-medium'}`}>{row.designation}</td>
                                      <td className="px-4 py-3 text-center">{row.bps && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{row.bps}</span>}</td>
                                      <td className="px-4 py-3 text-center text-slate-700 bg-slate-50/50">{row.sanctioned_24_25 || '-'}</td>
                                      <td className="px-4 py-3 text-center text-slate-700 bg-slate-50/50">{row.sanctioned_25_26 || '-'}</td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-500 bg-slate-50/50">
                                          {row.budget_24_25 > 0 ? `Rs. ${Number(row.budget_24_25).toLocaleString()}` : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-500 bg-slate-50/50">
                                          {row.revised_budget_24_25 > 0 ? `Rs. ${Number(row.revised_budget_24_25).toLocaleString()}` : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-600 bg-slate-50/50">
                                          {row.proposed_estimate_25_26 > 0 ? `Rs. ${Number(row.proposed_estimate_25_26).toLocaleString()}` : '-'}
                                      </td>
                                      <td className="px-4 py-2 text-center bg-rose-50/30">
                                          {row.sanctioned_25_26 > 0 ? (
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-20 px-2 py-1 text-center border border-rose-200 rounded-md bg-white text-rose-700 font-bold focus:ring-rose-500 focus:border-rose-500"
                                                value={row.abolished_seats || ''}
                                                onChange={(e) => handleAbolishedChange(row.id, e.target.value)}
                                                placeholder="0"
                                            />
                                          ) : <span className="text-slate-300">-</span>}
                                      </td>
                                      <td className="px-4 py-3 text-center font-black text-emerald-600 bg-emerald-50/30">
                                          {row.sanctioned_25_26 > 0 ? revisedSanctioned : '-'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-black text-indigo-700 bg-indigo-50/30">
                                          {revisedBudget > 0 ? `Rs. ${revisedBudget.toLocaleString()}` : '-'}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              )}
          </div>
      </div>
    </div>
  );
}
