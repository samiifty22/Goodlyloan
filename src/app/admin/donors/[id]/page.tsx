import React from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDonor } from "@/lib/actions/donors";
import { formatDate, formatTaka, toDateOnly, todayDateOnly } from "@/lib/schedule";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DonationForm from "@/components/DonationForm";
import DonationCard from "@/components/DonationCard";
import DeleteRecordButton from "@/components/DeleteRecordButton";
import { ArrowLeft, Edit, Wallet } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function DonorDetailPage({ params }: PageProps) {
  const id = (await params).id;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const donor = await getDonor(id);

  if (!donor) {
    notFound();
  }

  const today = todayDateOnly();
  const { summary } = donor;

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Phone", value: donor.phoneNumber },
    { label: "Email", value: donor.email },
    { label: "Organization", value: donor.organization },
    { label: "Address", value: donor.address },
    { label: "Country", value: donor.country },
    { label: "Registered", value: formatDate(donor.createdAt) },
  ];

  const totals = [
    { label: "Total Given", value: formatTaka(summary.totalGiven) },
    { label: "Qard Hasana", value: formatTaka(summary.qardGiven) },
    { label: "Returned", value: formatTaka(summary.qardReturned) },
    { label: "Still Held", value: formatTaka(summary.qardOwed) },
    { label: "Sadaqah", value: formatTaka(summary.sadaqahGiven) },
    { label: "Operational", value: formatTaka(summary.operationalGiven) },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          <Link href="/admin/donors" className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All donors</span>
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded px-2 py-0.5">
                  {donor.donorCode}
                </span>
                {donor.status === "INACTIVE" && (
                  <span className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                    Inactive
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mt-2">
                {donor.fullName}
              </h1>
              {donor.organization && <p className="text-sm text-slate-500 mt-1">{donor.organization}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/donors/${donor.id}/edit`}
                className="inline-flex items-center space-x-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Details</span>
              </Link>
              <DeleteRecordButton kind="donor" id={donor.id} name={donor.fullName} />
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {totals.map((t) => (
              <div key={t.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.label}</p>
                <p className="text-base font-black text-slate-800">{t.value}</p>
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
                {donor.notes && (
                  <div>
                    <dt className="text-[10px] text-slate-400 font-bold uppercase">Internal Notes</dt>
                    <dd className="text-slate-600 mt-0.5 whitespace-pre-wrap">{donor.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Money received */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                Money Received ({donor.donations.length})
              </h3>

              <DonationForm donorId={donor.id} today={today} />

              {donor.donations.length > 0 ? (
                donor.donations.map((d) => (
                  <DonationCard
                    key={d.id}
                    today={today}
                    donation={{
                      id: d.id,
                      receiptNumber: d.receiptNumber,
                      type: d.type,
                      amount: d.amount,
                      receivedDate: toDateOnly(d.receivedDate),
                      paymentMethod: d.paymentMethod,
                      reference: d.reference,
                      notes: d.notes,
                      returns: d.returns.map((r) => ({
                        id: r.id,
                        amount: r.amount,
                        returnedDate: toDateOnly(r.returnedDate),
                        paymentMethod: r.paymentMethod,
                        notes: r.notes,
                      })),
                    }}
                  />
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl text-center py-12 space-y-2">
                  <Wallet className="h-9 w-9 text-slate-400 mx-auto" />
                  <p className="text-slate-500 font-semibold text-sm">No money recorded from this donor yet.</p>
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
