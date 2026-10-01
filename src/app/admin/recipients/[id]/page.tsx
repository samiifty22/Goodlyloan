import React from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getRecipient } from "@/lib/actions/recipients";
import { getFundSummary } from "@/lib/actions/funds";
import { formatDate, formatTaka, toDateOnly, todayDateOnly } from "@/lib/schedule";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DisbursementForm from "@/components/DisbursementForm";
import DisbursementCard from "@/components/DisbursementCard";
import DeleteRecordButton from "@/components/DeleteRecordButton";
import { ArrowLeft, CalendarPlus, Edit, FileSpreadsheet, Wallet } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function RecipientDetailPage({ params }: PageProps) {
  const id = (await params).id;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [recipient, funds] = await Promise.all([getRecipient(id), getFundSummary()]);

  if (!recipient) {
    notFound();
  }

  const today = todayDateOnly();
  const { summary } = recipient;
  const hasSchedule = recipient.disbursements.some((d) => d.installments.length > 0);
  const exportBase = `/api/admin/schedule/export?recipientId=${recipient.id}`;

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Phone", value: recipient.phoneNumber },
    { label: "Father's / Husband's Name", value: recipient.fatherName },
    { label: "NID Number", value: recipient.nidNumber },
    { label: "Date of Birth", value: recipient.dateOfBirth ? formatDate(recipient.dateOfBirth) : null },
    { label: "Occupation", value: recipient.occupation },
    { label: "Monthly Income", value: recipient.monthlyIncome != null ? formatTaka(recipient.monthlyIncome) : null },
    { label: "Family Members", value: recipient.familyMembers },
    { label: "Guarantor", value: [recipient.guarantorName, recipient.guarantorPhone].filter(Boolean).join(" · ") || null },
    { label: "Registered", value: formatDate(recipient.createdAt) },
  ];

  const totals = [
    { label: "Total Given", value: formatTaka(summary.totalGiven) },
    { label: "Qard Hasana", value: formatTaka(summary.qardGiven) },
    { label: "Sadaqah", value: formatTaka(summary.sadaqahGiven) },
    { label: "Repaid", value: formatTaka(summary.repaid) },
    { label: "Outstanding", value: formatTaka(summary.outstanding) },
    {
      label: `Overdue (${summary.overdueCount})`,
      value: formatTaka(summary.overdueAmount),
      alert: summary.overdueCount > 0,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          <Link href="/admin/recipients" className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All recipients</span>
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded px-2 py-0.5">
                  {recipient.recipientCode}
                </span>
                {recipient.status === "INACTIVE" && (
                  <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                    Inactive
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mt-2">
                {recipient.fullName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{recipient.address}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/recipients/${recipient.id}/edit`}
                className="inline-flex items-center space-x-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Details</span>
              </Link>
              <DeleteRecordButton kind="recipient" id={recipient.id} name={recipient.fullName} />
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {totals.map((t) => (
              <div key={t.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.label}</p>
                <p className={`text-base font-black ${t.alert ? "text-rose-600" : "text-slate-800"}`}>{t.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Profile */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Full Information
              </h3>
              <dl className="space-y-3 text-xs">
                {details.map((d) => (
                  <div key={d.label}>
                    <dt className="text-[10px] text-slate-400 font-bold uppercase">{d.label}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{d.value || <span className="text-slate-400 font-normal">—</span>}</dd>
                  </div>
                ))}
                {recipient.notes && (
                  <div>
                    <dt className="text-[10px] text-slate-400 font-bold uppercase">Internal Notes</dt>
                    <dd className="text-slate-600 mt-0.5 whitespace-pre-wrap">{recipient.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Money given and schedules */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Money Given ({recipient.disbursements.length})
                </h3>
                {hasSchedule && (
                  <div className="flex flex-wrap gap-1.5">
                    <a
                      href={`${exportBase}&format=ics`}
                      className="inline-flex items-center space-x-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition"
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      <span>All Dues to Calendar</span>
                    </a>
                    <a
                      href={`${exportBase}&format=csv`}
                      className="inline-flex items-center space-x-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Export Full Schedule</span>
                    </a>
                  </div>
                )}
              </div>

              <DisbursementForm
                recipientId={recipient.id}
                today={today}
                balances={{ QARD_HASANA: funds.qard.balance, SADAQAH: funds.sadaqah.balance }}
              />

              {recipient.disbursements.length > 0 ? (
                recipient.disbursements.map((d) => (
                  <DisbursementCard
                    key={d.id}
                    today={today}
                    disbursement={{
                      id: d.id,
                      type: d.type,
                      amount: d.amount,
                      disbursedDate: toDateOnly(d.disbursedDate),
                      purpose: d.purpose,
                      paymentMethod: d.paymentMethod,
                      notes: d.notes,
                      installments: d.installments.map((inst) => ({
                        id: inst.id,
                        installmentNumber: inst.installmentNumber,
                        dueDate: toDateOnly(inst.dueDate),
                        amount: inst.amount,
                        paidAmount: inst.paidAmount,
                        paidDate: inst.paidDate ? toDateOnly(inst.paidDate) : null,
                        notes: inst.notes,
                      })),
                    }}
                  />
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl text-center py-12 space-y-2">
                  <Wallet className="h-9 w-9 text-slate-400 mx-auto" />
                  <p className="text-slate-500 font-semibold text-sm">No money recorded for this recipient yet.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
