"use client";

import React, { useState } from "react";
import { approveContribution, rejectContribution } from "@/lib/actions/contributions";
import { AlertCircle, CheckCircle, Eye, Loader2, X, ShieldAlert } from "lucide-react";

interface Contribution {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  donor: {
    name: string;
    email: string;
  };
  campaign: {
    title: string;
    slug: string;
  };
  paymentProof: {
    paymentMethod: string;
    transactionId: string;
    senderNumber: string;
    paymentDate: Date;
    slipUrl: string;
  } | null;
}

interface AdminContributionsListProps {
  initialPending: Contribution[];
  adminId: string;
  adminEmail: string;
}

export default function AdminContributionsList({
  initialPending,
  adminId,
  adminEmail,
}: AdminContributionsListProps) {
  const [pendingItems, setPendingItems] = useState<Contribution[]>(initialPending);
  const [actioningId, setActioningId] = useState<string | null>(null);
  
  // Rejection modal
  const [rejectingItem, setRejectingItem] = useState<Contribution | null>(null);
  const [rejectReason, setRejectReason] = useState("Transaction Not Found");
  const [customReason, setCustomReason] = useState("");

  // Preview slip modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Status logs
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const commonReasons = [
    "Transaction Not Found",
    "Invalid Transaction ID",
    "Amount Mismatch",
    "Duplicate Transaction",
    "Invalid Payment Proof",
  ];

  const handleApprove = async (id: string) => {
    if (confirm("Are you sure you want to approve this contribution? The campaign raised amount will update immediately.")) {
      setActioningId(id);
      setError("");
      setSuccess("");

      try {
        const result = await approveContribution(id, adminId, adminEmail);
        if (!result.success) {
          throw new Error(result.error || "Approval failed");
        }

        setPendingItems(pendingItems.filter((item) => item.id !== id));
        setSuccess("Contribution approved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } catch (err: any) {
        setError(err.message || "Failed to approve.");
      } finally {
        setActioningId(null);
      }
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    const finalReason = rejectReason === "other" ? customReason.trim() : rejectReason;
    if (!finalReason) {
      setError("Please specify a rejection reason.");
      return;
    }

    setActioningId(rejectingItem.id);
    setError("");
    setSuccess("");
    const id = rejectingItem.id;
    setRejectingItem(null);

    try {
      const result = await rejectContribution(id, finalReason, adminId, adminEmail);
      if (!result.success) {
        throw new Error(result.error || "Rejection failed");
      }

      setPendingItems(pendingItems.filter((item) => item.id !== id));
      setSuccess("Contribution rejected and donor notified.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reject.");
    } finally {
      setActioningId(null);
      setCustomReason("");
      setRejectReason("Transaction Not Found");
    }
  };

  return (
    <div className="space-y-6">
      
      {error && (
        <div className="flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start space-x-2 rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-800">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-premium">
        
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Active Review Queue ({pendingItems.length})
          </h2>
        </div>

        {pendingItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="px-6 py-3 text-left">Donor / Email</th>
                  <th className="px-6 py-3 text-left">Campaign</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-left">Payment details</th>
                  <th className="px-6 py-3 text-center">Slip Proof</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingItems.map((con) => (
                  <tr key={con.id} className="hover:bg-slate-50/50 transition">
                    
                    {/* Donor Details */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{con.donor.name}</p>
                      <p className="text-slate-400 text-[10px] font-semibold mt-0.5">{con.donor.email}</p>
                      <p className="text-[9px] text-slate-400 mt-1">Submitted: {new Date(con.createdAt).toLocaleDateString()}</p>
                    </td>

                    {/* Campaign Title */}
                    <td className="px-6 py-4 font-medium text-slate-700 max-w-[180px] truncate">
                      {con.campaign.title}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 text-right font-black text-slate-900 whitespace-nowrap">
                      ৳{con.amount.toLocaleString()}
                    </td>

                    {/* Payment details */}
                    <td className="px-6 py-4 space-y-1">
                      <p className="text-slate-700 font-semibold">
                        Method: <span className="uppercase font-bold text-green-700 bg-green-50 border border-green-100 rounded px-1">{con.paymentProof?.paymentMethod}</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Sender: <span className="font-semibold text-slate-800">{con.paymentProof?.senderNumber}</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        TxID: <span className="font-mono font-bold text-slate-800">{con.paymentProof?.transactionId}</span>
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Paid Date: {con.paymentProof ? new Date(con.paymentProof.paymentDate).toLocaleDateString() : "-"}
                      </p>
                    </td>

                    {/* Proof Slip Preview */}
                    <td className="px-6 py-4 text-center">
                      {con.paymentProof?.slipUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(con.paymentProof!.slipUrl)}
                          className="inline-flex items-center space-x-1 text-green-600 hover:text-green-700 font-bold border border-green-200 hover:border-green-300 rounded px-2 py-1 bg-green-50 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-rose-500 font-semibold">Missing Slip</span>
                      )}
                    </td>

                    {/* Approve / Reject actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleApprove(con.id)}
                          disabled={actioningId === con.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px] tracking-wide uppercase transition shadow-sm"
                        >
                          {actioningId === con.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectingItem(con)}
                          disabled={actioningId === con.id}
                          className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold px-3 py-1.5 rounded-lg text-[10px] tracking-wide uppercase transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 space-y-2">
            <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-slate-500 font-semibold text-sm">Your verification queue is empty!</p>
            <p className="text-slate-400 text-xs">All contributions are fully processed.</p>
          </div>
        )}
      </div>

      {/* REJECTION MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-premium max-w-md w-full space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Reject Contribution Proof</h3>
              <button onClick={() => setRejectingItem(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500">
                  Select why you are rejecting the contribution of ৳{rejectingItem.amount} by donor {rejectingItem.donor.name}.
                  An email notification will be fired to notify them.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {commonReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                  <option value="other">Other / Custom Reason</option>
                </select>
              </div>

              {rejectReason === "other" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Provide specific details why proof is invalid..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition shadow-sm"
                >
                  Submit Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROOF SLIP PREVIEW MODAL */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-premium max-w-2xl w-full space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Payment Proof Document Preview</h3>
              <button onClick={() => setPreviewUrl(null)} className="p-1 hover:bg-slate-100 rounded text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center max-h-[500px]">
              {previewUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewUrl} className="w-full h-[450px]" title="Slip PDF preview" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={previewUrl} alt="Slip proof preview" className="max-w-full max-h-[450px] object-contain" />
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
              >
                Open in New Window
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
