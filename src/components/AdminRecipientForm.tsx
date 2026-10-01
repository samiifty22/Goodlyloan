"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createRecipient, updateRecipient } from "@/lib/actions/recipients";
import { AlertCircle, Save, ArrowLeft, Loader2 } from "lucide-react";

interface Recipient {
  id: string;
  recipientCode: string;
  fullName: string;
  fatherName: string | null;
  phoneNumber: string;
  nidNumber: string | null;
  dateOfBirth: string | null; // "YYYY-MM-DD"
  address: string;
  occupation: string | null;
  monthlyIncome: number | null;
  familyMembers: number | null;
  guarantorName: string | null;
  guarantorPhone: string | null;
  notes: string | null;
  status: string;
}

interface AdminRecipientFormProps {
  initialRecipient?: Recipient | null;
}

const inputClass =
  "w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500";
const labelClass = "block text-xs font-bold text-slate-700 mb-1";

export default function AdminRecipientForm({ initialRecipient }: AdminRecipientFormProps) {
  const router = useRouter();
  const isEdit = !!initialRecipient;

  const [fullName, setFullName] = useState(initialRecipient?.fullName || "");
  const [fatherName, setFatherName] = useState(initialRecipient?.fatherName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialRecipient?.phoneNumber || "");
  const [nidNumber, setNidNumber] = useState(initialRecipient?.nidNumber || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialRecipient?.dateOfBirth || "");
  const [address, setAddress] = useState(initialRecipient?.address || "");
  const [occupation, setOccupation] = useState(initialRecipient?.occupation || "");
  const [monthlyIncome, setMonthlyIncome] = useState(initialRecipient?.monthlyIncome?.toString() || "");
  const [familyMembers, setFamilyMembers] = useState(initialRecipient?.familyMembers?.toString() || "");
  const [guarantorName, setGuarantorName] = useState(initialRecipient?.guarantorName || "");
  const [guarantorPhone, setGuarantorPhone] = useState(initialRecipient?.guarantorPhone || "");
  const [notes, setNotes] = useState(initialRecipient?.notes || "");
  const [status, setStatus] = useState(initialRecipient?.status || "ACTIVE");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const backHref = isEdit ? `/admin/recipients/${initialRecipient!.id}` : "/admin/recipients";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phoneNumber.trim() || !address.trim()) {
      setError("Please fill in the name, phone number and address.");
      return;
    }

    setSaving(true);

    const payload = {
      fullName,
      fatherName,
      phoneNumber,
      nidNumber,
      dateOfBirth: dateOfBirth || undefined,
      address,
      occupation,
      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
      familyMembers: familyMembers ? Number(familyMembers) : undefined,
      guarantorName,
      guarantorPhone,
      notes,
      status,
    };

    try {
      const result = isEdit
        ? await updateRecipient(initialRecipient!.id, payload)
        : await createRecipient(payload);

      if (!result.success) throw new Error(result.error);

      router.push(`/admin/recipients/${result.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save recipient.");
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

      {/* Personal details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Personal Information
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            {isEdit
              ? `Recipient ID: ${initialRecipient!.recipientCode}`
              : "A recipient ID (e.g. GL-0001) is generated automatically when you save."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Abdur Rahim" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Father&apos;s / Husband&apos;s Name</label>
            <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 017XXXXXXXX" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>NID Card Number</label>
            <input type="text" value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} placeholder="e.g. 1990269..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Occupation</label>
            <input type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Small Retail Shopkeeper" className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Residential Address</label>
            <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full physical address..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Monthly Income (৳)</label>
            <input type="number" min="0" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="e.g. 12000" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Family Members</label>
            <input type="number" min="0" step="1" value={familyMembers} onChange={(e) => setFamilyMembers(e.target.value)} placeholder="e.g. 5" className={inputClass} />
          </div>

        </div>
      </div>

      {/* Guarantor and notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Guarantor &amp; Internal Notes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Guarantor Name</label>
            <input type="text" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Guarantor Phone</label>
            <input type="text" value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} className={inputClass} />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Internal Admin Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Confidential notes: reference checks, meeting impressions, local verification verdicts..."
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
          <span>{isEdit ? "Update Recipient" : "Create Recipient"}</span>
        </button>
      </div>

    </form>
  );
}
