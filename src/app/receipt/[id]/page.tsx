import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/actions/settings";
import { Heart, Printer, ShieldCheck } from "lucide-react";
import PrintButton from "@/components/PrintButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ReceiptPage({ params }: PageProps) {
  const receiptId = (await params).id;

  const receipt = await db.receipt.findUnique({
    where: { id: receiptId },
    include: {
      contribution: {
        include: {
          donor: {
            select: { name: true, email: true },
          },
          campaign: {
            select: { title: true, loanAmountRequired: true },
          },
          paymentProof: true,
        },
      },
    },
  });

  if (!receipt) {
    notFound();
  }

  const settings = await getSettings();
  const con = receipt.contribution;

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
              Interest-Free Qard Hasan Crowdfunding Platform {settings?.contactEmail} | {settings?.contactPhone}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center space-x-1 rounded bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span>VERIFIED DONATION</span>
            </span>
            <p className="text-[10px] text-slate-400 mt-2">Receipt No: {receipt.receiptNumber}</p>
            <p className="text-[10px] text-slate-400">Issued Date: {new Date(receipt.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Middle Message */}
        <div className="border-t border-b border-slate-100 py-6 text-center space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contribution Receipt</h2>
          <p className="text-2xl font-black text-slate-800">৳{Number(con.amount).toLocaleString()}.00</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Thank you for your generous benevolent contribution. This receipt confirms that your payment 
            has been verified by our administration and successfully credited to the loan campaign pool.
          </p>
        </div>

        {/* Transaction & Donor Info */}
        <div className="grid grid-cols-2 gap-6 text-xs leading-normal">
          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Donor Details</h4>
            <div>
              <p className="text-slate-400">Name</p>
              <p className="font-bold text-slate-800">{con.donor?.name}</p>
            </div>
            <div>
              <p className="text-slate-400">Email Address</p>
              <p className="font-semibold text-slate-600">{con.donor?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Campaign & Transaction</h4>
            <div>
              <p className="text-slate-400">Campaign Supported</p>
              <p className="font-bold text-slate-800">{con.campaign?.title}</p>
            </div>
            <div>
              <p className="text-slate-400">Payment Method</p>
              <p className="font-semibold text-slate-800 uppercase">{con.paymentProof?.paymentMethod}</p>
            </div>
            <div>
              <p className="text-slate-400">Transaction ID</p>
              <p className="font-mono font-bold text-slate-800">{con.paymentProof?.transactionId}</p>
            </div>
            <div>
              <p className="text-slate-400">Payment Date</p>
              <p className="font-semibold text-slate-600">
                {con.paymentProof ? new Date(con.paymentProof.paymentDate).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Shariah Note & Sign-off */}
        <div className="border-t border-slate-100 pt-8 flex justify-between items-end">
          <div className="max-w-xs space-y-1.5">
            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Shariah Compliance Notice</p>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              This loan transaction operates fully under Qard Hasan protocols. No interest rates, admin margins, 
              or fees have been levied on this benevolence transaction. When repaid, these funds return to help others.
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
