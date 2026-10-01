"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, writeAudit } from "@/lib/admin-guard";
import { parseDateOnly, toDateOnly, DONATION_TYPES } from "@/lib/schedule";

function revalidateDonor(id?: string) {
  revalidatePath("/admin/donors");
  revalidatePath("/admin/funds");
  if (id) revalidatePath(`/admin/donors/${id}`);
}

const isDateOnly = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");

// Rolls a donor's donations up into the totals shown in lists and headers
function summarize(donations: any[]) {
  let qardGiven = 0;
  let qardReturned = 0;
  let sadaqahGiven = 0;
  let operationalGiven = 0;
  let lastDonation: string | null = null;

  for (const d of donations) {
    if (d.type === "QARD_HASANA") {
      qardGiven += d.amount;
      qardReturned += (d.returns ?? []).reduce((sum: number, r: any) => sum + r.amount, 0);
    } else if (d.type === "SADAQAH") {
      sadaqahGiven += d.amount;
    } else {
      operationalGiven += d.amount;
    }

    const received = toDateOnly(d.receivedDate);
    if (!lastDonation || received > lastDonation) lastDonation = received;
  }

  return {
    qardGiven,
    qardReturned,
    qardOwed: Math.max(qardGiven - qardReturned, 0), // still held by GoodlyLoan, returnable to the donor
    sadaqahGiven,
    operationalGiven,
    totalGiven: qardGiven + sadaqahGiven + operationalGiven,
    lastDonation,
  };
}

export interface DonorInput {
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  country?: string;
  organization?: string;
  notes?: string;
  status?: string;
}

function donorData(data: DonorInput) {
  const text = (v?: string) => v?.trim() || null;
  return {
    fullName: data.fullName.trim(),
    phoneNumber: data.phoneNumber.trim(),
    email: text(data.email),
    address: text(data.address),
    country: text(data.country),
    organization: text(data.organization),
    notes: text(data.notes),
    status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}

export async function createDonor(data: DonorInput) {
  try {
    const admin = await requireAdmin();

    if (!data.fullName?.trim() || !data.phoneNumber?.trim()) {
      return { success: false, error: "Name and phone number are required." };
    }

    // Generated ID: DN-0001, DN-0002, ... continuing from the newest record
    const latest = await db.donor.findFirst({
      orderBy: { createdAt: "desc" },
      select: { donorCode: true },
    });
    let next = (Number(latest?.donorCode.replace(/\D/g, "")) || 0) + 1;

    for (let attempt = 0; attempt < 10; attempt++) {
      const donorCode = `DN-${String(next).padStart(4, "0")}`;
      try {
        const donor = await db.donor.create({ data: { ...donorData(data), donorCode } });

        await writeAudit(admin, "DONOR_CREATE", `Created donor ${donorCode} "${donor.fullName}"`);
        revalidateDonor();
        return { success: true, id: donor.id, donorCode };
      } catch (error: any) {
        // Code already taken — try the next number
        if (error.code === "P2002") {
          next += 1;
          continue;
        }
        throw error;
      }
    }

    return { success: false, error: "Could not generate a unique donor ID. Please try again." };
  } catch (error: any) {
    console.error("Error creating donor:", error);
    return { success: false, error: error.message || "Failed to create donor" };
  }
}

export async function updateDonor(id: string, data: DonorInput) {
  try {
    const admin = await requireAdmin();

    if (!data.fullName?.trim() || !data.phoneNumber?.trim()) {
      return { success: false, error: "Name and phone number are required." };
    }

    const donor = await db.donor.update({ where: { id }, data: donorData(data) });

    await writeAudit(admin, "DONOR_UPDATE", `Updated donor ${donor.donorCode} "${donor.fullName}"`);
    revalidateDonor(id);
    return { success: true, id };
  } catch (error: any) {
    console.error("Error updating donor:", error);
    return { success: false, error: error.message || "Failed to update donor" };
  }
}

export async function deleteDonor(id: string) {
  try {
    const admin = await requireAdmin();

    const donor = await db.donor.findUnique({
      where: { id },
      include: { _count: { select: { donations: true } } },
    });
    if (!donor) return { success: false, error: "Donor not found." };

    if (donor._count.donations > 0) {
      return {
        success: false,
        error: "This donor has money on record. Remove those entries first, or mark the donor inactive.",
      };
    }

    await db.donor.delete({ where: { id } });
    await writeAudit(admin, "DONOR_DELETE", `Deleted donor ${donor.donorCode} "${donor.fullName}"`);
    revalidateDonor();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting donor:", error);
    return { success: false, error: error.message || "Failed to delete donor" };
  }
}

export async function getDonors(search?: string) {
  await requireAdmin();

  const q = search?.trim();
  const donors = await db.donor.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { donorCode: { contains: q, mode: "insensitive" } },
            { organization: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q } },
          ],
        }
      : undefined,
    include: { donations: { include: { returns: true } } },
    orderBy: { createdAt: "desc" },
  });

  return donors.map(({ donations, ...donor }) => ({
    ...donor,
    summary: summarize(donations),
  }));
}

export async function getDonor(id: string) {
  await requireAdmin();

  const donor = await db.donor.findUnique({
    where: { id },
    include: {
      donations: {
        orderBy: { receivedDate: "desc" },
        include: { returns: { orderBy: { returnedDate: "asc" } } },
      },
    },
  });
  if (!donor) return null;

  return { ...donor, summary: summarize(donor.donations) };
}

export interface DonationInput {
  donorId: string;
  type: string; // "QARD_HASANA" | "SADAQAH" | "OPERATIONAL"
  amount: number;
  receivedDate: string; // "YYYY-MM-DD"
  paymentMethod?: string;
  reference?: string;
  notes?: string;
}

export async function createDonation(data: DonationInput) {
  try {
    const admin = await requireAdmin();

    if (!DONATION_TYPES[data.type]) return { success: false, error: "Choose what the money is for." };
    if (!(data.amount > 0)) return { success: false, error: "Enter an amount greater than zero." };
    if (!isDateOnly(data.receivedDate)) return { success: false, error: "Enter the date the money was received." };

    const donor = await db.donor.findUnique({ where: { id: data.donorId } });
    if (!donor) return { success: false, error: "Donor not found." };

    // Receipt number: DR-00001, DR-00002, ... continuing from the newest receipt
    const latest = await db.donation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { receiptNumber: true },
    });
    let next = (Number(latest?.receiptNumber.replace(/\D/g, "")) || 0) + 1;

    for (let attempt = 0; attempt < 10; attempt++) {
      const receiptNumber = `DR-${String(next).padStart(5, "0")}`;
      try {
        const donation = await db.donation.create({
          data: {
            donorId: donor.id,
            receiptNumber,
            type: data.type,
            amount: data.amount,
            receivedDate: parseDateOnly(data.receivedDate),
            paymentMethod: data.paymentMethod || null,
            reference: data.reference?.trim() || null,
            notes: data.notes?.trim() || null,
          },
        });

        await writeAudit(
          admin,
          "DONATION_CREATE",
          `Received ৳${data.amount.toLocaleString()} as ${DONATION_TYPES[data.type]} from ${donor.donorCode} "${donor.fullName}" (receipt ${receiptNumber})`
        );
        revalidateDonor(donor.id);
        return { success: true, id: donation.id, receiptNumber };
      } catch (error: any) {
        // Receipt number already taken — try the next one
        if (error.code === "P2002") {
          next += 1;
          continue;
        }
        throw error;
      }
    }

    return { success: false, error: "Could not generate a unique receipt number. Please try again." };
  } catch (error: any) {
    console.error("Error creating donation:", error);
    return { success: false, error: error.message || "Failed to record the money received" };
  }
}

export async function deleteDonation(id: string) {
  try {
    const admin = await requireAdmin();

    const donation = await db.donation.findUnique({ where: { id }, include: { donor: true } });
    if (!donation) return { success: false, error: "Entry not found." };

    await db.donation.delete({ where: { id } });

    await writeAudit(
      admin,
      "DONATION_DELETE",
      `Deleted ৳${donation.amount.toLocaleString()} ${DONATION_TYPES[donation.type] ?? donation.type} entry (receipt ${donation.receiptNumber}) from ${donation.donor.donorCode}`
    );
    revalidateDonor(donation.donorId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting donation:", error);
    return { success: false, error: error.message || "Failed to delete entry" };
  }
}

export interface DonorReturnInput {
  donationId: string;
  amount: number;
  returnedDate: string; // "YYYY-MM-DD"
  paymentMethod?: string;
  notes?: string;
}

// Hands Qard Hasana principal back to the donor
export async function createDonorReturn(data: DonorReturnInput) {
  try {
    const admin = await requireAdmin();

    const donation = await db.donation.findUnique({
      where: { id: data.donationId },
      include: { donor: true, returns: true },
    });
    if (!donation) return { success: false, error: "Entry not found." };
    if (donation.type !== "QARD_HASANA") {
      return { success: false, error: "Only Qard Hasana money can be returned to a donor." };
    }

    const alreadyReturned = donation.returns.reduce((sum, r) => sum + r.amount, 0);
    const remaining = donation.amount - alreadyReturned;
    if (!(data.amount > 0) || data.amount > remaining) {
      return { success: false, error: `Amount must be between 1 and ${remaining}, the part not yet returned.` };
    }
    if (!isDateOnly(data.returnedDate)) return { success: false, error: "Enter the date the money was returned." };

    await db.donorReturn.create({
      data: {
        donationId: donation.id,
        amount: data.amount,
        returnedDate: parseDateOnly(data.returnedDate),
        paymentMethod: data.paymentMethod || null,
        notes: data.notes?.trim() || null,
      },
    });

    await writeAudit(
      admin,
      "DONOR_RETURN_CREATE",
      `Returned ৳${data.amount.toLocaleString()} of Qard Hasana (receipt ${donation.receiptNumber}) to ${donation.donor.donorCode} "${donation.donor.fullName}"`
    );
    revalidateDonor(donation.donorId);
    return { success: true };
  } catch (error: any) {
    console.error("Error recording donor return:", error);
    return { success: false, error: error.message || "Failed to record the return" };
  }
}

export async function deleteDonorReturn(id: string) {
  try {
    const admin = await requireAdmin();

    const donorReturn = await db.donorReturn.findUnique({
      where: { id },
      include: { donation: { include: { donor: true } } },
    });
    if (!donorReturn) return { success: false, error: "Return not found." };

    await db.donorReturn.delete({ where: { id } });

    await writeAudit(
      admin,
      "DONOR_RETURN_DELETE",
      `Removed ৳${donorReturn.amount.toLocaleString()} return (receipt ${donorReturn.donation.receiptNumber}) for ${donorReturn.donation.donor.donorCode}`
    );
    revalidateDonor(donorReturn.donation.donorId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting donor return:", error);
    return { success: false, error: error.message || "Failed to remove the return" };
  }
}
