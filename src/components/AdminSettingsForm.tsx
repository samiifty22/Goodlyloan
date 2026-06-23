"use client";

import React, { useState } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { AlertCircle, CheckCircle, Save, Loader2, Landmark, Smartphone, Building } from "lucide-react";

interface Settings {
  bkashNumber?: string | null;
  nagadNumber?: string | null;
  rocketNumber?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  organizationName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

interface AdminSettingsFormProps {
  initialSettings: Settings | null;
  adminId: string;
  adminEmail: string;
}

export default function AdminSettingsForm({
  initialSettings,
  adminId,
  adminEmail,
}: AdminSettingsFormProps) {
  const [orgName, setOrgName] = useState(initialSettings?.organizationName || "Goodly Loan");
  const [contactEmail, setContactEmail] = useState(initialSettings?.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(initialSettings?.contactPhone || "");
  
  // Mobile money
  const [bkash, setBkash] = useState(initialSettings?.bkashNumber || "");
  const [nagad, setNagad] = useState(initialSettings?.nagadNumber || "");
  const [rocket, setRocket] = useState(initialSettings?.rocketNumber || "");
  
  // Bank accounts
  const [bankName, setBankName] = useState(initialSettings?.bankName || "");
  const [accName, setAccName] = useState(initialSettings?.accountName || "");
  const [accNumber, setAccNumber] = useState(initialSettings?.accountNumber || "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setError("Organization Name is required.");
      return;
    }

    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const result = await updateSettings({
        organizationName: orgName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        bkashNumber: bkash.trim() || undefined,
        nagadNumber: nagad.trim() || undefined,
        rocketNumber: rocket.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountName: accName.trim() || undefined,
        accountNumber: accNumber.trim() || undefined,
        adminId,
        adminEmail,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to update configurations");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {error && (
        <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start space-x-2 rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: General Info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Building className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-bold text-slate-800">Organization Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name</label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Section 2: Mobile Money Accounts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Smartphone className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-bold text-slate-800">Mobile Financial Services</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">bKash Number</label>
            <input
              type="text"
              value={bkash}
              onChange={(e) => setBkash(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nagad Number</label>
            <input
              type="text"
              value={nagad}
              onChange={(e) => setNagad(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rocket Number</label>
            <input
              type="text"
              value={rocket}
              onChange={(e) => setRocket(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Section 3: Bank Accounts */}
        <div className="col-span-1 md:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Landmark className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-bold text-slate-800">Bank Transfer Accounts</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Islami Bank Bangladesh PLC"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. Goodly Loan Foundation"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={accNumber}
                onChange={(e) => setAccNumber(e.target.value)}
                placeholder="e.g. 20501234..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save System Configurations</span>
        </button>
      </div>

    </form>
  );
}
