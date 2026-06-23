import React from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminCampaignManage from "@/components/AdminCampaignManage";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function AdminManageCampaignPage({ params }: PageProps) {
  const id = (await params).id;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch campaign
  const campaignData = await db.campaign.findUnique({
    where: { id },
    include: { borrower: true },
  });

  if (!campaignData) {
    notFound();
  }

  // Convert decimal properties for serializability
  const serializedCampaign = {
    ...campaignData,
    loanAmountRequired: Number(campaignData.loanAmountRequired),
    raisedAmount: Number(campaignData.raisedAmount),
    disbursedAmount: Number(campaignData.disbursedAmount),
    totalRepaid: Number(campaignData.totalRepaid),
    borrower: campaignData.borrower
      ? {
          ...campaignData.borrower,
          loanAmountRequested: Number(campaignData.borrower.loanAmountRequested),
        }
      : null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Campaign Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Disburse loan funds, log customer repayments, post public timeline updates, or review internal files.
            </p>
          </div>

          <AdminCampaignManage
            campaign={serializedCampaign}
            adminId={session.user.id}
            adminEmail={session.user.email}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}
