"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, editCampaign } from "@/lib/actions/campaigns";
import { AlertCircle, Save, ArrowLeft, Loader2, Upload, FileImage } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

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
  categoryId: string;
  shortDescription: string;
  fullStory: string;
  loanAmountRequired: number;
  expectedRepaymentDuration: string;
  coverImage: string;
  riskLevel: string;
  status: string;
  borrowerId?: string | null;
  borrower?: Borrower | null;
}

interface AdminCampaignFormProps {
  categories: Category[];
  initialCampaign?: Campaign | null;
  adminId: string;
  adminEmail: string;
}

export default function AdminCampaignForm({
  categories,
  initialCampaign,
  adminId,
  adminEmail,
}: AdminCampaignFormProps) {
  const router = useRouter();
  const isEdit = !!initialCampaign;

  // Campaign States
  const [title, setTitle] = useState(initialCampaign?.title || "");
  const [categoryId, setCategoryId] = useState(initialCampaign?.categoryId || (categories[0]?.id || ""));
  const [shortDesc, setShortDesc] = useState(initialCampaign?.shortDescription || "");
  const [fullStory, setFullStory] = useState(initialCampaign?.fullStory || "");
  const [loanAmount, setLoanAmount] = useState(initialCampaign?.loanAmountRequired || "");
  const [duration, setDuration] = useState(initialCampaign?.expectedRepaymentDuration || "12 months");
  const [coverImage, setCoverImage] = useState(initialCampaign?.coverImage || "");
  const [riskLevel, setRiskLevel] = useState(initialCampaign?.riskLevel || "LOW");
  const [status, setStatus] = useState(initialCampaign?.status || "DRAFT");

  // Borrower States
  const [borrowerName, setBorrowerName] = useState(initialCampaign?.borrower?.fullName || "");
  const [borrowerPhone, setBorrowerPhone] = useState(initialCampaign?.borrower?.phoneNumber || "");
  const [borrowerAddress, setBorrowerAddress] = useState(initialCampaign?.borrower?.address || "");
  const [borrowerOccupation, setBorrowerOccupation] = useState(initialCampaign?.borrower?.occupation || "");
  const [borrowerNid, setBorrowerNid] = useState(initialCampaign?.borrower?.nidNumber || "");
  const [borrowerPurpose, setBorrowerPurpose] = useState(initialCampaign?.borrower?.purposeOfLoan || "");
  const [borrowerRepayPlan, setBorrowerRepayPlan] = useState(initialCampaign?.borrower?.repaymentPlan || "");
  const [borrowerNotes, setBorrowerNotes] = useState(initialCampaign?.borrower?.internalNotes || "");

  // UI States
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setCoverImage(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload cover image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !shortDesc.trim() || !fullStory.trim() || !loanAmount) {
      setError("Please fill in all campaign fields.");
      return;
    }

    if (!borrowerName.trim() || !borrowerPhone.trim() || !borrowerNid.trim()) {
      setError("Please fill in NID, Name, and Phone for the Borrower.");
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        const result = await editCampaign({
          id: initialCampaign!.id,
          title: title.trim(),
          categoryId,
          shortDescription: shortDesc.trim(),
          fullStory: fullStory.trim(),
          loanAmountRequired: Number(loanAmount),
          expectedRepaymentDuration: duration,
          coverImage,
          riskLevel,
          status,
          borrowerId: initialCampaign!.borrowerId!,
          borrowerName: borrowerName.trim(),
          borrowerPhone: borrowerPhone.trim(),
          borrowerAddress: borrowerAddress.trim(),
          borrowerOccupation: borrowerOccupation.trim(),
          borrowerNid: borrowerNid.trim(),
          borrowerPurpose: borrowerPurpose.trim(),
          borrowerRepaymentPlan: borrowerRepayPlan.trim(),
          borrowerNotes: borrowerNotes.trim() || undefined,
          adminId,
          adminEmail,
        });

        if (!result.success) throw new Error(result.error);
      } else {
        const result = await createCampaign({
          title: title.trim(),
          categoryId,
          shortDescription: shortDesc.trim(),
          fullStory: fullStory.trim(),
          loanAmountRequired: Number(loanAmount),
          expectedRepaymentDuration: duration,
          coverImage,
          riskLevel,
          borrowerName: borrowerName.trim(),
          borrowerPhone: borrowerPhone.trim(),
          borrowerAddress: borrowerAddress.trim(),
          borrowerOccupation: borrowerOccupation.trim(),
          borrowerNid: borrowerNid.trim(),
          borrowerPurpose: borrowerPurpose.trim(),
          borrowerRepaymentPlan: borrowerRepayPlan.trim(),
          borrowerNotes: borrowerNotes.trim() || undefined,
          adminId,
          adminEmail,
        });

        if (!result.success) throw new Error(result.error);
      }

      router.push("/admin/campaigns");
    } catch (err: any) {
      setError(err.message || "Failed to save campaign.");
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

      {/* Main Campaign Data */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          Campaign Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Funding Benevolent Loan for Rahim's Grocery shop"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount Required (৳)</label>
            <input
              type="number"
              required
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expected Repayment Duration</label>
            <input
              type="text"
              required
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 12 months"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Risk Assessment Level</label>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
            </select>
          </div>

          {/* Image upload */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Campaign Cover Photo</label>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Image URL or upload below..."
                className="flex-grow px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <div className="relative border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-green-600" /> : <Upload className="h-3.5 w-3.5 text-slate-500" />}
                  <span>Upload Image</span>
                </span>
              </div>
            </div>
          </div>

          {isEdit && (
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Campaign status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="DRAFT">Draft Spec</option>
                <option value="UNDER_VERIFICATION">Under Verification</option>
                <option value="ACTIVE_FUNDING">Active Funding (Published)</option>
                <option value="FULLY_FUNDED">Fully Funded</option>
                <option value="DISBURSED">Disbursed (Awaiting Repayments)</option>
                <option value="REPAYMENT_ACTIVE">Repayment Phase Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed / Terminated</option>
              </select>
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Short Description (Loan Purpose)</label>
            <textarea
              required
              rows={2}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Provide a concise 1-2 sentence overview of what the loan will accomplish..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Full story description</label>
            <textarea
              required
              rows={6}
              value={fullStory}
              onChange={(e) => setFullStory(e.target.value)}
              placeholder="Detail the borrower's circumstances, livelihood challenges, and how this benevolence funding will make a difference..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

        </div>
      </div>

      {/* Internal Borrower Information */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Internal Borrower Information (Offline Records Only)
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Borrowers do NOT have accounts. This data is for administrative logging and internal due-diligence tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Borrower Full Name</label>
            <input
              type="text"
              required
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="e.g. Abdur Rahim"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={borrowerPhone}
              onChange={(e) => setBorrowerPhone(e.target.value)}
              placeholder="e.g. 017XXXXXXXX"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">NID Card Number</label>
            <input
              type="text"
              required
              value={borrowerNid}
              onChange={(e) => setBorrowerNid(e.target.value)}
              placeholder="e.g. 1990269..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Occupation</label>
            <input
              type="text"
              required
              value={borrowerOccupation}
              onChange={(e) => setBorrowerOccupation(e.target.value)}
              placeholder="e.g. Small Retail Shopkeeper"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
            <input
              type="text"
              required
              value={borrowerAddress}
              onChange={(e) => setBorrowerAddress(e.target.value)}
              placeholder="Full physical address..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Purpose of Loan</label>
            <input
              type="text"
              required
              value={borrowerPurpose}
              onChange={(e) => setBorrowerPurpose(e.target.value)}
              placeholder="e.g. Purchasing fresh wholesale rice and oil stocks to restore inventory..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Proposed Repayment Plan</label>
            <textarea
              required
              rows={2}
              value={borrowerRepayPlan}
              onChange={(e) => setBorrowerRepayPlan(e.target.value)}
              placeholder="e.g. Monthly repayments of ৳4,000 for 12 months with a 2-month grace period."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Notes / Review Comments</label>
            <textarea
              rows={3}
              value={borrowerNotes}
              onChange={(e) => setBorrowerNotes(e.target.value)}
              placeholder="Confidential notes: Reference checks, collateral details, local verification verdicts..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => router.push("/admin/campaigns")}
          className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel</span>
        </button>
        
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isEdit ? "Update Campaign Case" : "Publish Campaign Spec"}</span>
        </button>
      </div>

    </form>
  );
}
