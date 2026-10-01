import React from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toDateOnly } from "@/lib/schedule";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminRecipientForm from "@/components/AdminRecipientForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function EditRecipientPage({ params }: PageProps) {
  const id = (await params).id;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const recipient = await db.recipient.findUnique({ where: { id } });

  if (!recipient) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Edit Recipient
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {recipient.recipientCode} · {recipient.fullName}
            </p>
          </div>

          <AdminRecipientForm
            initialRecipient={{
              ...recipient,
              dateOfBirth: recipient.dateOfBirth ? toDateOnly(recipient.dateOfBirth) : null,
            }}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}
