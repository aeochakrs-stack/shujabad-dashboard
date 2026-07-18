"use client";

import { useState } from "react";
import aeos from "@/data/aeos.json";

export default function AeoBadge({ markazName, defaultName }: { markazName: string, defaultName: string }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Map the exact dashboard Markaz name to the exact name in aeos.json to avoid typo mismatches
  const exactNameMap: Record<string, string> = {
    'CHAK R.S - FEMALE': 'FAISAL HABIB',
    'SIKANDARABAD - FEMALE': 'Muhammad Kashif Rabbani',
    'MATOTLI - FEMALE': 'Aamer saeed',
    'MARHA - FEMALE': 'Junaid Naeem',
    'BASTI MITHO - FEMALE': 'Aamir Saleem ',
    'TODAR PUR - FEMALE': 'SIDRA NOUREEN',
    'RASOOL PUR - FEMALE': 'ATIF MEHMOOD ',
    'THATH GHALWAN - FEMALE': 'Muhammad Kamran Shair',
    'GARDEZ PUR - FEMALE': 'Asif Mehmood Madni',
    'SHUJABAD - FEMALE': 'Sadaf Akram',
    'PUNJANI - FEMALE': 'Muzammil Hussaun',
    'ZAREEF SHAHEED - FEMALE': 'Naila Aslam'
  };

  const exactJsonName = exactNameMap[markazName];
  const aeoData = aeos.find(a => a.name === exactJsonName);

  const handleClick = () => {
    if (authenticated) {
      setShowModal(true);
    } else {
      const input = prompt("Admin Area: Please enter the admin password to view AEO details");
      if (input === "admin786") {
        setAuthenticated(true);
        setShowModal(true);
      } else if (input !== null) {
        alert("Incorrect password!");
      }
    }
  };

  return (
    <>
      <span 
        onClick={handleClick}
        className="font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-indigo-700 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors"
        title="Click to view AEO details (Admin only)"
      >
        {defaultName}
      </span>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">AEO Details: {markazName}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {aeoData ? (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</p>
                    <p className="text-slate-800 font-medium">{aeoData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Father's Name</p>
                    <p className="text-slate-800 font-medium">{aeoData.father_name || 'N/A'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CNIC</p>
                      <p className="text-slate-800 font-medium">{aeoData.cnic || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</p>
                      <p className="text-slate-800 font-medium">{aeoData.cell_no || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5"/> Personal No</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">{aeoData.personal_no || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Charge</p>
                      <p className="text-slate-800 font-medium">{aeoData.charge || 'Permanent'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Home Address</p>
                    <p className="text-slate-800 text-sm mt-1">{aeoData.address || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500">No detailed records found for this AEO in the database.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
