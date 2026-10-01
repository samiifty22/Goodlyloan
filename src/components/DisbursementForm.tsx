"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDisbursement } from "@/lib/actions/recipients";
import { generateSchedule, formatDate, formatTaka, MAX_INSTALLMENTS, PAYMENT_METHODS } from "@/lib/schedule";
import { AlertCircle, Loader2, Plus, CalendarClock, X } from "lucide-react";

interface DisbursementFormProps {
  recipientId: string;
  today: string; // "YYYY-MM-DD"
  // Money currently available in each fund, by disbursement type
  balances: Record<string, number>;
}

const inputClass =
  "w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500";
const selectClass =
  "w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500";
const labelClass = "block text-xs font-bold text-slate-700 mb-1";

// Month after the given date, as "YYYY-MM"
function nextMonth(date: string) {
  const [year, month] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month, 1));
  return d.toISOString().slice(0, 7);
}

export default function DisbursementForm({ recipientId, today, balances }: DisbursementFormProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState("QARD_HASANA");
  const [amount, setAmount] = useState("");
  const [disbursedDate, setDisbursedDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  // Repayment schedule rule
  const [dayOfMonth, setDayOfMonth] = useState("10");
  const [firstDueMonth, setFirstDueMonth] = useState(nextMonth(today));
  const [mode, setMode] = useState<"count" | "amount">("count");
  const [installmentCount, setInstallmentCount] = useState("12");
  const [installmentAmount, setInstallmentAmount] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isQard = type === "QARD_HASANA";
  const fundName = isQard ? "Qard Hasana" : "Sadaqah";
  const available = balances[type] ?? 0;
  const exceedsFund = Number(amount) > available;

  const rule = {
    dayOfMonth: Number(dayOfMonth),
    firstDueMonth,
    installmentCount: mode === "count" ? Number(installmentCount) : undefined,
    installmentAmount: mode === "amount" ? Number(installmentAmount) : undefined,
  };

  const preview = useMemo(
    () => (isQard ? generateSchedule({ totalAmount: Number(amount), ...rule }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isQard, amount, dayOfMonth, firstDueMonth, mode, installmentCount, installmentAmount]
  );

  const reset = () => {
    setAmount("");
    setPurpose("");
    setNotes("");
    setInstallmentAmount("");
    setError("");
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!(Number(amount) > 0)) {
      setError("Enter the amount of money given.");
      return;
    }
    if (isQard && preview.length === 0) {
      setError(`Complete the repayment schedule (up to ${MAX_INSTALLMENTS} installments).`);
      return;
    }

    setSaving(true);

    try {
      const result = await createDisbursement({
        recipientId,
        type,
        amount: Number(amount),
        disbursedDate,
        paymentMethod,
        purpose,
        notes,
        ...(isQard ? rule : {}),
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
        <span>Record Money Given</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-green-200 rounded-xl p-6 shadow-xs space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Record Money Given</h3>
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

      {/* Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { value: "QARD_HASANA", title: "Qard Hasana", hint: "Interest-free loan. A repayment schedule is created." },
          { value: "SADAQAH", title: "Sadaqah", hint: "A gift. Nothing is to be repaid." },
        ].map((option) => (
          <label
            key={option.value}
            className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition ${
              type === option.value ? "border-green-500 bg-green-50/60" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="disbursementType"
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
          <label className={labelClass}>Amount Given (৳)</label>
          <input type="number" required min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 60000" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Date Given</label>
          <input type="date" required value={disbursedDate} onChange={(e) => setDisbursedDate(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Paid Via</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectClass}>
            {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>Purpose</label>
          <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Restocking grocery shop inventory" className={inputClass} />
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>Notes</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Fund check: recipients are paid out of what donors gave to the same fund */}
      <p
        className={`rounded-lg border p-3 text-xs font-medium ${
          exceedsFund ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-slate-50 border-slate-100 text-slate-600"
        }`}
      >
        {fundName} fund available: <span className="font-bold">{formatTaka(available)}</span>.
        {exceedsFund &&
          ` This amount is more than the fund holds. You can still save it, but the fund will show a negative balance until the matching donations are recorded.`}
      </p>

      {/* Repayment schedule */}
      {isQard && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <CalendarClock className="h-4 w-4 text-slate-500" />
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Repayment Schedule</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Due Day of Each Month</label>
              <input type="number" required min="1" max="31" step="1" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>First Due Month</label>
              <input type="month" required value={firstDueMonth} onChange={(e) => setFirstDueMonth(e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Repay By</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as "count" | "amount")} className={selectClass}>
                <option value="count">Number of months</option>
                <option value="amount">Fixed monthly amount</option>
              </select>
            </div>

            {mode === "count" ? (
              <div>
                <label className={labelClass}>Number of Months</label>
                <input type="number" required min="1" max={MAX_INSTALLMENTS} step="1" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} className={inputClass} />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Monthly Amount (৳)</label>
                <input type="number" required min="1" step="any" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} placeholder="e.g. 5000" className={inputClass} />
              </div>
            )}
          </div>

          {preview.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-600">
                {preview.length} installment{preview.length > 1 ? "s" : ""}, from {formatDate(preview[0].dueDate)} to{" "}
                {formatDate(preview[preview.length - 1].dueDate)}. Months shorter than day {dayOfMonth} use their last day.
              </p>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="sticky top-0">
                    <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2 text-left font-bold">#</th>
                      <th className="px-4 py-2 text-left font-bold">Due Date</th>
                      <th className="px-4 py-2 text-right font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row) => (
                      <tr key={row.installmentNumber}>
                        <td className="px-4 py-1.5 text-slate-500">{row.installmentNumber}</td>
                        <td className="px-4 py-1.5 font-semibold text-slate-800">{formatDate(row.dueDate)}</td>
                        <td className="px-4 py-1.5 text-right font-bold text-slate-900">{formatTaka(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              Enter the amount and schedule details to preview the installments.
            </p>
          )}
        </div>
      )}

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
          <span>{isQard ? "Save & Generate Schedule" : "Save Sadaqah"}</span>
        </button>
      </div>
    </form>
  );
}
