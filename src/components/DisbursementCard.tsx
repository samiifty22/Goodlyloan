"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDisbursement, recordInstallmentPayment } from "@/lib/actions/recipients";
import {
  formatDate,
  formatTaka,
  installmentStatus,
  DISBURSEMENT_TYPES,
  PAYMENT_METHODS,
  type InstallmentStatus,
} from "@/lib/schedule";
import { AlertCircle, CalendarPlus, Check, FileSpreadsheet, Loader2, Trash2, Undo2 } from "lucide-react";

interface Installment {
  id: string;
  installmentNumber: number;
  dueDate: string; // "YYYY-MM-DD"
  amount: number;
  paidAmount: number;
  paidDate: string | null;
  notes: string | null;
}

interface Disbursement {
  id: string;
  type: string;
  amount: number;
  disbursedDate: string;
  purpose: string | null;
  paymentMethod: string | null;
  notes: string | null;
  installments: Installment[];
}

interface DisbursementCardProps {
  disbursement: Disbursement;
  today: string; // "YYYY-MM-DD"
}

const statusConfig: Record<InstallmentStatus, { label: string; class: string }> = {
  PAID: { label: "Paid ✓", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PARTIAL: { label: "Part paid", class: "bg-amber-100 text-amber-800 border-amber-200" },
  OVERDUE: { label: "Overdue", class: "bg-rose-100 text-rose-800 border-rose-200" },
  UPCOMING: { label: "Upcoming", class: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function DisbursementCard({ disbursement, today }: DisbursementCardProps) {
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(today);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isQard = disbursement.type === "QARD_HASANA";
  const repaid = disbursement.installments.reduce((sum, i) => sum + Math.min(i.paidAmount, i.amount), 0);
  const percent = disbursement.amount > 0 ? Math.min(Math.round((repaid / disbursement.amount) * 100), 100) : 0;
  const exportBase = `/api/admin/schedule/export?disbursementId=${disbursement.id}`;

  const startEditing = (inst: Installment) => {
    setError("");
    setEditingId(inst.id);
    setPayAmount(String(inst.amount));
    setPayDate(inst.paidDate || today);
  };

  const savePayment = async (inst: Installment, amount: number) => {
    setError("");
    setBusyId(inst.id);

    const result = await recordInstallmentPayment(inst.id, amount, payDate);

    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to record payment.");
      return;
    }
    setEditingId(null);
    router.refresh();
  };

  const handleDelete = async () => {
    const what = isQard ? "this Qard Hasana entry, its schedule and any recorded payments" : "this Sadaqah entry";
    if (!window.confirm(`Delete ${what}? This cannot be undone.`)) return;

    setError("");
    setBusyId(disbursement.id);

    const result = await deleteDisbursement(disbursement.id);

    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to delete entry.");
      return;
    }
    router.refresh();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                isQard ? "bg-indigo-100 text-indigo-800 border-indigo-200" : "bg-green-100 text-green-800 border-green-200"
              }`}
            >
              {DISBURSEMENT_TYPES[disbursement.type] ?? disbursement.type}
            </span>
            <span className="text-lg font-black text-slate-800">{formatTaka(disbursement.amount)}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Given {formatDate(disbursement.disbursedDate)}
            {disbursement.paymentMethod && ` · ${PAYMENT_METHODS[disbursement.paymentMethod] ?? disbursement.paymentMethod}`}
            {disbursement.purpose && ` · ${disbursement.purpose}`}
          </p>
          {disbursement.notes && <p className="text-[11px] text-slate-400 mt-0.5">{disbursement.notes}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isQard && (
            <>
              <a
                href={`${exportBase}&format=ics`}
                className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Add to Calendar</span>
              </a>
              <a
                href={`${exportBase}&format=csv`}
                className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export Excel/CSV</span>
              </a>
            </>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={busyId === disbursement.id}
            title="Delete entry"
            className="border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-500 p-1.5 rounded transition flex items-center justify-center cursor-pointer"
          >
            {busyId === disbursement.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isQard ? (
        <>
          {/* Progress */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
              <span>Repaid {formatTaka(repaid)} of {formatTaka(disbursement.amount)}</span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-green-600" style={{ width: `${percent}%` }} />
            </div>
          </div>

          {/* Schedule */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2.5 text-left font-bold">#</th>
                  <th className="px-4 py-2.5 text-left font-bold">Due Date</th>
                  <th className="px-4 py-2.5 text-right font-bold">Amount</th>
                  <th className="px-4 py-2.5 text-right font-bold">Received</th>
                  <th className="px-4 py-2.5 text-left font-bold">Received On</th>
                  <th className="px-4 py-2.5 text-center font-bold">Status</th>
                  <th className="px-4 py-2.5 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {disbursement.installments.map((inst) => {
                  const status = statusConfig[installmentStatus(inst, today)];
                  const isEditing = editingId === inst.id;
                  const isBusy = busyId === inst.id;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5 text-slate-500">{inst.installmentNumber}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{formatDate(inst.dueDate)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">{formatTaka(inst.amount)}</td>

                      {isEditing ? (
                        <>
                          <td className="px-4 py-1.5 text-right">
                            <input
                              type="number"
                              min="0"
                              max={inst.amount}
                              step="any"
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              aria-label="Amount received"
                              className="w-24 px-2 py-1 text-xs text-right rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              type="date"
                              value={payDate}
                              onChange={(e) => setPayDate(e.target.value)}
                              aria-label="Date received"
                              className="px-2 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700 whitespace-nowrap">
                            {inst.paidAmount > 0 ? formatTaka(inst.paidAmount) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{formatDate(inst.paidDate)}</td>
                        </>
                      )}

                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${status.class}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex justify-end items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => savePayment(inst, Number(payAmount))}
                                disabled={isBusy}
                                className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                <span>Save</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setError("");
                                  setEditingId(null);
                                }}
                                className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditing(inst)}
                                className="border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer whitespace-nowrap"
                              >
                                {inst.paidAmount > 0 ? "Edit" : "Record Payment"}
                              </button>
                              {inst.paidAmount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => savePayment(inst, 0)}
                                  disabled={isBusy}
                                  title="Clear payment"
                                  className="border border-slate-200 hover:bg-slate-50 text-slate-500 p-1.5 rounded transition flex items-center justify-center cursor-pointer"
                                >
                                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500">Given as Sadaqah — no repayment is expected.</p>
      )}
    </div>
  );
}
