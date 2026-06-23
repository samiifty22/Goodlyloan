"use client";

import { useState } from "react";
import {
    upsertDonorPaymentInfo,
    updateDonorName,
} from "@/lib/actions/donor-profile";
import {
    CheckCircle2,
    AlertCircle,
    Loader2,
    User,
    Smartphone,
    Landmark,
    Save,
} from "lucide-react";

interface PaymentInfo {
    bkashNumber?: string | null;
    nagadNumber?: string | null;
    rocketNumber?: string | null;
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    branchName?: string | null;
    routingNumber?: string | null;
}

interface Props {
    userId: string;
    initialName: string;
    initialEmail: string;
    initialPaymentInfo: PaymentInfo | null;
}

export default function DonorProfileForm({
    userId,
    initialName,
    initialEmail,
    initialPaymentInfo,
}: Props) {
    const [name, setName] = useState(initialName);
    const [bkash, setBkash] = useState(initialPaymentInfo?.bkashNumber ?? "");
    const [nagad, setNagad] = useState(initialPaymentInfo?.nagadNumber ?? "");
    const [rocket, setRocket] = useState(initialPaymentInfo?.rocketNumber ?? "");
    const [bankName, setBankName] = useState(initialPaymentInfo?.bankName ?? "");
    const [accountName, setAccountName] = useState(initialPaymentInfo?.accountName ?? "");
    const [accountNumber, setAccountNumber] = useState(initialPaymentInfo?.accountNumber ?? "");
    const [branchName, setBranchName] = useState(initialPaymentInfo?.branchName ?? "");
    const [routingNumber, setRoutingNumber] = useState(initialPaymentInfo?.routingNumber ?? "");

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    async function handleSave() {
        setLoading(true);
        setResult(null);

        const [nameRes, paymentRes] = await Promise.all([
            updateDonorName(userId, name),
            upsertDonorPaymentInfo(userId, {
                bkashNumber: bkash.trim() || undefined,
                nagadNumber: nagad.trim() || undefined,
                rocketNumber: rocket.trim() || undefined,
                bankName: bankName.trim() || undefined,
                accountName: accountName.trim() || undefined,
                accountNumber: accountNumber.trim() || undefined,
                branchName: branchName.trim() || undefined,
                routingNumber: routingNumber.trim() || undefined,
            }),
        ]);

        setLoading(false);

        if (nameRes.success && paymentRes.success) {
            setResult({ success: true, message: "Profile saved successfully!" });
        } else {
            setResult({
                success: false,
                message: nameRes.error ?? paymentRes.error ?? "Failed to save profile.",
            });
        }
    }

    return (
        <div className="space-y-6">

            {/* Result banner */}
            {result && (
                <div className={`flex items-start gap-2 rounded-lg p-3.5 text-sm font-medium border ${result.success
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                    {result.success
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                    {result.message}
                </div>
            )}

            {/* Personal Info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <User className="h-4 w-4 text-green-600" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Personal Information
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Email Address</label>
                        <input
                            type="email"
                            value={initialEmail}
                            disabled
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-slate-400">Email cannot be changed.</p>
                    </div>
                </div>
            </div>

            {/* Mobile Banking */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Mobile Banking Numbers
                    </h3>
                </div>
                <p className="text-xs text-slate-400">
                    These numbers will be visible to admins when releasing repayments to you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="text-pink-500">●</span> bKash Number
                        </label>
                        <input
                            type="tel"
                            value={bkash}
                            onChange={(e) => setBkash(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="text-orange-500">●</span> Nagad Number
                        </label>
                        <input
                            type="tel"
                            value={nagad}
                            onChange={(e) => setNagad(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <span className="text-purple-500">●</span> Rocket Number
                        </label>
                        <input
                            type="tel"
                            value={rocket}
                            onChange={(e) => setRocket(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Bank Transfer */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Landmark className="h-4 w-4 text-green-600" />
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        Bank Account Details
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. Islami Bank Bangladesh"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Account Holder Name</label>
                        <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Full name as on bank account"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Account Number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="e.g. 20501234567890"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">Branch Name</label>
                        <input
                            type="text"
                            value={branchName}
                            onChange={(e) => setBranchName(e.target.value)}
                            placeholder="e.g. Motijheel Branch"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-600">Routing Number (optional)</label>
                        <input
                            type="text"
                            value={routingNumber}
                            onChange={(e) => setRoutingNumber(e.target.value)}
                            placeholder="e.g. 125274209"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg text-sm transition shadow-md shadow-green-600/10"
                >
                    {loading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Save className="h-4 w-4" />}
                    {loading ? "Saving..." : "Save Profile"}
                </button>
            </div>

        </div>
    );
}