"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SyncEnrollmentButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [updatedCount, setUpdatedCount] = useState(0);
  const router = useRouter();

  const handleSync = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/sync-enrollment");
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setUpdatedCount(data.updated || 0);
        router.refresh(); // Refresh dashboard data
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 5000);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {status === "success" && (
        <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4">
          <CheckCircle2 className="w-4 h-4" />
          {updatedCount} records synced!
        </span>
      )}
      {status === "error" && (
        <span className="text-sm font-medium text-rose-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4">
          <AlertCircle className="w-4 h-4" />
          Sync failed
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? "Syncing Live Data..." : "Sync Enrollment"}
      </button>
    </div>
  );
}
