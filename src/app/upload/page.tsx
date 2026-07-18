import { UploadCloud, FileSpreadsheet } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function UploadPage() {
  const cookieStore = cookies();
  const userRole = cookieStore.get('user_role')?.value;

  if (userRole !== 'admin') {
    redirect('/');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Import Excel Data</h1>
        <p className="text-slate-500 mt-2">Upload Markaz or School level data sheets. The system will automatically compile and update records.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <UploadCloud className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Drag and drop your Excel file here</h3>
        <p className="text-slate-500 mb-8 max-w-md">Supported formats: .xlsx, .xls, .csv. Make sure the file follows the standard SED/PEF format.</p>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl shadow-sm transition-colors flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Select Excel File
        </button>
      </div>

      {/* Upload History / Status */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Uploads</h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">File Name</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Jalalpur_Markaz_July.xlsx
                </td>
                <td className="px-6 py-4 text-slate-600">AEO Jalalpur</td>
                <td className="px-6 py-4 text-slate-600">Today, 10:45 AM</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-medium text-xs">Compiled Successfully</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  City_Boys_Attendance.xlsx
                </td>
                <td className="px-6 py-4 text-slate-600">AEO City</td>
                <td className="px-6 py-4 text-slate-600">Yesterday</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-medium text-xs">Compiled Successfully</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
