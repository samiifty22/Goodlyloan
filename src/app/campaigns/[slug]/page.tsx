import React from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getCampaignBySlug } from "@/lib/actions/campaigns";
import { getSettings } from "@/lib/actions/settings";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VerificationBadge from "@/components/VerificationBadge";
import ContributionForm from "@/components/ContributionForm";
import { Clock, Shield, Calendar, Award, User, Briefcase, FileBadge, Activity, Landmark, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: PageProps) {
  const slug = (await params).slug;
  const campaign = await getCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  // Fetch settings & auth session for donating
  const [settings, session] = await Promise.all([
    getSettings(),
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);

  const userId = session?.user?.id || null;

  // Calculators
  const percent = Math.min(
    Math.round((campaign.raisedAmount / campaign.loanAmountRequired) * 100),
    100
  );
  
  const remaining = Math.max(0, campaign.loanAmountRequired - campaign.raisedAmount);

  // Status mapping
  const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Draft Spec", class: "bg-slate-100 text-slate-700" },
    UNDER_VERIFICATION: { label: "Under Verification", class: "bg-amber-100 text-amber-800 border-amber-200" },
    ACTIVE_FUNDING: { label: "Active Funding", class: "bg-green-100 text-green-800 border-green-200" },
    FULLY_FUNDED: { label: "Fully Funded", class: "bg-blue-100 text-blue-800 border-blue-200" },
    DISBURSED: { label: "Disbursed", class: "bg-purple-100 text-purple-800 border-purple-200" },
    REPAYMENT_ACTIVE: { label: "Repayment Active", class: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    COMPLETED: { label: "Completed ✓", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    CLOSED: { label: "Closed", class: "bg-rose-100 text-rose-800 border-rose-200" },
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

  // Repayment metrics
  const disbursedAmount = campaign.disbursedAmount || campaign.loanAmountRequired;
  const totalRepaid = campaign.totalRepaid || 0;
  const outstandingAmount = Math.max(0, disbursedAmount - totalRepaid);
  const repaymentPercent = disbursedAmount > 0 ? Math.round((totalRepaid / disbursedAmount) * 100) : 0;

  const isRepaymentVisible = ["DISBURSED", "REPAYMENT_ACTIVE", "COMPLETED"].includes(campaign.status);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Top Navigation breadcrumb/title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="rounded-md bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                  {campaign.category?.name || "General"}
                </span>
                <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${currentStatus.class}`}>
                  {currentStatus.label}
                </span>
                <span className={`inline-flex items-center space-x-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskColors[campaign.riskLevel]}`}>
                  <Shield className="h-3 w-3" />
                  <span>{campaign.riskLevel} Risk</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {campaign.title}
              </h1>
            </div>

            <div className="flex items-center space-x-4 text-sm text-slate-500 shrink-0">
              <span className="flex items-center">
                <Clock className="mr-1.5 h-4 w-4 text-slate-400" />
                {campaign.expectedRepaymentDuration} Duration
              </span>
              <span className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
                Published {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left side: Campaign Story & Timeline */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Cover Image */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 max-h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={campaign.coverImage || "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1200"}
                  alt={campaign.title}
                  className="w-full object-cover"
                />
              </div>

              {/* Trust & Due Diligence Checklist */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-slate-800 text-sm">Offline Verification checklist</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <VerificationBadge type="identity" />
                    <p className="text-[10px] text-slate-400 pl-6 leading-normal">Borrower NID and personal details verified by admins offline.</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <VerificationBadge type="need" />
                    <p className="text-[10px] text-slate-400 pl-6 leading-normal">Verification check of actual financial emergency or project validity.</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <VerificationBadge type="documents" />
                    <p className="text-[10px] text-slate-400 pl-6 leading-normal">Original bills, lease, or business estimates cataloged.</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <VerificationBadge type="admin" />
                    <p className="text-[10px] text-slate-400 pl-6 leading-normal">platform board manual sign-off and risk audit.</p>
                  </div>
                </div>
              </div>

              {/* Case Story */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Purpose of Loan
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed bg-green-50/40 border-l-4 border-green-600 p-4 rounded-r-lg">
                  {campaign.shortDescription}
                </p>

                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 pt-4">
                  Campaign Case & Story
                </h3>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line space-y-3">
                  {campaign.fullStory}
                </div>
              </div>

              {/* Repayment Progress Table & Timeline (if active/completed) */}
              {isRepaymentVisible && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Repayment Tracking & Timeline
                    </h3>
                  </div>

                  {/* Repayment stats panel */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Disbursed Loan</p>
                      <p className="text-lg font-extrabold text-slate-800">৳{disbursedAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Repaid</p>
                      <p className="text-lg font-extrabold text-green-600">৳{totalRepaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Outstanding</p>
                      <p className="text-lg font-extrabold text-slate-800">৳{outstandingAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Repayment Rate</p>
                      <p className="text-lg font-extrabold text-indigo-600">{repaymentPercent}%</p>
                    </div>
                  </div>

                  {/* Repayment progress bar */}
                  <div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="progress-bar-fill h-full rounded-full bg-indigo-600"
                        style={{ width: `${repaymentPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Repayment list */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Repayment History Logs</h4>
                    {campaign.repayments && campaign.repayments.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-bold text-slate-500">Date</th>
                              <th className="px-4 py-2 text-right font-bold text-slate-500">Amount</th>
                              <th className="px-4 py-2 text-left font-bold text-slate-500">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {campaign.repayments.map((rep: any) => (
                              <tr key={rep.id}>
                                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{new Date(rep.repaymentDate).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-right font-semibold text-green-600 whitespace-nowrap">৳{rep.amount.toLocaleString()}</td>
                                <td className="px-4 py-2 text-slate-400">{rep.notes || "Regular installment"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No repayments recorded yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Public Timeline Updates */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Campaign Timeline & Updates
                  </h3>
                </div>

                {campaign.updates && campaign.updates.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {campaign.updates.map((upd: any, idx: number) => (
                        <li key={upd.id}>
                          <div className="relative pb-8">
                            {idx !== campaign.updates.length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 ring-8 ring-white text-green-600 border border-green-200">
                                  <CheckCircle2 className="h-4 w-4" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{upd.title}</p>
                                  <p className="text-xs text-slate-500 mt-1">{upd.content}</p>
                                </div>
                                <div className="text-right text-[10px] text-slate-400 whitespace-nowrap">
                                  <time>{new Date(upd.createdAt).toLocaleDateString()}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No updates have been posted for this campaign yet.</p>
                )}
              </div>

            </div>

            {/* Right side: Funding Progress Board & Donation system */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              
              {/* Funding Progress Board */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-premium space-y-5">
                <div>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-black text-slate-900">৳{campaign.raisedAmount.toLocaleString()}</h2>
                    <span className="text-xs text-slate-400 font-semibold">raised of ৳{campaign.loanAmountRequired.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="progress-bar-fill h-full rounded-full bg-green-600"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Backers</p>
                    <p className="text-base font-extrabold text-slate-800">
                      {campaign.contributions?.length || 0} Donors
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Funding Progress</p>
                    <p className="text-base font-extrabold text-green-600">{percent}%</p>
                  </div>
                </div>

                {remaining > 0 ? (
                  <div className="rounded-lg bg-green-50/50 border border-green-100 p-3 text-center">
                    <p className="text-xs text-green-800 font-medium">
                      ৳{remaining.toLocaleString()} is needed to complete this loan case.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                    <p className="text-xs text-blue-800 font-bold">
                      Fully Funded! Awaiting disbursement or repayment tracking.
                    </p>
                  </div>
                )}
              </div>

              {/* Donation Form modal/flow */}
              {campaign.status === "ACTIVE_FUNDING" && remaining > 0 ? (
                <ContributionForm
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                  remainingAmount={remaining}
                  userId={userId}
                  settings={settings}
                />
              ) : (
                <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 text-center text-slate-500 shadow-xs">
                  <p className="text-xs font-semibold">
                    Contributions are closed for this campaign.
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Status: {campaign.status.replace("_", " ")}
                  </p>
                </div>
              )}

              {/* Backer List */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Donor Backers ({campaign.contributions?.length || 0})
                </h4>
                {campaign.contributions && campaign.contributions.length > 0 ? (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {campaign.contributions.map((con: any) => (
                      <div key={con.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {con.donor?.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{con.donor?.name}</span>
                        </div>
                        <span className="text-xs font-bold text-green-600">৳{con.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Be the first to back this verified case!</p>
                )}
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
