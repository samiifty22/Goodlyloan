import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminRecipientForm from "@/components/AdminRecipientForm";

export const dynamic = "force-dynamic";

export default async function NewRecipientPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">

          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Add Recipient
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Register a person who receives Qard Hasana or Sadaqah. You can record the money given on the next screen.
            </p>
          </div>

          <AdminRecipientForm />

        </div>
      </main>

      <Footer />
    </div>
  );
}
