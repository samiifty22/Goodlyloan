import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDonors } from "@/lib/actions/donors";
import { formatDate, formatTaka } from "@/lib/schedule";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, Search, Users, Coins, HeartHandshake, Undo2, Landmark, Wrench, Eye } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AdminDonorsPage({ searchParams }: PageProps) {
  const q = (await searchParams).q?.trim() || "";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const donors = await getDonors(q);

  const totals = donors.reduce(
    (acc, d) => ({
      qardGiven: acc.qardGiven + d.summary.qardGiven,
      qardReturned: acc.qardReturned + d.summary.qardReturned,
      qardOwed: acc.qardOwed + d.summary.qardOwed,
      sadaqahGiven: acc.sadaqahGiven + d.summary.sadaqahGiven,
      operationalGiven: acc.operationalGiven + d.summary.operationalGiven,
    }),
    { qardGiven: 0, qardReturned: 0, qardOwed: 0, sadaqahGiven: 0, operationalGiven: 0 }
  );

  const metrics = [
    { label: q ? "Matching Donors" : "Donors", value: donors.length.toString(), icon: Users, tone: "bg-green-50 text-green-600" },
    { label: "Qard Hasana Received", value: formatTaka(totals.qardGiven), icon: Coins, tone: "bg-green-50 text-green-600" },
    { label: "Returned to Donors", value: formatTaka(totals.qardReturned), icon: Undo2, tone: "bg-green-50 text-green-600" },
    { label: "Still Held for Donors", value: formatTaka(totals.qardOwed), icon: Landmark, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Sadaqah Received", value: formatTaka(totals.sadaqahGiven), icon: HeartHandshake, tone: "bg-green-50 text-green-600" },
    { label: "Operational Support", value: formatTaka(totals.operationalGiven), icon: Wrench, tone: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Donors
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track who gave money to GoodlyLoan, what it is for, and how much Qard Hasana has been returned.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/funds"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Landmark className="h-4 w-4" />
                <span>Fund Balances</span>
              </Link>
              <Link
                href="/admin/donors/new"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Donor</span>
              </Link>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center space-x-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${m.tone}`}>
                  <m.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{m.label}</p>
                  <p className="text-base font-black text-slate-800 truncate">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <form action="/admin/donors" className="flex items-center gap-2">
            <div className="relative flex-grow max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by name, donor ID, phone, email or organization..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Search
            </button>
            {q && (
              <Link href="/admin/donors" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                Clear
              </Link>
            )}
          </form>

          {/* List Board */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-premium">
            {donors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="px-6 py-3 text-left">Donor</th>
                      <th className="px-6 py-3 text-right">Qard Hasana</th>
                      <th className="px-6 py-3 text-right">Returned</th>
                      <th className="px-6 py-3 text-right">Still Held</th>
                      <th className="px-6 py-3 text-right">Sadaqah</th>
                      <th className="px-6 py-3 text-right">Operational</th>
                      <th className="px-6 py-3 text-left">Last Gave</th>
                      <th className="px-6 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {donors.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 rounded px-1.5 py-0.5">
                              {d.donorCode}
                            </span>
                            {d.status === "INACTIVE" && (
                              <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-800 mt-1 max-w-[220px] truncate">{d.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {[d.phoneNumber, d.organization].filter(Boolean).join(" · ")}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatTaka(d.summary.qardGiven)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700 whitespace-nowrap">{formatTaka(d.summary.qardReturned)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatTaka(d.summary.qardOwed)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatTaka(d.summary.sadaqahGiven)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-700 whitespace-nowrap">{formatTaka(d.summary.operationalGiven)}</td>

                        <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-semibold">
                          {d.summary.lastDonation ? formatDate(d.summary.lastDonation) : <span className="text-slate-400 font-normal">—</span>}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/admin/donors/${d.id}`}
                            className="inline-flex items-center space-x-1 border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Open</span>
                          </Link>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <Users className="h-10 w-10 text-slate-400 mx-auto" />
                <p className="text-slate-500 font-semibold text-sm">
                  {q ? `No donors match "${q}".` : "No donors registered yet."}
                </p>
                {!q && (
                  <Link
                    href="/admin/donors/new"
                    className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 shadow-sm"
                  >
                    Add first donor
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
