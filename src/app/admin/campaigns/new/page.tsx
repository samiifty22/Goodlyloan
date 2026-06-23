import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/actions/campaigns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminCampaignForm from "@/components/AdminCampaignForm";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const categories = await getCategories();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Create Loan Campaign
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Initialize a new verified benevolent campaign and store borrower info internally.
            </p>
          </div>

          <AdminCampaignForm
            categories={categories}
            adminId={session.user.id}
            adminEmail={session.user.email}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}
