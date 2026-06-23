"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  try {
    let settings = await db.settings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await db.settings.create({
        data: {
          id: "singleton",
          organizationName: "Goodly Loan",
          bkashNumber: "01700000000",
          nagadNumber: "01800000000",
          rocketNumber: "01900000000",
          bankName: "Islami Bank Bangladesh PLC",
          accountName: "Goodly Loan Foundation",
          accountNumber: "20501234567890123",
          contactEmail: "info@goodlyloan.org",
          contactPhone: "+8801700000000",
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}

interface UpdateSettingsInput {
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  organizationName: string;
  contactEmail?: string;
  contactPhone?: string;
  adminId?: string;
  adminEmail?: string;
}

export async function updateSettings(data: UpdateSettingsInput) {
  try {
    const settings = await db.settings.upsert({
      where: { id: "singleton" },
      update: {
        bkashNumber: data.bkashNumber,
        nagadNumber: data.nagadNumber,
        rocketNumber: data.rocketNumber,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        organizationName: data.organizationName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      },
      create: {
        id: "singleton",
        bkashNumber: data.bkashNumber,
        nagadNumber: data.nagadNumber,
        rocketNumber: data.rocketNumber,
        bankName: data.bankName,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        organizationName: data.organizationName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
      },
    });

    await db.auditLog.create({
      data: {
        userId: data.adminId,
        userEmail: data.adminEmail || "Admin",
        action: "SETTINGS_UPDATE",
        details: `Updated platform settings and payment configurations`,
      },
    });

    revalidatePath("/admin/settings");
    return { success: true, settings };
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return { success: false, error: error.message || "Failed to update settings" };
  }
}

export async function getAuditLogs() {
  try {
    return await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return [];
  }
}

export async function getAdminDashboardStats() {
  try {
    const totalDonors = await db.user.count({
      where: { role: "DONOR" },
    });

    const totalCampaigns = await db.campaign.count();

    const activeCampaigns = await db.campaign.count({
      where: { status: "ACTIVE_FUNDING" },
    });

    const contributionAggregate = await db.contribution.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });
    const totalFundsRaised = Number(contributionAggregate._sum.amount || 0);

    const campaignDisburseAggregate = await db.campaign.aggregate({
      _sum: { disbursedAmount: true },
    });
    const totalDisbursed = Number(campaignDisburseAggregate._sum.disbursedAmount || 0);

    const campaignRepaidAggregate = await db.campaign.aggregate({
      _sum: { totalRepaid: true },
    });
    const totalFundsRepaid = Number(campaignRepaidAggregate._sum.totalRepaid || 0);

    const pendingContributions = await db.contribution.count({
      where: { status: "PENDING" },
    });

    const repaymentRate =
      totalDisbursed > 0
        ? Math.round((totalFundsRepaid / totalDisbursed) * 100)
        : 100;

    return {
      totalDonors,
      totalCampaigns,
      activeCampaigns,
      totalFundsRaised,
      totalFundsRepaid,
      pendingContributions,
      repaymentRate,
    };
  } catch (error) {
    console.error("Error getting admin dashboard stats:", error);
    return {
      totalDonors: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalFundsRaised: 0,
      totalFundsRepaid: 0,
      pendingContributions: 0,
      repaymentRate: 100,
    };
  }
}

export async function getDonorDashboardStats(userId: string) {
  try {
    const [
      totalContributionsResult,
      campaignsSupported,
      activeCampaignsSupported,
      completedCampaignsSupported,
      repaymentResult,
    ] = await Promise.all([
      db.contribution.aggregate({
        where: { donorId: userId, status: "APPROVED" },
        _sum: { amount: true },
      }),
      db.contribution.count({
        where: { donorId: userId, status: "APPROVED" },
      }),
      db.contribution.count({
        where: {
          donorId: userId,
          status: "APPROVED",
          campaign: { status: "REPAYMENT_ACTIVE" },
        },
      }),
      db.contribution.count({
        where: {
          donorId: userId,
          status: "APPROVED",
          campaign: { status: "COMPLETED" },
        },
      }),
      db.repayment.aggregate({
        where: { donorId: userId },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalContributions: totalContributionsResult._sum.amount ?? 0,
      campaignsSupported,
      activeCampaignsSupported,
      completedCampaignsSupported,
      totalRepaidReceived: repaymentResult._sum.amount ?? 0,
    };
  } catch (error) {
    console.error("Error getting donor dashboard stats:", error);
    return {
      totalContributions: 0,
      campaignsSupported: 0,
      activeCampaignsSupported: 0,
      completedCampaignsSupported: 0,
      totalRepaidReceived: 0,
    };
  }
}

export async function getDonorNotifications(userId: string) {
  try {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    await db.notification.update({
      where: { id },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateDonorProfile(userId: string, name: string) {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: { name },
    });
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile" };
  }
}