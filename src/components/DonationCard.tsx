"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDonorReturn, deleteDonation, deleteDonorReturn } from "@/lib/actions/donors";
import { formatDate, formatTaka, DONATION_TYPES, PAYMENT_METHODS } from "@/lib/schedule";
import { AlertCircle, Check, Loader2, Printer, Trash2, Undo2 } from "lucide-react";

interface DonorReturn {
  id: string;
  amount: number;
  returnedDate: string; // "YYYY-MM-DD"
  paymentMethod: string | null;
  notes: string | null;
}

interface Donation {
  id: string;
  receiptNumber: string;
  type: string;
  amount: number;
  receivedDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  returns: DonorReturn[];
}

interface DonationCardProps {
  donation: Donation;
  today: string; // "YYYY-MM-DD"
}

const typeClass: Record<string, string> = {
  QARD_HASANA: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SADAQAH: "bg-green-100 text-green-800 border-green-200",
  OPERATIONAL: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function DonationCard({ donation, today }: DonationCardProps) {
  const router = useRouter();

  const [returning, setReturning] = useState(false);
  const [returnAmount, setReturnAmount] = useState("");
  const [returnDate, setReturnDate] = useState(today);
  const [returnMethod, setReturnMethod] = useState("cash");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isQard = donation.type === "QARD_HASANA";
  const returned = donation.returns.reduce((sum, r) => sum + r.amount, 0);
  const remaining = donation.amount - returned;

  // Runs an action, then refreshes the page data or shows why it failed
  const run = async (id: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    setError("");
    setBusyId(id);
    const result = await action();
    setBusyId(null);

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      return false;
    }
    router.refresh();
    return true;
  };

  const startReturning = () => {
    setError("");
    setReturnAmount(String(remaining));
    setReturnDate(today);
    setReturning(true);
  };

  const saveReturn = async () => {
    const ok = await run("return", () =>
      createDonorReturn({
        donationId: donation.id,
        amount: Number(returnAmount),
        returnedDate: returnDate,
        paymentMethod: returnMethod,
      })
    );
    if (ok) setReturning(false);
  };

  const handleDelete = () => {
    const what = returned > 0 ? "this entry and the returns recorded against it" : "this entry";
    if (!window.confirm(`Delete ${what}? Receipt ${donation.receiptNumber} will no longer be valid. This cannot be undone.`)) return;
    run(donation.id, () => deleteDonation(donation.id));
  };

  const handleDeleteReturn = (r: DonorReturn) => {
    if (!window.confirm(`Remove the ${formatTaka(r.amount)} return dated ${formatDate(r.returnedDate)}?`)) return;
    run(r.id, () => deleteDonorReturn(r.id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${typeClass[donation.type] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
              {DONATION_TYPES[donation.type] ?? donation.type}
            </span>
            <span className="text-lg font-black text-slate-800">{formatTaka(donation.amount)}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Received {formatDate(donation.receivedDate)}
            {donation.paymentMethod && ` · ${PAYMENT_METHODS[donation.paymentMethod] ?? donation.paymentMethod}`}
            {donation.reference && ` · Ref ${donation.reference}`}
            {` · Receipt ${donation.receiptNumber}`}
          </p>
          {donation.notes && <p className="text-[11px] text-slate-400 mt-0.5">{donation.notes}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/admin/donors/receipt/${donation.id}`}
            target="_blank"
            className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Receipt</span>
          </Link>
          {isQard && remaining > 0 && !returning && (
            <button
              type="button"
              onClick={startReturning}
              className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Return to Donor</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busyId === donation.id}
            title="Delete entry"
            className="border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 p-1.5 rounded transition flex items-center justify-center cursor-pointer"
          >
            {busyId === donation.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isQard && (
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <p className="text-[11px] font-semibold text-slate-600">
            Returned {formatTaka(returned)} of {formatTaka(donation.amount)} · {formatTaka(remaining)} still held by GoodlyLoan
          </p>

          {returning && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Amount (৳)</label>
                <input
                  type="number"
                  min="1"
                  max={remaining}
                  step="any"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  className="w-28 px-2 py-1 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Date Returned</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Paid Via</label>
                <select
                  value={returnMethod}
                  onChange={(e) => setReturnMethod(e.target.value)}
                  className="px-2 py-1 text-xs font-semibold rounded border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={saveReturn}
                disabled={busyId === "return"}
                className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white px-2.5 py-1.5 rounded text-[10px] font-bold transition cursor-pointer"
              >
                {busyId === "return" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Save Return</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setReturning(false);
                }}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded text-[10px] font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {donation.returns.length > 0 && (
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2 text-left font-bold">Returned On</th>
                  <th className="px-4 py-2 text-left font-bold">Paid Via</th>
                  <th className="px-4 py-2 text-right font-bold">Amount</th>
                  <th className="px-4 py-2 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donation.returns.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-semibold text-slate-800">{formatDate(r.returnedDate)}</td>
                    <td className="px-4 py-2 text-slate-600">{r.paymentMethod ? PAYMENT_METHODS[r.paymentMethod] ?? r.paymentMethod : "—"}</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900">{formatTaka(r.amount)}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteReturn(r)}
                          disabled={busyId === r.id}
                          title="Remove return"
                          className="border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 p-1.5 rounded transition flex items-center justify-center cursor-pointer"
                        >
                          {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
