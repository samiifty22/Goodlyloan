"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AlertCircle, CheckCircle2, Database, Download, KeyRound, Loader2 } from "lucide-react";

interface AdminDataProtectionProps {
  usage: {
    usedBytes: number;
    limitBytes: number;
    percent: number;
  };
}

const inputClass =
  "w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500";
const labelClass = "block text-xs font-bold text-slate-700 mb-1";

const toMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

export default function AdminDataProtection({ usage }: AdminDataProtectionProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const barClass = usage.percent >= 90 ? "bg-rose-500" : usage.percent >= 70 ? "bg-amber-500" : "bg-green-600";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (newPassword.length < 10) {
      setError("Use at least 10 characters for the new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new password and its confirmation do not match.");
      return;
    }

    setSaving(true);

    try {
      // Also signs out every other device that was using the old password
      const response = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (response?.error) {
        throw new Error(response.error.message || "Failed to change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* Storage and backup */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Database className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Database &amp; Backup</h3>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
            <span>
              {toMb(usage.usedBytes)} MB used of {toMb(usage.limitBytes)} MB
            </span>
            <span>{usage.percent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.max(usage.percent, 1)}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            This is the allowance of the free database plan. Records are small, so it holds tens of thousands of
            donors, recipients and installments.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <a
            href="/api/admin/backup"
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs transition shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Download Full Backup</span>
          </a>
          <p className="text-[11px] text-slate-500">
            Saves every record as one file. The free database plan only keeps a few hours of history, so download a
            backup regularly (weekly, and after entering a lot of data) and keep it somewhere safe. The file contains
            personal information such as NID numbers — do not share it.
          </p>
        </div>
      </div>

      {/* Password */}
      <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <KeyRound className="h-5 w-5 text-slate-500" />
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Change Admin Password</h3>
        </div>

        {error && (
          <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div className="flex items-start space-x-2 rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Password changed. Other devices have been signed out.</span>
          </div>
        )}

        <div>
          <label className={labelClass}>Current Password</label>
          <input type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>New Password (at least 10 characters)</label>
          <input type="password" required autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Confirm New Password</label>
          <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Change Password</span>
        </button>
      </form>

    </div>
  );
}
