import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminDashboardStats, getAuditLogs } from "@/lib/actions/settings";
import { getPendingContributions } from "@/lib/actions/contributions";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Coins, HeartHandshake, FileCheck2, Settings, ShieldAlert, History, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Retrieve admin statistics, audit logs, and pending items
  const [stats, auditLogs, pending] = await Promise.all([
    getAdminDashboardStats(),
    getAuditLogs(),
    getPendingContributions(),
  ]);

  const recentPending = pending.slice(0, 5);
  const recentLogs = auditLogs.slice(0, 8);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Dashboard Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Admin Console
              </h1>
              <p className="text-sm text-slate-500">
                Oversee borrowing applications, verify payment proofs, record repayments, and audit configurations.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/campaigns/new"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4.5 py-2 rounded-lg text-xs transition shadow-sm"
              >
                Create Campaign
              </Link>
              <Link
                href="/admin/contributions"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4.5 py-2 rounded-lg text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <FileCheck2 className="h-4 w-4" />
                <span>Verify Contributions ({pending.length})</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Funds Raised</p>
                <p className="text-lg font-black text-slate-800">৳{stats.totalFundsRaised.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Repaid</p>
                <p className="text-lg font-black text-slate-800">৳{stats.totalFundsRepaid.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Donors</p>
                <p className="text-lg font-black text-slate-800">{stats.totalDonors}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center space-x-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Repayment Rate</p>
                <p className="text-lg font-black text-slate-800">{stats.repaymentRate}%</p>
              </div>
            </div>

          </div>

          {/* Core Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Pending Contributions quick review */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Pending Contributions ({pending.length})
                </h3>
                <Link
                  href="/admin/contributions"
                  className="text-xs text-green-600 font-bold hover:text-green-700 flex items-center gap-0.5"
                >
                  <span>Review All</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {recentPending.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5 text-left font-bold">Donor</th>
                        <th className="px-4 py-2.5 text-left font-bold">Campaign</th>
                        <th className="px-4 py-2.5 text-right font-bold">Amount</th>
                        <th className="px-4 py-2.5 text-center font-bold">Method</th>
                        <th className="px-4 py-2.5 text-center font-bold">TxID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {recentPending.map((con: any) => (
                        <tr key={con.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{con.donor?.name}</td>
                          <td className="px-4 py-2.5 text-slate-600 truncate max-w-[150px]">{con.campaign?.title}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">৳{con.amount}</td>
                          <td className="px-4 py-2.5 text-center font-bold text-slate-600 uppercase">{con.paymentProof?.paymentMethod}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-slate-500 whitespace-nowrap">{con.paymentProof?.transactionId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-6 text-center">No pending contributions requiring verification.</p>
              )}
            </div>

            {/* Audit Logs list */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                <History className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Admin Audit Logs
                </h3>
              </div>

              {recentLogs.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {recentLogs.map((log: any) => (
                    <div key={log.id} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-green-700 bg-green-50 border border-green-100 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                          {log.action.replace("_", " ")}
                        </span>
                        <time className="text-[9px] text-slate-400 font-semibold">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="text-slate-600 mt-1">{log.details}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">By: {log.userEmail}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">No admin action logs recorded.</p>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
