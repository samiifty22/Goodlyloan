import React from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/actions/settings";
import { formatDate, DONATION_TYPES, PAYMENT_METHODS } from "@/lib/schedule";
import { Heart, ShieldCheck } from "lucide-react";
import PrintButton from "@/components/PrintButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

// What the donor is told their money will be used for, per fund
const purposeText: Record<string, string> = {
  QARD_HASANA:
    "This amount has been received as Qard Hasana. It will be lent interest-free to verified recipients, " +
    "re-lent as it is repaid, and returned to you as agreed with GoodlyLoan.",
  SADAQAH:
    "This amount has been received as Sadaqah. It will be given to verified recipients as a gift and is not repayable.",
  OPERATIONAL:
    "This amount has been received as operational support. It is used only for running GoodlyLoan and is kept " +
    "separate from money meant for recipients.",
};

export default async function DonationReceiptPage({ params }: PageProps) {
  const id = (await params).id;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const donation = await db.donation.findUnique({
    where: { id },
    include: { donor: true },
  });

  if (!donation) {
    notFound();
  }

  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">

      {/* Outer Card */}
      <div className="mx-auto max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-premium p-8 space-y-8 print:border-0 print:shadow-none print:p-0">

        {/* Header bar controls (hidden on print) */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
          <span className="text-xs font-semibold text-slate-500">Official Donation Receipt</span>
          <PrintButton />
        </div>

        {/* Brand Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white">
                <Heart className="h-4.5 w-4.5 fill-current" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                {settings?.organizationName || "Goodly Loan"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {[settings?.contactEmail, settings?.contactPhone].filter(Boolean).join(" | ")}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center space-x-1 rounded bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span>RECEIVED</span>
            </span>
            <p className="text-[10px] text-slate-400 mt-2">Receipt No: {donation.receiptNumber}</p>
            <p className="text-[10px] text-slate-400">Issued Date: {formatDate(donation.createdAt)}</p>
          </div>
        </div>

        {/* Amount */}
        <div className="border-t border-b border-slate-100 py-6 text-center space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {DONATION_TYPES[donation.type] ?? donation.type} Receipt
          </h2>
          <p className="text-2xl font-black text-slate-800">
            ৳{donation.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {purposeText[donation.type] ?? "This amount has been received with thanks."}
          </p>
        </div>

        {/* Donor & payment info */}
        <div className="grid grid-cols-2 gap-6 text-xs leading-normal">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Donor Details</h4>
            <div>
              <p className="text-slate-400">Name</p>
              <p className="font-bold text-slate-800">{donation.donor.fullName}</p>
            </div>
            <div>
              <p className="text-slate-400">Donor ID</p>
              <p className="font-mono font-bold text-slate-800">{donation.donor.donorCode}</p>
            </div>
            <div>
              <p className="text-slate-400">Phone</p>
              <p className="font-semibold text-slate-600">{donation.donor.phoneNumber}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Payment</h4>
            <div>
              <p className="text-slate-400">Date Received</p>
              <p className="font-semibold text-slate-800">{formatDate(donation.receivedDate)}</p>
            </div>
            <div>
              <p className="text-slate-400">Payment Method</p>
              <p className="font-semibold text-slate-800">
                {donation.paymentMethod ? PAYMENT_METHODS[donation.paymentMethod] ?? donation.paymentMethod : "-"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Transaction ID / Reference</p>
              <p className="font-mono font-bold text-slate-800">{donation.reference || "-"}</p>
            </div>
          </div>
        </div>

        {/* Shariah Note & Sign-off */}
        <div className="border-t border-slate-100 pt-8 flex justify-between items-end">
          <div className="max-w-xs space-y-1.5">
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Shariah Compliance Notice</p>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              GoodlyLoan operates under Qard Hasan principles. No interest, margin or fee is charged to any
              recipient, and nothing is deducted from this amount.
            </p>
          </div>

          <div className="text-center w-40 space-y-1">
            <div className="border-b border-slate-300 h-10 w-full" />
            <p className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Authorized Signature</p>
            <p className="text-[8px] text-slate-400">{settings?.organizationName}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
