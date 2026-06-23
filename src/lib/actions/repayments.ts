"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function disburseLoan(
  campaignId: string,
  amount: number,
  adminId?: string,
  adminEmail?: string
) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    // Update status to DISBURSED, set disbursedAmount
    const updatedCampaign = await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: "REPAYMENT_ACTIVE", // Activates repayment tracking
        disbursedAmount: amount,
      },
    });

    // Post automatic update
    await db.campaignUpdate.create({
      data: {
        campaignId,
        title: "Loan Funds Disbursed",
        content: `Alhamdulillah! The interest-free loan of ৳${amount} has been successfully disbursed to the borrower. The repayment phase has commenced.`,
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail || "Admin",
        action: "LOAN_DISBURSE",
        details: `Disbursed ৳${amount} to campaign "${campaign.title}"`,
      },
    });

    // Create notifications for donors who backed this campaign
    const donorContributions = await db.contribution.findMany({
      where: { campaignId, status: "APPROVED" },
      select: { donorId: true },
      distinct: ["donorId"],
    });

    for (const donor of donorContributions) {
      await db.notification.create({
        data: {
          userId: donor.donorId,
          title: "Loan Disbursed",
          message: `The loan for "${campaign.title}" has been successfully disbursed to the borrower. You can now track repayment progress.`,
        },
      });
    }

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaign.slug}`);
    revalidatePath("/admin/campaigns");

    return { success: true };
  } catch (error: any) {
    console.error("Error disbursing loan:", error);
    return { success: false, error: error.message || "Failed to disburse loan" };
  }
}

export async function recordRepayment(
  campaignId: string,
  amount: number,
  repaymentDate: Date,
  notes?: string,
  adminId?: string,
  adminEmail?: string
) {
  try {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return { success: false, error: "Campaign not found" };

    // Get all approved contributions
    const contributions = await db.contribution.findMany({
      where: { campaignId, status: "APPROVED" },
      select: { id: true, donorId: true, amount: true },
    });

    const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0);

    // 1. Create campaign-level repayment (no donorId — this is the master record)
    await db.repayment.create({
      data: {
        campaignId,
        amount,
        repaymentDate,
        notes,
      },
    });

    // 2. Create per-donor split repayments
    for (const contribution of contributions) {
      const donorShare =
        totalRaised > 0
          ? Math.round((contribution.amount / totalRaised) * amount * 100) / 100
          : 0;

      if (donorShare <= 0) continue;

      const receiptCount = await db.repaymentReceipt.count();
      const receiptNumber = `RPY-${String(receiptCount + 1).padStart(5, "0")}`;

      await db.repayment.create({
        data: {
          campaignId,
          contributionId: contribution.id,
          donorId: contribution.donorId,
          amount: donorShare,
          repaymentDate,
          notes: notes ? `${notes} (auto-split)` : "Auto-split",
          releasedBy: adminId,
          receipt: {
            create: { receiptNumber },
          },
        },
      });

      await db.notification.create({
        data: {
          userId: contribution.donorId,
          title: "Repayment Released 🎉",
          message: `৳${donorShare.toLocaleString()} from "${campaign.title}" has been credited. Receipt: ${receiptNumber}.`,
        },
      });
    }

    // 3. Update campaign totalRepaid
    const newRepaidAmount = Number(campaign.totalRepaid) + amount;
    const disbursed = Number(campaign.disbursedAmount) || Number(campaign.loanAmountRequired);
    const isCompleted = newRepaidAmount >= disbursed;

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        totalRepaid: newRepaidAmount,
        status: isCompleted ? "COMPLETED" : campaign.status,
      },
    });

    // 4. Post public update
    await db.campaignUpdate.create({
      data: {
        campaignId,
        title: `Repayment Received: ৳${amount.toLocaleString()}`,
        content: `A repayment of ৳${amount.toLocaleString()} has been received. ${notes ?? ""} Total repaid: ৳${newRepaidAmount.toLocaleString()} of ৳${disbursed.toLocaleString()}.`,
      },
    });

    // 5. Audit log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail ?? "Admin",
        action: "REPAYMENT_RECORD",
        details: `Recorded ৳${amount} repayment for "${campaign.title}" — split across ${contributions.length} donors.`,
      },
    });

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaign.slug}`);
    revalidatePath("/admin/campaigns");
    revalidatePath("/donor/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Error recording repayment:", error);
    return { success: false, error: error.message || "Failed to record repayment" };
  }
}
export async function addCampaignUpdate(
  campaignId: string,
  title: string,
  content: string,
  adminId?: string,
  adminEmail?: string
) {
  try {
    const update = await db.campaignUpdate.create({
      data: {
        campaignId,
        title,
        content,
      },
    });

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: { title: true, slug: true },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: adminId,
        userEmail: adminEmail || "Admin",
        action: "CAMPAIGN_UPDATE_POST",
        details: `Posted campaign update "${title}" for campaign "${campaign?.title}"`,
      },
    });

    // Notify backers
    const donorContributions = await db.contribution.findMany({
      where: { campaignId, status: "APPROVED" },
      select: { donorId: true },
      distinct: ["donorId"],
    });

    for (const donor of donorContributions) {
      await db.notification.create({
        data: {
          userId: donor.donorId,
          title: `New Campaign Update: ${title}`,
          message: `An update was posted for "${campaign?.title}": ${content.substring(0, 80)}...`,
        },
      });
    }

    revalidatePath(`/campaigns/${campaign?.slug}`);
    revalidatePath("/admin/campaigns");

    return { success: true, update };
  } catch (error: any) {
    console.error("Error adding campaign update:", error);
    return { success: false, error: error.message || "Failed to add campaign update" };
  }
}
