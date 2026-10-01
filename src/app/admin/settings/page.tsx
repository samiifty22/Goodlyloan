import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/actions/settings";
import { getStorageUsage } from "@/lib/actions/system";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import AdminDataProtection from "@/components/AdminDataProtection";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [settings, usage] = await Promise.all([getSettings(), getStorageUsage()]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              System Settings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure organizational contact channels and payment numbers for Qard Hasan loans.
            </p>
          </div>

          <AdminSettingsForm
            initialSettings={settings}
            adminId={session.user.id}
            adminEmail={session.user.email}
          />

          <div className="border-b border-slate-200 pb-4 pt-4">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Data Protection</h2>
            <p className="text-sm text-slate-500 mt-1">
              Keep a copy of your records and keep the admin account secure.
            </p>
          </div>

          <AdminDataProtection usage={usage} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
