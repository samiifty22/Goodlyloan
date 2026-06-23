"use client";

import React, { useState } from "react";
import { disburseLoan, recordRepayment, addCampaignUpdate } from "@/lib/actions/repayments";
import { setCampaignStatus } from "@/lib/actions/campaigns";
import {
  AlertCircle, CheckCircle, Save, Landmark, Coins, FileText,
  Bell, Plus, Loader2, ArrowLeft, Users, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import DonorListTab from "@/components/DonorListTab";

interface Borrower {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  occupation: string;
  nidNumber: string;
  purposeOfLoan: string;
  loanAmountRequested: number;
  repaymentPlan: string;
  internalNotes?: string | null;
}

interface Campaign {
  id: string;
  title: string;
  slug: string;
  loanAmountRequired: number;
  raisedAmount: number;
  disbursedAmount: number;
  totalRepaid: number;
  status: string;
  borrower?: Borrower | null;
}

interface AdminCampaignManageProps {
  campaign: Campaign;
  adminId: string;
  adminEmail: string;
}

const STATUS_FLOW = [
  { value: "DRAFT", label: "Draft", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { value: "UNDER_VERIFICATION", label: "Under Verification", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "ACTIVE_FUNDING", label: "Active Funding", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "FULLY_FUNDED", label: "Fully Funded", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "DISBURSED", label: "Disbursed", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "REPAYMENT_ACTIVE", label: "Repayment Active", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "CLOSED", label: "Closed", color: "bg-rose-100 text-rose-700 border-rose-200" },
];

export default function AdminCampaignManage({
  campaign,
  adminId,
  adminEmail,
}: AdminCampaignManageProps) {
  const [activeTab, setActiveTab] = useState<"status" | "repayment" | "update" | "borrower" | "donors">("status");

  // Disbursal & Repayment States
  const [repayAmount, setRepayAmount] = useState("");
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split("T")[0]);
  const [repayNotes, setRepayNotes] = useState("");
  const [disburseAmount, setDisburseAmount] = useState(campaign.loanAmountRequired.toString());

  // Status panel states
  const [currentStatus, setCurrentStatus] = useState(campaign.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{ success: boolean; message: string } | null>(null);

  // Public Update States
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── Status change handler ──────────────────────────────────────────────
  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus) return;
    const label = STATUS_FLOW.find((s) => s.value === newStatus)?.label ?? newStatus;
    if (!confirm(`Change status to "${label}"?\n\nDonors will be notified on key transitions.`)) return;

    setStatusLoading(true);
    setStatusResult(null);

    const res = await setCampaignStatus(campaign.id, newStatus, adminId, adminEmail);

    setStatusLoading(false);
    if (res.success) {
      setCurrentStatus(newStatus);
      setStatusResult({ success: true, message: `Status updated to "${label}" successfully.` });
    } else {
      setStatusResult({ success: false, message: res.error ?? "Failed to update status." });
    }
  }

  // ── Disburse handler ──────────────────────────────────────────────────
  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Confirm disbursement of ৳${disburseAmount} to the borrower? This moves the campaign to the repayment phase.`)) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await disburseLoan(campaign.id, Number(disburseAmount), adminId, adminEmail);
      if (!result.success) throw new Error(result.error);
      setSuccess("Loan funds successfully marked as disbursed! Reloading...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to disburse loan.");
      setLoading(false);
    }
  };

  // ── Repayment handler ─────────────────────────────────────────────────
  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayAmount || Number(repayAmount) <= 0) {
      setError("Please specify a valid repayment amount.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await recordRepayment(
        campaign.id,
        Number(repayAmount),
        new Date(repayDate),
        repayNotes.trim() || undefined,
        adminId,
        adminEmail
      );
      if (!result.success) throw new Error(result.error);
      setSuccess("Repayment logged successfully and all donors notified with their individual share!");
      setRepayAmount("");
      setRepayNotes("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to log repayment.");
      setLoading(false);
    }
  };

  // ── Update handler ────────────────────────────────────────────────────
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateContent.trim()) {
      setError("Please fill in both title and content fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await addCampaignUpdate(
        campaign.id,
        updateTitle.trim(),
        updateContent.trim(),
        adminId,
        adminEmail
      );
      if (!result.success) throw new Error(result.error);
      setSuccess("Timeline update posted publicly!");
      setUpdateTitle("");
      setUpdateContent("");
    } catch (err: any) {
      setError(err.message || "Failed to post update.");
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const disbursed = campaign.disbursedAmount || campaign.loanAmountRequired;
  const repaid = campaign.totalRepaid || 0;
  const outstanding = Math.max(0, disbursed - repaid);
  const percentRepaid = disbursed > 0 ? Math.round((repaid / disbursed) * 100) : 0;

  const showDisbursalForm = currentStatus === "FULLY_FUNDED" || currentStatus === "ACTIVE_FUNDING";
  const showRepaymentForm = ["DISBURSED", "REPAYMENT_ACTIVE"].includes(currentStatus);

  const currentStatusMeta = STATUS_FLOW.find((s) => s.value === currentStatus);

  function switchTab(tab: typeof activeTab) {
    setActiveTab(tab);
    setError("");
    setSuccess("");
  }

  return (
    <div className="space-y-6">

      {/* Top Details Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-lg">{campaign.title}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentStatusMeta?.color ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {currentStatusMeta?.label ?? currentStatus}
            </span>
          </div>
        </div>
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Campaigns</span>
        </Link>
      </div>

      {/* Global alerts */}
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

      {/* Main Tab Controller Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1">
          {[
            { key: "status", icon: <CheckCircle2 className="h-4 w-4" />, label: "Campaign Status" },
            { key: "repayment", icon: <Coins className="h-4 w-4" />, label: "Disburse & Repayments" },
            { key: "donors", icon: <Users className="h-4 w-4" />, label: "Donor Repayments" },
            { key: "update", icon: <Bell className="h-4 w-4" />, label: "Post Public Update" },
            { key: "borrower", icon: <FileText className="h-4 w-4" />, label: "Borrower Details" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key as typeof activeTab)}
              className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-lg transition flex items-center space-x-2 ${activeTab === tab.key
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3">

          {/* ── TAB: CAMPAIGN STATUS ── */}
          {activeTab === "status" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                  Campaign Status Control
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select the stage this campaign is in. Donors are notified automatically on key transitions.
                </p>
              </div>

              {/* Current badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Current:</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentStatusMeta?.color}`}>
                  {currentStatusMeta?.label ?? currentStatus}
                </span>
                {statusLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              </div>

              {/* Status grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    disabled={statusLoading || s.value === currentStatus}
                    className={`text-xs font-bold px-3 py-2.5 rounded-lg border transition ${s.value === currentStatus
                        ? `${s.color} ring-2 ring-offset-1 ring-slate-400 cursor-default`
                        : "bg-white border-slate-200 text-slate-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 disabled:opacity-40"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {statusResult && (
                <div className={`flex items-start gap-2 rounded-lg p-3 text-xs font-medium border ${statusResult.success
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                  {statusResult.success
                    ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <p>{statusResult.message}</p>
                </div>
              )}

              {/* Status guide */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Guide</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-500">
                  <p><strong className="text-slate-700">Draft</strong> — Hidden from public</p>
                  <p><strong className="text-slate-700">Under Verification</strong> — Being reviewed</p>
                  <p><strong className="text-slate-700">Active Funding</strong> — Accepting donations</p>
                  <p><strong className="text-slate-700">Fully Funded</strong> — Goal reached</p>
                  <p><strong className="text-slate-700">Disbursed</strong> — Funds sent to borrower</p>
                  <p><strong className="text-slate-700">Repayment Active</strong> — Collecting repayments</p>
                  <p><strong className="text-slate-700">Completed</strong> — Fully repaid</p>
                  <p><strong className="text-slate-700">Closed</strong> — Archived / cancelled</p>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: DISBURSE & REPAYMENTS ── */}
          {activeTab === "repayment" && (
            <div className="space-y-6">

              {/* Overview */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Financing Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-2 bg-slate-50 border border-slate-200/50 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Target Loan</p>
                    <p className="text-sm font-extrabold text-slate-800">৳{campaign.loanAmountRequired.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200/50 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Raised Amount</p>
                    <p className="text-sm font-extrabold text-slate-800">৳{campaign.raisedAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200/50 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total Repaid</p>
                    <p className="text-sm font-extrabold text-green-600">৳{repaid.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200/50 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Outstanding</p>
                    <p className="text-sm font-extrabold text-slate-800">৳{outstanding.toLocaleString()}</p>
                  </div>
                </div>

                {/* Repayment progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Repayment Progress</span>
                    <span>{percentRepaid}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${percentRepaid}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Disburse form */}
              {showDisbursalForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Landmark className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-bold text-slate-800">Disburse Loan Funds to Borrower</h3>
                  </div>
                  <form onSubmit={handleDisburse} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-grow">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Disbursal Amount (৳)</label>
                      <input
                        type="number"
                        required
                        value={disburseAmount}
                        onChange={(e) => setDisburseAmount(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-5 py-2 rounded-lg text-xs transition flex items-center space-x-1 shadow-sm shrink-0"
                    >
                      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      <span>Mark Disbursed</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Repayment form */}
              {showRepaymentForm && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Coins className="h-4 w-4 text-green-600" />
                    <h3 className="text-sm font-bold text-slate-800">Record Borrower Repayment</h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The repayment amount will be automatically split proportionally among all donors based on their contribution size and will appear on each donor's dashboard.
                  </p>
                  <form onSubmit={handleRepaySubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Repayment Amount (৳)</label>
                      <input
                        type="number"
                        required
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Repayment Date</label>
                      <input
                        type="date"
                        required
                        value={repayDate}
                        onChange={(e) => setRepayDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                      <input
                        type="text"
                        value={repayNotes}
                        onChange={(e) => setRepayNotes(e.target.value)}
                        placeholder="e.g. Monthly payment..."
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition flex items-center space-x-1 shadow-sm"
                      >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <Plus className="h-3.5 w-3.5" />
                        <span>Record Repayment</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Completed state */}
              {currentStatus === "COMPLETED" && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center text-emerald-800 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold">This benevolent loan has been fully repaid!</p>
                  <p className="text-xs text-emerald-600">
                    The funds have returned to the benevolent pool and are ready to be recycled.
                  </p>
                </div>
              )}

              {/* If neither form is shown and not completed */}
              {!showDisbursalForm && !showRepaymentForm && currentStatus !== "COMPLETED" && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center space-y-1">
                  <p className="text-sm font-bold text-amber-800">No actions available for current status</p>
                  <p className="text-xs text-amber-600">
                    Move the campaign to <strong>Active Funding</strong> or <strong>Fully Funded</strong> to enable disbursement, or <strong>Repayment Active</strong> to record repayments.
                  </p>
                  <button
                    onClick={() => switchTab("status")}
                    className="mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-900"
                  >
                    Go to Status Control →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: DONORS ── */}
          {activeTab === "donors" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Donor-Level Repayments
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click any donor to view their contribution and manually release individual repayments.
                </p>
              </div>
              <DonorListTab campaignId={campaign.id} />
            </div>
          )}

          {/* ── TAB: POST UPDATE ── */}
          {activeTab === "update" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Publish Campaign Timeline Update
              </h3>
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Update Title</label>
                  <input
                    type="text"
                    required
                    value={updateTitle}
                    onChange={(e) => setUpdateTitle(e.target.value)}
                    placeholder="e.g. Loan Disbursed, Shop Started, First Repayment Logged..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Update Content</label>
                  <textarea
                    required
                    rows={4}
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    placeholder="Provide details about the milestone achieved. This will be displayed publicly on the campaign timeline..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition flex items-center space-x-1 shadow-sm"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Publish Update</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── TAB: BORROWER DETAILS ── */}
          {activeTab === "borrower" && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Internal Borrower Record
              </h3>
              {campaign.borrower ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Full Name</p>
                    <p className="font-bold text-slate-800 text-sm">{campaign.borrower.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Phone Number</p>
                    <p className="font-bold text-slate-800">{campaign.borrower.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">NID Card Number</p>
                    <p className="font-mono font-bold text-slate-800">{campaign.borrower.nidNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Occupation</p>
                    <p className="font-semibold text-slate-800">{campaign.borrower.occupation}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Residential Address</p>
                    <p className="font-semibold text-slate-800">{campaign.borrower.address}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Purpose of Loan</p>
                    <p className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">
                      {campaign.borrower.purposeOfLoan}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 font-bold uppercase text-[9px]">Proposed Repayment Plan</p>
                    <p className="font-semibold text-slate-700 whitespace-pre-line">{campaign.borrower.repaymentPlan}</p>
                  </div>
                  {campaign.borrower.internalNotes && (
                    <div className="col-span-2 border-t border-slate-100 pt-3">
                      <p className="text-rose-500 font-bold uppercase text-[9px]">Internal Audit Notes</p>
                      <p className="text-slate-500 italic bg-rose-50/20 border border-rose-100 rounded p-2 mt-1">
                        {campaign.borrower.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No borrower record linked to this campaign.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}