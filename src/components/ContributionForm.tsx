"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { submitContribution } from "@/lib/actions/contributions";
import { Check, Copy, Upload, AlertCircle, FileCheck2, Loader2 } from "lucide-react";

interface Settings {
  bkashNumber?: string | null;
  nagadNumber?: string | null;
  rocketNumber?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  organizationName: string;
}

interface ContributionFormProps {
  campaignId: string;
  campaignTitle: string;
  remainingAmount: number;
  userId: string | null;
  settings: Settings | null;
}

export default function ContributionForm({
  campaignId,
  campaignTitle,
  remainingAmount,
  userId,
  settings,
}: ContributionFormProps) {
  const pathname = usePathname();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  
  // Proof fields
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipUrl, setSlipUrl] = useState("");
  
  // UI states
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [error, setError] = useState("");

  const presetAmounts = [100, 250, 500, 1000, 5000];

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF slips are accepted.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum 10MB limit.");
      return;
    }

    setSlipFile(file);
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
        throw new Error(data.error || "Failed to upload file");
      }

      setSlipUrl(data.url);
    } catch (err: any) {
      setError(err.message || "File upload failed. Try again.");
      setSlipFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!amount || amount <= 0) {
      setError("Please select or enter a valid contribution amount.");
      return;
    }
    if (!transactionId.trim()) {
      setError("Transaction ID is required.");
      return;
    }
    if (!senderNumber.trim()) {
      setError("Sender mobile/account number is required.");
      return;
    }
    if (!slipUrl) {
      setError("Please wait for the payment slip to upload successfully.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await submitContribution({
        amount,
        paymentMethod,
        transactionId: transactionId.trim(),
        senderNumber: senderNumber.trim(),
        paymentDate: new Date(paymentDate),
        slipUrl,
        campaignId,
        donorId: userId,
      });

      if (!result.success) {
        throw new Error(result.error || "Something went wrong.");
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to submit contribution. Please check your inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount("");
    setError("");
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
    setError("");
  };

  const handleFundRemaining = () => {
    setAmount(remainingAmount);
    setCustomAmount(remainingAmount.toString());
    setError("");
  };

  // If user is not logged in
  if (!userId) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-premium text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Make an Impact</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Please log in or register a donor account to fund this Shariah-compliant campaign and track repayments.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition"
        >
          Sign In to Contribute
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-premium">
      <h3 className="text-lg font-extrabold text-slate-900 mb-4 border-b border-slate-100 pb-2">
        Contribute Benevolently
      </h3>

      {error && (
        <div className="mb-4 flex items-start space-x-2 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Select Amount */}
      {step === 1 && (
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Contribution Amount
          </label>
          <div className="grid grid-cols-3 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAmountSelect(preset)}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  amount === preset && !customAmount
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                ৳{preset}
              </button>
            ))}
            <button
              type="button"
              onClick={handleFundRemaining}
              className={`col-span-3 py-2 text-xs font-bold rounded-lg border transition ${
                amount === remainingAmount
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Fund Remaining Balance (৳{remainingAmount.toLocaleString()})
            </button>
          </div>

          <div className="relative mt-2">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">৳</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Enter custom amount"
              className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <button
            type="button"
            disabled={amount <= 0 || amount > remainingAmount + 1000} // Small buffer allowed if target slightly exceeded
            onClick={() => setStep(2)}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold py-2.5 rounded-lg text-xs transition shadow-sm"
          >
            Next: Payment Instructions
          </button>
        </div>
      )}

      {/* STEP 2: Payment Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-semibold">Selected Amount:</span>
            <span className="font-bold text-slate-800 text-sm">৳{amount}</span>
          </div>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Select External Payment Account
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["bkash", "nagad", "rocket"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`py-2 text-xs font-bold rounded-lg border uppercase transition ${
                  paymentMethod === m
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`col-span-3 py-2 text-xs font-bold rounded-lg border uppercase transition ${
                paymentMethod === "bank_transfer"
                  ? "bg-green-600 border-green-600 text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Bank Account Transfer
            </button>
          </div>

          {/* Account Details Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-3">
            {paymentMethod === "bkash" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">bKash Personal Number</p>
                  <p className="text-xs font-extrabold text-slate-800">{settings?.bkashNumber || "Not Configured"}</p>
                </div>
                {settings?.bkashNumber && (
                  <button
                    onClick={() => handleCopy(settings.bkashNumber!, "bkash")}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition"
                  >
                    {copiedText === "bkash" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}

            {paymentMethod === "nagad" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nagad Personal Number</p>
                  <p className="text-xs font-extrabold text-slate-800">{settings?.nagadNumber || "Not Configured"}</p>
                </div>
                {settings?.nagadNumber && (
                  <button
                    onClick={() => handleCopy(settings.nagadNumber!, "nagad")}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition"
                  >
                    {copiedText === "nagad" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}

            {paymentMethod === "rocket" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Rocket Personal Number</p>
                  <p className="text-xs font-extrabold text-slate-800">{settings?.rocketNumber || "Not Configured"}</p>
                </div>
                {settings?.rocketNumber && (
                  <button
                    onClick={() => handleCopy(settings.rocketNumber!, "rocket")}
                    className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition"
                  >
                    {copiedText === "rocket" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}

            {paymentMethod === "bank_transfer" && (
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Bank Name</p>
                  <p className="font-extrabold text-slate-800">{settings?.bankName || "Not Configured"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Account Name</p>
                  <p className="font-semibold text-slate-800">{settings?.accountName || "Not Configured"}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/50 pt-2">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Account Number</p>
                    <p className="font-extrabold text-slate-800">{settings?.accountNumber || "Not Configured"}</p>
                  </div>
                  {settings?.accountNumber && (
                    <button
                      onClick={() => handleCopy(settings.accountNumber!, "bank")}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition"
                    >
                      {copiedText === "bank" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 leading-normal text-center italic">
            Please transfer the amount externally using your mobile app or banking terminal, then click next to submit transaction proof.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 rounded-lg text-xs transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-2/3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg text-xs transition shadow-sm"
            >
              Next: Upload Proof
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Upload Proof Form */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-semibold">Payment Via:</span>
            <span className="font-bold text-slate-800 uppercase text-xs">{paymentMethod}</span>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID</label>
            <input
              type="text"
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TRN12345678"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Sender mobile number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sender Mobile / Account Number</label>
            <input
              type="text"
              required
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="e.g. 017XXXXXXXX"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* File upload slip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Upload Payment Slip / Screenshot</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-4 hover:bg-slate-50/50 transition text-center">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1">
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 text-green-600 animate-spin" />
                    <span className="text-[10px] text-slate-400 mt-1">Uploading to secure storage...</span>
                  </div>
                ) : slipUrl ? (
                  <div className="flex flex-col items-center">
                    <FileCheck2 className="h-6 w-6 text-green-600" />
                    <span className="text-[10px] font-semibold text-slate-800 truncate max-w-xs">{slipFile?.name}</span>
                    <span className="text-[9px] text-emerald-600">Successfully Uploaded ✓</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-[10px] text-slate-600 font-semibold">Click to select files (JPG, PNG, PDF)</span>
                    <span className="text-[9px] text-slate-400">Max size 10MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-1/3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 rounded-lg text-xs transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || !slipUrl}
              className="w-2/3 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 text-white font-semibold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{submitting ? "Submitting..." : "Submit Contribution"}</span>
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Success Message */}
      {step === 4 && (
        <div className="text-center py-6 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Check className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900">Submission Created</h4>
            <p className="text-xs bg-amber-50 border border-amber-100 rounded-sm py-1 px-2 text-amber-800 font-bold inline-block">
              Pending Verification
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            &ldquo;Your contribution has been submitted successfully and is awaiting verification by our team.&rdquo;
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setStep(1);
                setAmount(0);
                setCustomAmount("");
                setTransactionId("");
                setSenderNumber("");
                setSlipUrl("");
                setSlipFile(null);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Donate Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
