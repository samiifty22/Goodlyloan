import React from "react";
import { CheckCircle2, ShieldCheck, FileText, UserCheck } from "lucide-react";

interface BadgeProps {
  type: "identity" | "need" | "documents" | "admin";
  showLabel?: boolean;
}

export default function VerificationBadge({ type, showLabel = true }: BadgeProps) {
  const badgeMap = {
    identity: {
      label: "Identity Verified",
      icon: UserCheck,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-500",
    },
    need: {
      label: "Need Verified",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-500",
    },
    documents: {
      label: "Documents Verified",
      icon: FileText,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      iconColor: "text-amber-500",
    },
    admin: {
      label: "Admin Approved",
      icon: CheckCircle2,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      iconColor: "text-purple-500",
    },
  };

  const badge = badgeMap[type];
  const Icon = badge.icon;

  if (!showLabel) {
    return (
      <div
        className={`inline-flex items-center justify-center p-1.5 rounded-full border ${badge.color}`}
        title={badge.label}
      >
        <Icon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.color}`}
    >
      <Icon className={`h-3.5 w-3.5 ${badge.iconColor}`} />
      <span>{badge.label}</span>
    </span>
  );
}
