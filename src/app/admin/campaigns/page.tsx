import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminCampaigns } from "@/lib/actions/campaigns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Coins, Eye, Edit, Settings, Plus, Sparkles, FolderHeart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const campaigns = await getAdminCampaigns();

  const statusConfig: Record<string, { label: string; class: string }> = {
    DRAFT: { label: "Draft", class: "bg-slate-100 text-slate-700 border-slate-200" },
    UNDER_VERIFICATION: { label: "Verifying", class: "bg-amber-100 text-amber-800 border-amber-200" },
    ACTIVE_FUNDING: { label: "Active", class: "bg-green-100 text-green-800 border-green-200" },
    FULLY_FUNDED: { label: "Funded", class: "bg-blue-100 text-blue-800 border-blue-200" },
    DISBURSED: { label: "Disbursed", class: "bg-purple-100 text-purple-800 border-purple-200" },
    REPAYMENT_ACTIVE: { label: "Repaying", class: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    COMPLETED: { label: "Completed ✓", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    CLOSED: { label: "Closed", class: "bg-rose-100 text-rose-800 border-rose-200" },
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Manage Campaigns
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Create new Benevolent loan cases, edit stories, view donor backers, and trigger status updates.
              </p>
            </div>
            
            <Link
              href="/admin/campaigns/new"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Create Loan Campaign</span>
            </Link>
          </div>

          {/* List Board */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-premium">
            {campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="px-6 py-3 text-left">Campaign Name</th>
                      <th className="px-6 py-3 text-left">Category</th>
                      <th className="px-6 py-3 text-right">Loan Needed</th>
                      <th className="px-6 py-3 text-right">Raised Amount</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {campaigns.map((camp: any) => {
                      const percent = Math.min(
                        Math.round((camp.raisedAmount / camp.loanAmountRequired) * 100),
                        100
                      );
                      const currentStatus = statusConfig[camp.status] || {
                        label: camp.status,
                        class: "bg-slate-100 text-slate-800",
                      };

                      return (
                        <tr key={camp.id} className="hover:bg-slate-50/50 transition">
                          
                          {/* Title */}
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800 max-w-[200px] truncate">{camp.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Slug: {camp.slug}</p>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="bg-slate-50 border border-slate-200/80 rounded px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {camp.category?.name}
                            </span>
                          </td>

                          {/* Needed */}
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            ৳{camp.loanAmountRequired.toLocaleString()}
                          </td>

                          {/* Raised */}
                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-slate-800">৳{camp.raisedAmount.toLocaleString()}</p>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{percent}% Funded</p>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${currentStatus.class}`}>
                              {currentStatus.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              
                              {/* Edit details */}
                              <Link
                                href={`/admin/campaigns/${camp.id}/edit`}
                                title="Edit Campaign"
                                className="border border-slate-200 hover:bg-slate-50 text-slate-700 p-1.5 rounded transition flex items-center justify-center cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Link>

                              {/* Manage repayments/Timeline updates */}
                              <Link
                                href={`/admin/campaigns/${camp.id}/manage`}
                                className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                <Settings className="h-3.5 w-3.5" />
                                <span>Manage</span>
                              </Link>

                              {/* View public page */}
                              <Link
                                href={`/campaigns/${camp.slug}`}
                                title="View Public Page"
                                className="border border-slate-200 hover:bg-slate-50 text-slate-700 p-1.5 rounded transition flex items-center justify-center cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>

                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <FolderHeart className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-slate-500 font-semibold text-sm">No campaigns registered yet.</p>
                <Link
                  href="/admin/campaigns/new"
                  className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 shadow-sm"
                >
                  Create first campaign case
                </Link>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
