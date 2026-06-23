"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to convert Prisma Decimals to standard JS Numbers
function serializeContribution(c: any) {
  if (!c) return null;
  return {
    ...c,
    amount: Number(c.amount),
    campaign: c.campaign
      ? {
          ...c.campaign,
          loanAmountRequired: Number(c.campaign.loanAmountRequired),
          raisedAmount: Number(c.campaign.raisedAmount),
        }
      : null,
    receipt: c.receipt
      ? {
          ...c.receipt,
        }
      : null,
  };
}

interface SubmitContributionInput {
  amount: number;
  paymentMethod: string; // "bkash" | "nagad" | "rocket" | "bank_transfer"
  transactionId: string;
  senderNumber: string;
  paymentDate: Date;
  slipUrl: string;
  campaignId: string;
  donorId: string;
}

export async function submitContribution(data: SubmitContributionInput) {
  try {
    // 1. Create the Contribution in PENDING state
    const contribution = await db.contribution.create({
      data: {
        amount: data.amount,
        status: "PENDING",
        campaignId: data.campaignId,
        donorId: data.donorId,
      },
    });

    // 2. Create the PaymentProof
    await db.paymentProof.create({
      data: {
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        senderNumber: data.senderNumber,
        paymentDate: data.paymentDate,
        slipUrl: data.slipUrl,
        contributionId: contribution.id,
      },
    });

    // 3. Create Notification for Donor
    await db.notification.create({
      data: {
        userId: data.donorId,
        title: "Contribution Submitted",
        message: "Your contribution has been submitted successfully and is awaiting verification by our team.",
      },
    });

    revalidatePath("/donor/dashboard");
    
    return { success: true, contributionId: contribution.id };
  } catch (error: any) {
    console.error("Error submitting contribution:", error);
    return { success: false, error: error.message || "Failed to submit contribution" };
  }
}

export async function getDonorContributions(donorId: string) {
  try {
    const contributions = await db.contribution.findMany({
      where: { donorId },
      include: {
        campaign: {
          select: { title: true, slug: true, status: true },
        },
        paymentProof: true,
        receipt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return contributions.map(serializeContribution);
  } catch (error) {
    console.error("Error fetching donor contributions:", error);
    return [];
  }
}

export async function getPendingContributions() {
  try {
    const contributions = await db.contribution.findMany({
      where: { status: "PENDING" },
      include: {
        donor: {
          select: { name: true, email: true },
        },
        campaign: {
          select: { title: true, slug: true },
        },
        paymentProof: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return contributions.map(serializeContribution);
  } catch (error) {
    console.error("Error fetching pending contributions:", error);
    return [];
  }
}

export async function approveContribution(
  contributionId: string,
  adminId: string,
  adminEmail: string
) {
  try {
    // 1. Fetch contribution
    const contribution = await db.contribution.findUnique({
      where: { id: contributionId },
      include: {
        campaign: true,
        donor: true,
        paymentProof: true,
      },
    });

    if (!contribution) {
      return { success: false, error: "Contribution not found" };
    }

    if (contribution.status !== "PENDING") {
      return { success: false, error: "Contribution is not in pending status" };
    }

    // 2. Update contribution status to APPROVED
    await db.contribution.update({
      where: { id: contributionId },
      data: { status: "APPROVED" },
    });

    // 3. Recalculate campaign raised amount
    const campaignId = contribution.campaignId;
    const approvedSums = await db.contribution.aggregate({
      where: {
        campaignId,
        status: "APPROVED",
      },
      _sum: {
        amount: true,
      },
    });

    const newRaisedAmount = Number(approvedSums._sum.amount || 0);
    
    // Check if fully funded
    const targetAmount = Number(contribution.campaign.loanAmountRequired);
    const isFullyFunded = newRaisedAmount >= targetAmount;
    
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        raisedAmount: newRaisedAmount,
        status: isFullyFunded ? "FULLY_FUNDED" : contribution.campaign.status,
      },
    });

    // 4. Generate Donation Receipt
    const receiptNumber = `GL-REC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await db.receipt.create({
      data: {
        receiptNumber,
        contributionId,
      },
    });

    // 5. Create Notification for Donor
    await db.notification.create({
      data: {
        userId: contribution.donorId,
        title: "Contribution Approved ✓",
        message: `Your contribution of ৳${Number(contribution.amount)} for "${contribution.campaign.title}" has been verified and approved. Thank you!`,
      },
    });

    // 6. Write Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail,
        action: "CONTRIBUTION_APPROVE",
        details: `Approved contribution ID ${contribution.id} of ৳${Number(contribution.amount)} by donor "${contribution.donor.name}" (${contribution.donor.email})`,
      },
    });

    revalidatePath("/admin/contributions");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/campaigns/${contribution.campaign.slug}`);
    revalidatePath("/donor/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error approving contribution:", error);
    return { success: false, error: error.message || "Failed to approve contribution" };
  }
}

export async function rejectContribution(
  contributionId: string,
  reason: string,
  adminId: string,
  adminEmail: string
) {
  try {
    const contribution = await db.contribution.findUnique({
      where: { id: contributionId },
      include: {
        campaign: true,
        donor: true,
      },
    });

    if (!contribution) {
      return { success: false, error: "Contribution not found" };
    }

    if (contribution.status !== "PENDING") {
      return { success: false, error: "Contribution is not in pending status" };
    }

    // Update contribution status to REJECTED
    await db.contribution.update({
      where: { id: contributionId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
      },
    });

    // Create Notification for Donor
    await db.notification.create({
      data: {
        userId: contribution.donorId,
        title: "Contribution Rejected ✗",
        message: `Your contribution of ৳${Number(contribution.amount)} for "${contribution.campaign.title}" was rejected. Reason: ${reason}`,
      },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail,
        action: "CONTRIBUTION_REJECT",
        details: `Rejected contribution ID ${contribution.id} of ৳${Number(contribution.amount)} by donor "${contribution.donor.name}" (${contribution.donor.email}). Reason: ${reason}`,
      },
    });

    revalidatePath("/admin/contributions");
    revalidatePath("/admin/dashboard");
    revalidatePath("/donor/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting contribution:", error);
    return { success: false, error: error.message || "Failed to reject contribution" };
  }
}
