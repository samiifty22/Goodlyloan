import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDonorRepaymentPageData } from "@/lib/actions/donor-repayment";
import { getDonorPaymentInfoForAdmin } from "@/lib/actions/donor-profile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DonorReleasePanel from "@/components/DonorReleasePanel";
import Link from "next/link";
import { ArrowLeft, UserCircle } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string; donorId: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminDonorReleasePage({ params }: PageProps) {
    const { id: campaignId, donorId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "ADMIN") redirect("/login");

    const [{ contribution, campaign }, paymentInfo] = await Promise.all([
        getDonorRepaymentPageData(campaignId, donorId),
        getDonorPaymentInfoForAdmin(donorId),
    ]);

    if (!contribution || !campaign) notFound();

    const serializedContribution = {
        ...contribution,
        amount: contribution.amount,
        repayments: contribution.repayments.map((r: any) => ({
            ...r,
            amount: r.amount,
            repaymentDate: r.repaymentDate.toISOString(),
            createdAt: r.createdAt.toISOString(),
            receipt: r.receipt
                ? { id: r.receipt.id, receiptNumber: r.receipt.receiptNumber }
                : null,
        })),
    };

    const totalRepaid = serializedContribution.repayments.reduce(
        (s: number, r: any) => s + r.amount, 0
    );
    const remaining = serializedContribution.amount - totalRepaid;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />
            <main className="flex-grow py-10">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

                    <Link
                        href={`/admin/campaigns/${campaignId}`}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-green-600 transition font-medium"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Campaign Console
                    </Link>

                    {/* Header */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                <UserCircle className="h-7 w-7 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
                                    {campaign.title}
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight">
                                    {contribution.donor.name}
                                </h1>
                                <p className="text-slate-400 text-sm">{contribution.donor.email}</p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Remaining Balance</p>
                            <p className={`text-2xl font-black ${remaining <= 0 ? "text-green-400" : "text-white"}`}>
                                ৳{remaining.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Payment info card for admin */}
                    {paymentInfo ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                                💳 Donor Payment Details — Send Repayment To
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                {paymentInfo.bkashNumber && (
                                    <div className="bg-pink-50 border border-pink-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-pink-500 uppercase mb-1">bKash</p>
                                        <p className="font-black text-slate-800 text-sm font-mono">{paymentInfo.bkashNumber}</p>
                                    </div>
                                )}
                                {paymentInfo.nagadNumber && (
                                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-orange-500 uppercase mb-1">Nagad</p>
                                        <p className="font-black text-slate-800 text-sm font-mono">{paymentInfo.nagadNumber}</p>
                                    </div>
                                )}
                                {paymentInfo.rocketNumber && (
                                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">Rocket</p>
                                        <p className="font-black text-slate-800 text-sm font-mono">{paymentInfo.rocketNumber}</p>
                                    </div>
                                )}
                                {paymentInfo.accountNumber && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Bank Transfer</p>
                                        <p className="font-bold text-slate-800">{paymentInfo.bankName}</p>
                                        <p className="font-mono text-slate-700 text-[11px]">{paymentInfo.accountNumber}</p>
                                        <p className="text-slate-500 text-[10px]">{paymentInfo.accountName}</p>
                                        {paymentInfo.branchName && (
                                            <p className="text-slate-400 text-[10px]">{paymentInfo.branchName}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!paymentInfo.bkashNumber && !paymentInfo.nagadNumber &&
                                !paymentInfo.rocketNumber && !paymentInfo.accountNumber && (
                                    <p className="text-xs text-slate-400 italic">
                                        Donor has not added any payment details yet.
                                    </p>
                                )}
                        </div>
                    ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 font-medium">
                            ⚠️ This donor has not added any payment details to their profile yet.
                            You may want to contact them before releasing payment.
                        </div>
                    )}

                    <DonorReleasePanel
                        contribution={serializedContribution}
                        campaign={{ id: campaign.id, title: campaign.title }}
                        adminId={session.user.id}
                    />

                </div>
            </main>
            <Footer />
        </div>
    );
}