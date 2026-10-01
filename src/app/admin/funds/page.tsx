import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getFundLedger, getFundSummary } from "@/lib/actions/funds";
import { formatDate, formatTaka, DONATION_TYPES } from "@/lib/schedule";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowDownLeft, ArrowUpRight, Coins, FileSpreadsheet, HeartHandshake, History, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

const LEDGER_PAGE_SIZE = 100;

const fundClass: Record<string, string> = {
  QARD_HASANA: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SADAQAH: "bg-green-100 text-green-800 border-green-200",
  OPERATIONAL: "bg-amber-100 text-amber-800 border-amber-200",
};

function Row({ label, value, sign }: { label: string; value: number; sign?: "+" | "−" }) {
  return (
    <div className="flex justify-between text-xs">
      <dt className="text-slate-500 font-medium">{label}</dt>
      <dd className="font-bold text-slate-800 whitespace-nowrap">
        {sign && <span className="text-slate-400 mr-1">{sign}</span>}
        {formatTaka(value)}
      </dd>
    </div>
  );
}

function Balance({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-baseline border-t border-slate-100 pt-3">
      <dt className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{label}</dt>
      <dd className={`text-xl font-black whitespace-nowrap ${value < 0 ? "text-rose-600" : "text-slate-900"}`}>
        {formatTaka(value)}
      </dd>
    </div>
  );
}

export default async function AdminFundsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [funds, ledger] = await Promise.all([getFundSummary(), getFundLedger()]);
  const recent = ledger.slice(0, LEDGER_PAGE_SIZE);
  const overdrawn = funds.qard.balance < 0 || funds.sadaqah.balance < 0;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Fund Balances
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Money received from donors against money given to recipients. Each fund is tracked on its own and never mixed.
              </p>
            </div>

            <a
              href="/api/admin/funds/export"
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Ledger (Excel/CSV)</span>
            </a>
          </div>

          {overdrawn && (
            <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800 font-medium">
              A fund shows a negative balance: more has been given out than was recorded as received. Check that every
              donation has been entered under the right fund.
            </div>
          )}

          {/* Funds */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Qard Hasana Fund</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Loan capital — lent, repaid and lent again</p>
                </div>
              </div>
              <dl className="space-y-2">
                <Row label="Received from donors" value={funds.qard.received} sign="+" />
                <Row label="Repaid by recipients" value={funds.qard.repaid} sign="+" />
                <Row label="Lent to recipients" value={funds.qard.lent} sign="−" />
                <Row label="Returned to donors" value={funds.qard.returnedToDonors} sign="−" />
                <Balance label="Available to lend" value={funds.qard.balance} />
              </dl>
              <dl className="space-y-2 rounded-lg bg-slate-50 border border-slate-100 p-3">
                <Row label="Out with recipients (not yet repaid)" value={funds.qard.withRecipients} />
                <Row label="Held on behalf of donors" value={funds.qard.owedToDonors} />
              </dl>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Sadaqah Fund</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Gifts — given once, not repaid</p>
                </div>
              </div>
              <dl className="space-y-2">
                <Row label="Received from donors" value={funds.sadaqah.received} sign="+" />
                <Row label="Given to recipients" value={funds.sadaqah.given} sign="−" />
                <Balance label="Available to give" value={funds.sadaqah.balance} />
              </dl>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Operational Fund</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Running costs — never used for loans or gifts</p>
                </div>
              </div>
              <dl className="space-y-2">
                <Balance label="Received from donors" value={funds.operational.received} />
              </dl>
              <p className="text-[11px] text-slate-400">
                Spending from this fund (salaries, fees, hosting) is not recorded here yet, so this is the total received, not a balance.
              </p>
            </div>

          </div>

          {/* Ledger */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <History className="h-5 w-5 text-slate-500" />
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Money Movements ({ledger.length})
              </h3>
            </div>

            {recent.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="px-4 py-2.5 text-left font-bold">Date</th>
                        <th className="px-4 py-2.5 text-left font-bold">Movement</th>
                        <th className="px-4 py-2.5 text-left font-bold">Fund</th>
                        <th className="px-4 py-2.5 text-left font-bold">Donor / Recipient</th>
                        <th className="px-4 py-2.5 text-right font-bold">Money In</th>
                        <th className="px-4 py-2.5 text-right font-bold">Money Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {recent.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{formatDate(entry.date)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {entry.direction === "IN" ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-800">{entry.label}</span>
                            </div>
                            {entry.detail && <p className="text-[10px] text-slate-400 mt-0.5 ml-5">{entry.detail}</p>}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${fundClass[entry.fund] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
                              {DONATION_TYPES[entry.fund] ?? entry.fund}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/admin/${entry.partyType === "donor" ? "donors" : "recipients"}/${entry.partyId}`}
                              className="font-semibold text-slate-800 hover:text-green-700"
                            >
                              {entry.partyName}
                            </Link>
                            <span className="ml-2 font-mono text-[10px] text-slate-400">{entry.partyCode}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-green-700 whitespace-nowrap">
                            {entry.direction === "IN" ? formatTaka(entry.amount) : ""}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                            {entry.direction === "OUT" ? formatTaka(entry.amount) : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ledger.length > recent.length && (
                  <p className="text-[11px] text-slate-400 text-center">
                    Showing the latest {recent.length} of {ledger.length}. Export the ledger for the full history.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No money recorded yet. Add a donor and record what they gave to get started.
              </p>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
