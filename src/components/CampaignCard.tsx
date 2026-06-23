import React from "react";
import Link from "next/link";
import { Clock, Shield, AlertTriangle } from "lucide-react";
import VerificationBadge from "./VerificationBadge";

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string;
    loanAmountRequired: number;
    raisedAmount: number;
    status: string;
    coverImage: string;
    riskLevel: string;
    expectedRepaymentDuration: string;
    category: {
      name: string;
    };
    identityVerified: boolean;
    needVerified: boolean;
    documentsVerified: boolean;
    adminApproved: boolean;
  };
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const percent = Math.min(
    Math.round((campaign.raisedAmount / campaign.loanAmountRequired) * 100),
    100
  );

  const isRepayment = ["DISBURSED", "REPAYMENT_ACTIVE", "COMPLETED"].includes(campaign.status);

  // Status text & style mapping
  const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Draft", class: "bg-slate-100 text-slate-700" },
    UNDER_VERIFICATION: { label: "Verifying", class: "bg-amber-100 text-amber-800" },
    ACTIVE_FUNDING: { label: "Active Funding", class: "bg-green-100 text-green-800" },
    FULLY_FUNDED: { label: "Fully Funded", class: "bg-blue-100 text-blue-800" },
    DISBURSED: { label: "Disbursed", class: "bg-purple-100 text-purple-800" },
    REPAYMENT_ACTIVE: { label: "Repaying", class: "bg-indigo-100 text-indigo-800" },
    COMPLETED: { label: "Completed ✓", class: "bg-emerald-100 text-emerald-800" },
    CLOSED: { label: "Closed", class: "bg-rose-100 text-rose-800" },
  };

  const currentStatus = statusConfig[campaign.status] || {
    label: campaign.status,
    class: "bg-slate-100 text-slate-800",
  };

  const riskColors: Record<string, string> = {
    LOW: "text-green-700 bg-green-50 border-green-200",
    MEDIUM: "text-amber-700 bg-amber-50 border-amber-200",
    HIGH: "text-rose-700 bg-rose-50 border-rose-200",
  };

  return (
    <div className="hover-lift flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-premium hover:shadow-premium-hover">
      
      {/* Cover Image & Category Badge */}
      <div className="relative h-48 w-full bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={campaign.coverImage || "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800"}
          alt={campaign.title}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
            {campaign.category?.name || "General"}
          </span>
          <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${currentStatus.class}`}>
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className={`inline-flex items-center space-x-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${riskColors[campaign.riskLevel] || riskColors.LOW}`}>
            <Shield className="h-3 w-3" />
            <span>{campaign.riskLevel} Risk</span>
          </span>
          <span className="flex items-center text-xs text-slate-500">
            <Clock className="mr-1 h-3.5 w-3.5" />
            {campaign.expectedRepaymentDuration}
          </span>
        </div>

        <h3 className="mb-2 line-clamp-1 text-lg font-bold text-slate-900">
          <Link href={`/campaigns/${campaign.slug}`} className="hover:text-green-600 transition-colors">
            {campaign.title}
          </Link>
        </h3>
        
        <p className="mb-4 line-clamp-2 text-sm text-slate-500 flex-1">
          {campaign.shortDescription}
        </p>

        {/* Progress Bar & Amounts */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-sm font-semibold text-slate-900">
            <span>{percent}% Funded</span>
            <span>৳{campaign.raisedAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">raised</span></span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="progress-bar-fill h-full rounded-full bg-green-600"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Target: ৳{campaign.loanAmountRequired.toLocaleString()}</span>
            <span>Remaining: ৳{Math.max(0, campaign.loanAmountRequired - campaign.raisedAmount).toLocaleString()}</span>
          </div>
        </div>

        {/* Verification Seals */}
        <div className="mb-5 flex items-center gap-1.5 border-t border-slate-100 pt-3">
          {campaign.identityVerified && <VerificationBadge type="identity" showLabel={false} />}
          {campaign.needVerified && <VerificationBadge type="need" showLabel={false} />}
          {campaign.documentsVerified && <VerificationBadge type="documents" showLabel={false} />}
          {campaign.adminApproved && <VerificationBadge type="admin" showLabel={false} />}
          <span className="text-[10px] text-slate-400 font-medium ml-1">Verified Case</span>
        </div>

        {/* Action Button */}
        <Link
          href={`/campaigns/${campaign.slug}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-green-600"
        >
          {isRepayment ? "View Repayment Case" : "Support Loan Campaign"}
        </Link>
      </div>

    </div>
  );
}
