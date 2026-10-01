"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createDonation } from "@/lib/actions/donors";
import { PAYMENT_METHODS } from "@/lib/schedule";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";

interface DonationFormProps {
  donorId: string;
  today: string; // "YYYY-MM-DD"
}

const inputClass =
  "w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500";
const selectClass =
  "w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500";
const labelClass = "block text-xs font-bold text-slate-700 mb-1";

const typeOptions = [
  { value: "QARD_HASANA", title: "Qard Hasana", hint: "Lent to the loan fund. Re-lent to recipients and can be returned to the donor." },
  { value: "SADAQAH", title: "Sadaqah", hint: "A gift for recipients. Not returned to the donor." },
  { value: "OPERATIONAL", title: "Operational Support", hint: "For running GoodlyLoan. Kept apart from money meant for recipients." },
];

export default function DonationForm({ donorId, today }: DonationFormProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState("QARD_HASANA");
  const [amount, setAmount] = useState("");
  const [receivedDate, setReceivedDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setAmount("");
    setReference("");
    setNotes("");
    setError("");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!(Number(amount) > 0)) {
      setError("Enter the amount of money received.");
      return;
    }

    setSaving(true);

    try {
      const result = await createDonation({
        donorId,
        type,
        amount: Number(amount),
        receivedDate,
        paymentMethod,
        reference,
        notes,
      });

      if (!result.success) throw new Error(result.error);

      reset();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Record Money Received</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-green-200 rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Record Money Received</h3>
        <button type="button" onClick={reset} title="Cancel" className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* What the money is for */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {typeOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition ${
              type === option.value ? "border-green-500 bg-green-50/60" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="donationType"
              value={option.value}
              checked={type === option.value}
              onChange={(e) => setType(e.target.value)}
              className="mt-0.5 accent-green-600"
            />
            <span>
              <span className="block text-xs font-bold text-slate-800">{option.title}</span>
              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Amount Received (৳)</label>
          <input type="number" required min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100000" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Date Received</label>
          <input type="date" required value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Received Via</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Transaction ID / Reference</label>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. bKash TrxID or cheque no." className={inputClass} />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={reset}
          className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Save &amp; Issue Receipt</span>
        </button>
      </div>
    </form>
  );
}
