import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getScheduleInstallments } from "@/lib/actions/recipients";
import { formatDate, formatTaka, todayDateOnly, type InstallmentStatus } from "@/lib/schedule";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CalendarPlus, ChevronLeft, ChevronRight, FileSpreadsheet, AlertTriangle } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    month?: string; // "YYYY-MM"
  }>;
}

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const chipClass: Record<InstallmentStatus, string> = {
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-800 border-amber-200",
  OVERDUE: "bg-rose-50 text-rose-800 border-rose-200",
  UPCOMING: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

const legend: { status: InstallmentStatus; label: string }[] = [
  { status: "UPCOMING", label: "Upcoming" },
  { status: "OVERDUE", label: "Overdue" },
  { status: "PARTIAL", label: "Part paid" },
  { status: "PAID", label: "Paid" },
];

// "YYYY-MM" shifted by a number of months
function shiftMonth(month: string, by: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + by, 1)).toISOString().slice(0, 7);
}

export default async function AdminSchedulePage({ searchParams }: PageProps) {
  const requested = (await searchParams).month;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const today = todayDateOnly();
  const month = requested && /^\d{4}-(0[1-9]|1[0-2])$/.test(requested) ? requested : today.slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);

  const [monthItems, pastDue] = await Promise.all([
    getScheduleInstallments({ from: `${month}-01`, to: `${shiftMonth(month, 1)}-01` }),
    getScheduleInstallments({ to: today }),
  ]);
  const overdue = pastDue.filter((i) => i.status === "OVERDUE");

  const byDay = new Map<string, typeof monthItems>();
  for (const item of monthItems) {
    byDay.set(item.dueDate, [...(byDay.get(item.dueDate) ?? []), item]);
  }

  // Calendar cells: leading blanks so day 1 lands under its weekday
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const leadingBlanks = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthDue = monthItems.reduce((sum, i) => sum + i.amount, 0);
  const monthReceived = monthItems.reduce((sum, i) => sum + Math.min(i.paidAmount, i.amount), 0);
  const overdueTotal = overdue.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

  const monthLabel = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Repayment Calendar
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Every Qard Hasana installment by due date. Export to add them to Google Calendar, Outlook or your phone.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/api/admin/schedule/export?format=ics"
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <CalendarPlus className="h-4 w-4" />
                <span>Add All to Calendar (.ics)</span>
              </a>
              <a
                href="/api/admin/schedule/export?format=csv"
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4.5 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel/CSV</span>
              </a>
            </div>
          </div>

          {/* Month totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: `Due in ${monthLabel}`, value: formatTaka(monthDue) },
              { label: "Received", value: formatTaka(monthReceived) },
              { label: "Still to Collect", value: formatTaka(monthDue - monthReceived) },
              { label: `All Overdue (${overdue.length})`, value: formatTaka(overdueTotal), alert: overdue.length > 0 },
            ].map((t) => (
              <div key={t.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.label}</p>
                <p className={`text-base font-black ${t.alert ? "text-rose-600" : "text-slate-800"}`}>{t.value}</p>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-premium overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/schedule?month=${shiftMonth(month, -1)}`}
                  title="Previous month"
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 p-1.5 rounded transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <h2 className="text-sm font-extrabold text-slate-800 w-36 text-center">{monthLabel}</h2>
                <Link
                  href={`/admin/schedule?month=${shiftMonth(month, 1)}`}
                  title="Next month"
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 p-1.5 rounded transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/admin/schedule" className="text-xs font-semibold text-green-600 hover:text-green-700 ml-1">
                  Today
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {legend.map((l) => (
                  <span key={l.status} className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${chipClass[l.status]}`}>
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {cells.map((day, index) => {
                    const date = day ? `${month}-${String(day).padStart(2, "0")}` : null;
                    const items = date ? byDay.get(date) ?? [] : [];
                    const isToday = date === today;

                    return (
                      <div
                        key={index}
                        className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 space-y-1 ${day ? "bg-white" : "bg-slate-50/60"}`}
                      >
                        {day && (
                          <p
                            className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                              isToday ? "bg-green-600 text-white" : "text-slate-500"
                            }`}
                          >
                            {day}
                          </p>
                        )}
                        {items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/admin/recipients/${item.recipientId}`}
                            title={`${item.recipientName} (${item.recipientCode}) — installment ${item.installmentNumber} of ${item.installmentCount}`}
                            className={`block rounded border px-1.5 py-1 text-[10px] leading-tight hover:brightness-95 transition ${chipClass[item.status]}`}
                          >
                            <span className="block font-bold truncate">{item.recipientName}</span>
                            <span className="block font-semibold">{formatTaka(item.amount)}</span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Overdue list */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <AlertTriangle className={`h-5 w-5 ${overdue.length > 0 ? "text-rose-500" : "text-slate-400"}`} />
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Overdue Installments ({overdue.length})
              </h3>
            </div>

            {overdue.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5 text-left font-bold">Recipient</th>
                      <th className="px-4 py-2.5 text-left font-bold">Phone</th>
                      <th className="px-4 py-2.5 text-center font-bold">Installment</th>
                      <th className="px-4 py-2.5 text-left font-bold">Was Due</th>
                      <th className="px-4 py-2.5 text-right font-bold">Still Owed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {overdue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/recipients/${item.recipientId}`} className="font-semibold text-slate-800 hover:text-green-700">
                            {item.recipientName}
                          </Link>
                          <span className="ml-2 font-mono text-[10px] text-slate-400">{item.recipientCode}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{item.recipientPhone}</td>
                        <td className="px-4 py-2.5 text-center text-slate-600 whitespace-nowrap">
                          {item.installmentNumber} of {item.installmentCount}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-rose-600 whitespace-nowrap">{formatDate(item.dueDate)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatTaka(item.amount - item.paidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">No overdue installments.</p>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
