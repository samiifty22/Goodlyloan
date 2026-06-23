"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDonorRepaymentHistory } from "@/lib/actions/donor-repayment";
import { Printer, TrendingUp, Loader2, ExternalLink } from "lucide-react";

interface RepaymentEntry {
  id: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  repaymentDate: string;
  campaign: { id: string; title: string; slug: string } | null;
  receipt: { id: string; receiptNumber: string } | null;
}

export default function DonorRepaymentHistory({ donorId }: { donorId: string }) {
  const [history, setHistory] = useState<RepaymentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDonorRepaymentHistory(donorId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [donorId]);

  const totalReceived = history.reduce((sum, r) => sum + r.amount, 0);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading disbursement history...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-bold text-slate-900">Disbursement History</h3>
          <span className="text-xs text-slate-400 font-medium">
            — amounts repaid back to you
          </span>
        </div>
        {history.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-right shrink-0">
            <p className="text-[10px] text-green-600 font-bold uppercase">Total Received</p>
            <p className="text-lg font-black text-green-700">
              ৳{totalReceived.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 ? (
        <div className="py-14 text-center space-y-2">
          <TrendingUp className="h-10 w-10 text-slate-100 mx-auto" />
          <p className="text-sm font-semibold text-slate-400">No disbursements yet</p>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            When a borrower repays their loan, your proportional share will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-5 py-3 text-right font-bold text-slate-500 uppercase tracking-wider">
                  Amount Received
                </th>
                <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 text-center font-bold text-slate-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {history.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-800 max-w-[220px]">
                    {r.campaign ? (
                      <Link
                        href={`/campaigns/${r.campaign.slug}`}
                        className="hover:text-green-600 flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{r.campaign.title}</span>
                        <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic">Archived Campaign</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-green-600 whitespace-nowrap">
                    ৳{r.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">
                    {r.notes
                      ? r.notes.replace(" (auto-split)", "").replace("Auto-split", "Campaign repayment")
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                    {new Date(r.repaymentDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    {r.receipt ? (
                      <Link
                        href={`/repayment-receipt/${r.receipt.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-bold border border-green-200 hover:border-green-300 rounded-lg px-2.5 py-1 bg-green-50 text-[10px] transition"
                      >
                        <Printer className="h-3 w-3" />
                        {r.receipt.receiptNumber}
                      </Link>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}