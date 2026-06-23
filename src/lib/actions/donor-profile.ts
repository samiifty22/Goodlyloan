"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getDonorProfile(userId: string) {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
            },
        });

        let paymentInfo = null;
        try {
            paymentInfo = await db.DonorPaymentInfo.findUnique({
                where: { userId },
            });
        } catch (e) {
            console.warn("DonorPaymentInfo table not available yet. Run: npx prisma db push");
        }

        return { user, paymentInfo };
    } catch (error) {
        console.error("Error fetching donor profile:", error);
        return { user: null, paymentInfo: null };
    }
}

export async function upsertDonorPaymentInfo(
    userId: string,
    data: {
        bkashNumber?: string;
        nagadNumber?: string;
        rocketNumber?: string;
        bankName?: string;
        accountName?: string;
        accountNumber?: string;
        branchName?: string;
        routingNumber?: string;
    }
) {
    try {
        await db.DonorPaymentInfo.upsert({
            where: { userId },
            update: {
                bkashNumber: data.bkashNumber ?? null,
                nagadNumber: data.nagadNumber ?? null,
                rocketNumber: data.rocketNumber ?? null,
                bankName: data.bankName ?? null,
                accountName: data.accountName ?? null,
                accountNumber: data.accountNumber ?? null,
                branchName: data.branchName ?? null,
                routingNumber: data.routingNumber ?? null,
            },
            create: {
                userId,
                bkashNumber: data.bkashNumber ?? null,
                nagadNumber: data.nagadNumber ?? null,
                rocketNumber: data.rocketNumber ?? null,
                bankName: data.bankName ?? null,
                accountName: data.accountName ?? null,
                accountNumber: data.accountNumber ?? null,
                branchName: data.branchName ?? null,
                routingNumber: data.routingNumber ?? null,
            },
        });

        revalidatePath("/donor/profile");
        return { success: true };
    } catch (error: any) {
        console.error("Error saving payment info:", error);
        return { success: false, error: error.message || "Failed to save." };
    }
}

export async function updateDonorName(userId: string, name: string) {
    try {
        if (!name.trim()) return { success: false, error: "Name cannot be empty." };

        await db.user.update({
            where: { id: userId },
            data: { name: name.trim() },
        });

        revalidatePath("/donor/profile");
        revalidatePath("/donor/dashboard");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update name." };
    }
}

export async function getDonorPaymentInfoForAdmin(donorId: string) {
    try {
        return await db.DonorPaymentInfo.findUnique({
            where: { userId: donorId },
        });
    } catch {
        return null;
    }
}