"use client";

import { useState } from "react";
import Link from "next/link";
import { releaseDonorRepayment } from "@/lib/actions/donor-repayment";
import {
    Printer,
    SendHorizonal,
    CheckCircle2,
    AlertCircle,
    History,
} from "lucide-react";

interface Repayment {
    id: string;
    amount: number;
    repaymentDate: string;
    notes: string | null;
    createdAt: string;
    receipt: { id: string; receiptNumber: string } | null;
}

interface Contribution {
    id: string;
    amount: number;
    donor: { id: string; name: string; email: string };
    repayments: Repayment[];
}

interface Campaign {
    id: string;
    title: string;
}

export default function DonorReleasePanel({
    contribution,
    campaign,
    adminId,
}: {
    contribution: Contribution;
    campaign: Campaign;
    adminId: string;
}) {
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        receiptId?: string;
        receiptNumber?: string;
    } | null>(null);

    // Recalculate after each release (optimistic update)
    const [localRepayments, setLocalRepayments] = useState<Repayment[]>(
        contribution.repayments
    );

    const totalRepaid = localRepayments.reduce((s, r) => s + r.amount, 0);
    const remaining = contribution.amount - totalRepaid;
    const repaidPercent =
        contribution.amount > 0
            ? Math.min(100, Math.round((totalRepaid / contribution.amount) * 100))
            : 0;

    async function handleRelease() {
        const parsed = parseFloat(amount);
        if (!parsed || parsed <= 0) {
            setResult({ success: false, message: "Enter a valid amount greater than 0." });
            return;
        }
        if (parsed > remaining + 0.001) {
            setResult({
                success: false,
                message: `Cannot release more than remaining ৳${remaining.toLocaleString()}.`,
            });
            return;
        }

        setLoading(true);
        setResult(null);

        const res = await releaseDonorRepayment({
            contributionId: contribution.id,
            donorId: contribution.donor.id,
            campaignId: campaign.id,
            amount: parsed,
            notes,
            adminId,
        });

        setLoading(false);

        if (res.success) {
            // Optimistically add to local list
            setLocalRepayments((prev) => [
                {
                    id: res.repaymentId!,
                    amount: parsed,
                    repaymentDate: new Date().toISOString(),
                    notes: notes || null,
                    createdAt: new Date().toISOString(),
                    receipt: res.receiptId
                        ? { id: res.receiptId, receiptNumber: res.receiptNumber! }
                        : null,
                },
                ...prev,
            ]);
            setResult({
                success: true,
                message: `৳${parsed.toLocaleString()} released successfully! Receipt: ${res.receiptNumber}`,
                receiptId: res.receiptId,
                receiptNumber: res.receiptNumber,
            });
            setAmount("");
            setNotes("");
        } else {
            setResult({ success: false, message: res.error ?? "Unknown error." });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ── Left: Summary + History ── */}
            <div className="space-y-5">
                {/* Summary card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                        Contribution Summary
                    </h3>

                    <div className="space-y-3 text-sm">
                        <SummaryRow label="Total Contributed" value={`৳${contribution.amount.toLocaleString()}`} />
                        <SummaryRow label="Total Released" value={`৳${totalRepaid.toLocaleString()}`} color="text-green-600" />
                        <SummaryRow
                            label="Remaining Balance"
                            value={`৳${remaining.toLocaleString()}`}
                            color={remaining <= 0 ? "text-slate-400" : "text-rose-600"}
                            bold
                        />
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                            <span>Repayment Progress</span>
                            <span>{repaidPercent}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${repaidPercent >= 100 ? "bg-green-500" : "bg-green-400"
                                    }`}
                                style={{ width: `${repaidPercent}%` }}
                            />
                        </div>
                        {remaining <= 0 && (
                            <p className="text-[11px] text-green-600 font-bold text-center pt-1">
                                ✓ Fully repaid
                            </p>
                        )}
                    </div>
                </div>

                {/* Release history */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <History className="h-4 w-4 text-slate-500" />
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                            Release History
                        </h3>
                    </div>

                    {localRepayments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-4">
                            No payments released yet.
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {localRepayments.map((r) => (
                                <div
                                    key={r.id}
                                    className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-4 py-3"
                                >
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-bold text-slate-800">
                                            ৳{r.amount.toLocaleString()}
                                        </p>
                                        {r.notes && (
                                            <p className="text-[10px] text-slate-500 italic">{r.notes}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(r.createdAt).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    {r.receipt ? (
                                        <Link
                                            href={`/repayment-receipt/${r.receipt.id}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-bold border border-green-200 rounded-lg px-2.5 py-1.5 bg-green-50 text-[10px] transition"
                                        >
                                            <Printer className="h-3 w-3" />
                                            {r.receipt.receiptNumber}
                                        </Link>
                                    ) : (
                                        <span className="text-[10px] text-slate-300">—</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right: Release Form ── */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-2">
                    Release Payment to Donor
                </h3>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">
                        Amount (৳) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                            ৳
                        </span>
                        <input
                            type="number"
                            min="1"
                            step="any"
                            max={remaining}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Max ৳${remaining.toLocaleString()}`}
                            disabled={remaining <= 0}
                            className="w-full border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                        />
                    </div>
                    {remaining > 0 && (
                        <button
                            onClick={() => setAmount(String(remaining))}
                            className="text-[11px] text-green-600 hover:underline font-semibold mt-1"
                        >
                            Release full remaining amount (৳{remaining.toLocaleString()})
                        </button>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">
                        Internal Note (optional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Partial repayment — Month 3 installment"
                        rows={3}
                        disabled={remaining <= 0}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                </div>

                {result && (
                    <div
                        className={`flex items-start gap-2 rounded-lg p-3.5 text-xs font-medium border ${result.success
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                    >
                        {result.success ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p>{result.message}</p>
                            {result.receiptId && (
                                <Link
                                    href={`/repayment-receipt/${result.receiptId}`}
                                    target="_blank"
                                    className="underline font-bold mt-1.5 inline-block hover:text-green-800"
                                >
                                    View & Print Receipt →
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleRelease}
                    disabled={loading || remaining <= 0}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition shadow-md shadow-green-600/10"
                >
                    <SendHorizonal className="h-4 w-4" />
                    {loading
                        ? "Processing..."
                        : remaining <= 0
                            ? "Fully Repaid — No Balance Remaining"
                            : "Release Payment"}
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                    This action will notify the donor and generate a receipt automatically.
                </p>
            </div>
        </div>
    );
}

function SummaryRow({
    label,
    value,
    color = "text-slate-800",
    bold = false,
}: {
    label: string;
    value: string;
    color?: string;
    bold?: boolean;
}) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-slate-500">{label}</span>
            <span className={`font-bold ${color} ${bold ? "text-base" : ""}`}>{value}</span>
        </div>
    );
}