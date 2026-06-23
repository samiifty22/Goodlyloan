"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ── Release payment to a specific donor manually ────────────────────────────
export async function releaseDonorRepayment({
    contributionId,
    donorId,
    campaignId,
    amount,
    notes,
    adminId,
}: {
    contributionId: string;
    donorId: string;
    campaignId: string;
    amount: number;
    notes?: string;
    adminId: string;
}) {
    if (!amount || amount <= 0) {
        return { success: false, error: "Amount must be greater than 0." };
    }

    try {
        const contribution = await db.contribution.findUnique({
            where: { id: contributionId },
            include: {
                repayments: {
                    where: { donorId },
                    select: { amount: true },
                },
            },
        });

        if (!contribution) return { success: false, error: "Contribution not found." };

        const totalAlreadyRepaid = contribution.repayments.reduce(
            (sum, r) => sum + r.amount, 0
        );
        const remaining = contribution.amount - totalAlreadyRepaid;

        if (amount > remaining + 0.01) {
            return {
                success: false,
                error: `Cannot release ৳${amount.toLocaleString()}. Remaining balance is ৳${remaining.toLocaleString()}.`,
            };
        }

        // Generate receipt number
        const receiptCount = await db.repaymentReceipt.count();
        const receiptNumber = `RPY-${String(receiptCount + 1).padStart(5, "0")}`;

        // Create repayment + receipt
        const repayment = await db.repayment.create({
            data: {
                amount,
                repaymentDate: new Date(),
                notes,
                campaignId,
                contributionId,
                donorId,
                releasedBy: adminId,
                receipt: {
                    create: { receiptNumber },
                },
            },
            include: { receipt: true },
        });

        // Update campaign totalRepaid
        await db.campaign.update({
            where: { id: campaignId },
            data: { totalRepaid: { increment: amount } },
        });

        // Notify donor
        await db.notification.create({
            data: {
                userId: donorId,
                title: "Repayment Released to You 🎉",
                message: `৳${amount.toLocaleString()} has been released to your account. Receipt: ${receiptNumber}.`,
                read: false,
            },
        });

        // Audit log
        await db.auditLog.create({
            data: {
                userId: adminId,
                action: "DONOR_REPAYMENT_RELEASED",
                details: `Released ৳${amount} to donor ${donorId} for contribution ${contributionId}. Receipt: ${receiptNumber}.`,
            },
        });

        revalidatePath(`/admin/campaigns/${campaignId}/donors/${donorId}`);
        revalidatePath(`/admin/campaigns/${campaignId}`);
        revalidatePath(`/donor/dashboard`);

        return {
            success: true,
            repaymentId: repayment.id,
            receiptId: repayment.receipt?.id,
            receiptNumber,
        };
    } catch (err) {
        console.error("[releaseDonorRepayment]", err);
        return { success: false, error: "Something went wrong. Please try again." };
    }
}

// ── Data for the donor release page ────────────────────────────────────────
export async function getDonorRepaymentPageData(campaignId: string, donorId: string) {
    const contribution = await db.contribution.findFirst({
        where: { campaignId, donorId, status: "APPROVED" },
        include: {
            donor: {
                select: { id: true, name: true, email: true, image: true },
            },
            repayments: {
                where: { donorId },
                include: { receipt: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    const campaign = await db.campaign.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            title: true,
            slug: true,
            totalRepaid: true,
            loanAmountRequired: true,
            raisedAmount: true,
        },
    });

    return { contribution, campaign };
}

// ── Donor list for campaign (DonorListTab) ──────────────────────────────────
export async function getCampaignDonors(campaignId: string) {
    const contributions = await db.contribution.findMany({
        where: { campaignId, status: "APPROVED" },
        include: {
            donor: { select: { id: true, name: true, email: true } },
            repayments: {
                where: { donorId: { not: null } },
                select: { amount: true },
            },
        },
        orderBy: { createdAt: "asc" },
    });

    // Group by donorId — a donor may have contributed multiple times
    const donorMap = new Map<string, {
        contributionId: string;
        donorId: string;
        donorName: string;
        donorEmail: string;
        contributedAmount: number;
        totalRepaid: number;
    }>();

    for (const c of contributions) {
        const existing = donorMap.get(c.donor.id);
        if (existing) {
            // Merge into existing entry
            existing.contributedAmount += c.amount;
            existing.totalRepaid += c.repayments.reduce((sum, r) => sum + r.amount, 0);
        } else {
            donorMap.set(c.donor.id, {
                contributionId: c.id, // use first contribution id for the page link
                donorId: c.donor.id,
                donorName: c.donor.name,
                donorEmail: c.donor.email,
                contributedAmount: c.amount,
                totalRepaid: c.repayments.reduce((sum, r) => sum + r.amount, 0),
            });
        }
    }

    return Array.from(donorMap.values());
}
export async function getDonorRepaymentHistory(donorId: string) {
    try {
        const repayments = await db.repayment.findMany({
            where: {
                donorId,
                contributionId: { not: null },
            },
            include: {
                campaign: {
                    select: { id: true, title: true, slug: true },
                },
                receipt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return repayments.map((r) => ({
            id: r.id,
            amount: r.amount,
            notes: r.notes,
            createdAt: r.createdAt.toISOString(),
            repaymentDate: r.repaymentDate.toISOString(),
            campaign: r.campaign ?? null,
            receipt: r.receipt
                ? { id: r.receipt.id, receiptNumber: r.receipt.receiptNumber }
                : null,
        }));
    } catch (error) {
        console.error("Error fetching repayment history:", error);
        return [];
    }
}