"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createDonor, updateDonor } from "@/lib/actions/donors";
import { AlertCircle, Save, ArrowLeft, Loader2 } from "lucide-react";

interface Donor {
  id: string;
  donorCode: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  country: string | null;
  organization: string | null;
  notes: string | null;
  status: string;
}

interface AdminDonorFormProps {
  initialDonor?: Donor | null;
}

const inputClass =
  "w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500";
const labelClass = "block text-xs font-bold text-slate-700 mb-1";

export default function AdminDonorForm({ initialDonor }: AdminDonorFormProps) {
  const router = useRouter();
  const isEdit = !!initialDonor;

  const [fullName, setFullName] = useState(initialDonor?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialDonor?.phoneNumber || "");
  const [email, setEmail] = useState(initialDonor?.email || "");
  const [organization, setOrganization] = useState(initialDonor?.organization || "");
  const [address, setAddress] = useState(initialDonor?.address || "");
  const [country, setCountry] = useState(initialDonor?.country || "Bangladesh");
  const [notes, setNotes] = useState(initialDonor?.notes || "");
  const [status, setStatus] = useState(initialDonor?.status || "ACTIVE");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const backHref = isEdit ? `/admin/donors/${initialDonor!.id}` : "/admin/donors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phoneNumber.trim()) {
      setError("Please fill in the name and phone number.");
      return;
    }

    setSaving(true);

    const payload = { fullName, phoneNumber, email, organization, address, country, notes, status };

    try {
      const result = isEdit ? await updateDonor(initialDonor!.id, payload) : await createDonor(payload);

      if (!result.success) throw new Error(result.error);

      router.push(`/admin/donors/${result.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save donor.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {error && (
        <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Donor Information
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {isEdit
              ? `Donor ID: ${initialDonor!.donorCode}`
              : "A donor ID (e.g. DN-0001) is generated automatically when you save."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Fatima Rahman" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 017XXXXXXXX" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Organization</label>
            <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Company, mosque or foundation, if any" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Country</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Internal Admin Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Confidential notes: how they prefer to be contacted, wishes about how their money is used..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {isEdit && (
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isEdit ? "Update Donor" : "Create Donor"}</span>
        </button>
      </div>

    </form>
  );
}
