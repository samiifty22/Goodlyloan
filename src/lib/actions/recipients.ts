"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, writeAudit } from "@/lib/admin-guard";
import {
  generateSchedule,
  installmentStatus,
  parseDateOnly,
  todayDateOnly,
  toDateOnly,
  DISBURSEMENT_TYPES,
  MAX_INSTALLMENTS,
} from "@/lib/schedule";

function revalidateRecipient(id?: string) {
  revalidatePath("/admin/recipients");
  revalidatePath("/admin/funds");
  revalidatePath("/admin/schedule");
  if (id) revalidatePath(`/admin/recipients/${id}`);
}

// Rolls a recipient's disbursements up into the totals shown in lists and headers
function summarize(disbursements: any[], today: string) {
  let qardGiven = 0;
  let sadaqahGiven = 0;
  let scheduled = 0;
  let repaid = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  let nextDue: { dueDate: string; amount: number } | null = null;

  for (const d of disbursements) {
    if (d.type === "SADAQAH") {
      sadaqahGiven += d.amount;
      continue;
    }
    qardGiven += d.amount;

    for (const inst of d.installments ?? []) {
      scheduled += inst.amount;
      repaid += Math.min(inst.paidAmount, inst.amount);

      const status = installmentStatus(inst, today);
      if (status === "PAID") continue;

      const remaining = inst.amount - inst.paidAmount;
      const dueDate = toDateOnly(inst.dueDate);
      if (status === "OVERDUE") {
        overdueCount += 1;
        overdueAmount += remaining;
      }
      if (!nextDue || dueDate < nextDue.dueDate) {
        nextDue = { dueDate, amount: remaining };
      }
    }
  }

  return {
    qardGiven,
    sadaqahGiven,
    totalGiven: qardGiven + sadaqahGiven,
    repaid,
    outstanding: Math.max(qardGiven - repaid, 0),
    unscheduled: Math.max(qardGiven - scheduled, 0),
    overdueCount,
    overdueAmount,
    nextDue,
  };
}

export interface RecipientInput {
  fullName: string;
  fatherName?: string;
  phoneNumber: string;
  nidNumber?: string;
  dateOfBirth?: string; // "YYYY-MM-DD"
  address: string;
  occupation?: string;
  monthlyIncome?: number;
  familyMembers?: number;
  guarantorName?: string;
  guarantorPhone?: string;
  notes?: string;
  status?: string;
}

function recipientData(data: RecipientInput) {
  const text = (v?: string) => v?.trim() || null;
  return {
    fullName: data.fullName.trim(),
    fatherName: text(data.fatherName),
    phoneNumber: data.phoneNumber.trim(),
    nidNumber: text(data.nidNumber),
    dateOfBirth: data.dateOfBirth ? parseDateOnly(data.dateOfBirth) : null,
    address: data.address.trim(),
    occupation: text(data.occupation),
    monthlyIncome: data.monthlyIncome ?? null,
    familyMembers: data.familyMembers ?? null,
    guarantorName: text(data.guarantorName),
    guarantorPhone: text(data.guarantorPhone),
    notes: text(data.notes),
    status: data.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}

export async function createRecipient(data: RecipientInput) {
  try {
    const admin = await requireAdmin();

    if (!data.fullName?.trim() || !data.phoneNumber?.trim() || !data.address?.trim()) {
      return { success: false, error: "Name, phone number and address are required." };
    }

    // Generated ID: GL-0001, GL-0002, ... continuing from the newest record
    const latest = await db.recipient.findFirst({
      orderBy: { createdAt: "desc" },
      select: { recipientCode: true },
    });
    let next = (Number(latest?.recipientCode.replace(/\D/g, "")) || 0) + 1;

    for (let attempt = 0; attempt < 10; attempt++) {
      const recipientCode = `GL-${String(next).padStart(4, "0")}`;
      try {
        const recipient = await db.recipient.create({
          data: { ...recipientData(data), recipientCode },
        });

        await writeAudit(admin, "RECIPIENT_CREATE", `Created recipient ${recipientCode} "${recipient.fullName}"`);
        revalidateRecipient();
        return { success: true, id: recipient.id, recipientCode };
      } catch (error: any) {
        // Code already taken — try the next number
        if (error.code === "P2002") {
          next += 1;
          continue;
        }
        throw error;
      }
    }

    return { success: false, error: "Could not generate a unique recipient ID. Please try again." };
  } catch (error: any) {
    console.error("Error creating recipient:", error);
    return { success: false, error: error.message || "Failed to create recipient" };
  }
}

export async function updateRecipient(id: string, data: RecipientInput) {
  try {
    const admin = await requireAdmin();

    if (!data.fullName?.trim() || !data.phoneNumber?.trim() || !data.address?.trim()) {
      return { success: false, error: "Name, phone number and address are required." };
    }

    const recipient = await db.recipient.update({ where: { id }, data: recipientData(data) });

    await writeAudit(admin, "RECIPIENT_UPDATE", `Updated recipient ${recipient.recipientCode} "${recipient.fullName}"`);
    revalidateRecipient(id);
    return { success: true, id };
  } catch (error: any) {
    console.error("Error updating recipient:", error);
    return { success: false, error: error.message || "Failed to update recipient" };
  }
}

export async function deleteRecipient(id: string) {
  try {
    const admin = await requireAdmin();

    const recipient = await db.recipient.findUnique({
      where: { id },
      include: { _count: { select: { disbursements: true } } },
    });
    if (!recipient) return { success: false, error: "Recipient not found." };

    if (recipient._count.disbursements > 0) {
      return {
        success: false,
        error: "This recipient has money on record. Remove those entries first, or mark the recipient inactive.",
      };
    }

    await db.recipient.delete({ where: { id } });
    await writeAudit(admin, "RECIPIENT_DELETE", `Deleted recipient ${recipient.recipientCode} "${recipient.fullName}"`);
    revalidateRecipient();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting recipient:", error);
    return { success: false, error: error.message || "Failed to delete recipient" };
  }
}

export async function getRecipients(search?: string) {
  await requireAdmin();

  const q = search?.trim();
  const recipients = await db.recipient.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { recipientCode: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q } },
            { nidNumber: { contains: q } },
          ],
        }
      : undefined,
    include: { disbursements: { include: { installments: true } } },
    orderBy: { createdAt: "desc" },
  });

  const today = todayDateOnly();
  return recipients.map(({ disbursements, ...recipient }) => ({
    ...recipient,
    summary: summarize(disbursements, today),
  }));
}

export async function getRecipient(id: string) {
  await requireAdmin();

  const recipient = await db.recipient.findUnique({
    where: { id },
    include: {
      disbursements: {
        orderBy: { disbursedDate: "desc" },
        include: { installments: { orderBy: { installmentNumber: "asc" } } },
      },
    },
  });
  if (!recipient) return null;

  return { ...recipient, summary: summarize(recipient.disbursements, todayDateOnly()) };
}

export interface DisbursementInput {
  recipientId: string;
  type: string; // "QARD_HASANA" | "SADAQAH"
  amount: number;
  disbursedDate: string; // "YYYY-MM-DD"
  purpose?: string;
  paymentMethod?: string;
  notes?: string;
  // Repayment schedule (Qard Hasana only)
  dayOfMonth?: number;
  firstDueMonth?: string; // "YYYY-MM"
  installmentCount?: number;
  installmentAmount?: number;
}

export async function createDisbursement(data: DisbursementInput) {
  try {
    const admin = await requireAdmin();

    if (!DISBURSEMENT_TYPES[data.type]) return { success: false, error: "Choose Qard Hasana or Sadaqah." };
    if (!(data.amount > 0)) return { success: false, error: "Enter an amount greater than zero." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.disbursedDate)) return { success: false, error: "Enter the date the money was given." };

    const recipient = await db.recipient.findUnique({ where: { id: data.recipientId } });
    if (!recipient) return { success: false, error: "Recipient not found." };

    // The schedule is always rebuilt on the server from the rule, never taken from the browser
    let schedule: ReturnType<typeof generateSchedule> = [];
    if (data.type === "QARD_HASANA") {
      schedule = generateSchedule({
        totalAmount: data.amount,
        dayOfMonth: data.dayOfMonth ?? 0,
        firstDueMonth: data.firstDueMonth ?? "",
        installmentCount: data.installmentCount,
        installmentAmount: data.installmentAmount,
      });

      if (schedule.length === 0) {
        return {
          success: false,
          error: `Set a valid repayment schedule: day of month, first due month, and up to ${MAX_INSTALLMENTS} installments.`,
        };
      }
    }

    const disbursement = await db.disbursement.create({
      data: {
        recipientId: recipient.id,
        type: data.type,
        amount: data.amount,
        disbursedDate: parseDateOnly(data.disbursedDate),
        purpose: data.purpose?.trim() || null,
        paymentMethod: data.paymentMethod || null,
        notes: data.notes?.trim() || null,
        installments: {
          create: schedule.map((row) => ({
            installmentNumber: row.installmentNumber,
            dueDate: parseDateOnly(row.dueDate),
            amount: row.amount,
          })),
        },
      },
    });

    await writeAudit(
      admin,
      "DISBURSEMENT_CREATE",
      `Gave ৳${data.amount.toLocaleString()} as ${DISBURSEMENT_TYPES[data.type]} to ${recipient.recipientCode} "${recipient.fullName}"` +
        (schedule.length ? ` with ${schedule.length} installments` : "")
    );
    revalidateRecipient(recipient.id);
    return { success: true, id: disbursement.id };
  } catch (error: any) {
    console.error("Error creating disbursement:", error);
    return { success: false, error: error.message || "Failed to record the money given" };
  }
}

export async function deleteDisbursement(id: string) {
  try {
    const admin = await requireAdmin();

    const disbursement = await db.disbursement.findUnique({ where: { id }, include: { recipient: true } });
    if (!disbursement) return { success: false, error: "Entry not found." };

    await db.disbursement.delete({ where: { id } });

    await writeAudit(
      admin,
      "DISBURSEMENT_DELETE",
      `Deleted ৳${disbursement.amount.toLocaleString()} ${DISBURSEMENT_TYPES[disbursement.type] ?? disbursement.type} entry for ${disbursement.recipient.recipientCode} and its schedule`
    );
    revalidateRecipient(disbursement.recipientId);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting disbursement:", error);
    return { success: false, error: error.message || "Failed to delete entry" };
  }
}

// Sets the total received against one installment. Passing 0 clears the payment.
export async function recordInstallmentPayment(id: string, paidAmount: number, paidDate?: string, notes?: string) {
  try {
    const admin = await requireAdmin();

    const installment = await db.installment.findUnique({
      where: { id },
      include: { disbursement: { include: { recipient: true } } },
    });
    if (!installment) return { success: false, error: "Installment not found." };

    if (!(paidAmount >= 0) || paidAmount > installment.amount) {
      return { success: false, error: `Amount must be between 0 and ${installment.amount}.` };
    }
    if (paidAmount > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(paidDate ?? "")) {
      return { success: false, error: "Enter the date the payment was received." };
    }

    await db.installment.update({
      where: { id },
      data: {
        paidAmount,
        paidDate: paidAmount > 0 ? parseDateOnly(paidDate!) : null,
        notes: notes?.trim() || null,
      },
    });

    const { recipient } = installment.disbursement;
    await writeAudit(
      admin,
      paidAmount > 0 ? "INSTALLMENT_PAYMENT" : "INSTALLMENT_PAYMENT_CLEARED",
      paidAmount > 0
        ? `Recorded ৳${paidAmount.toLocaleString()} for installment #${installment.installmentNumber} from ${recipient.recipientCode} "${recipient.fullName}"`
        : `Cleared payment on installment #${installment.installmentNumber} for ${recipient.recipientCode} "${recipient.fullName}"`
    );
    revalidateRecipient(recipient.id);
    return { success: true };
  } catch (error: any) {
    console.error("Error recording installment payment:", error);
    return { success: false, error: error.message || "Failed to record payment" };
  }
}

export interface ScheduleFilter {
  recipientId?: string;
  disbursementId?: string;
  from?: string; // "YYYY-MM-DD", inclusive
  to?: string; // "YYYY-MM-DD", exclusive
}

// Flat list of installments with their recipient, used by the calendar and the exports
export async function getScheduleInstallments(filter: ScheduleFilter = {}) {
  await requireAdmin();

  const installments = await db.installment.findMany({
    where: {
      disbursementId: filter.disbursementId,
      disbursement: filter.recipientId ? { recipientId: filter.recipientId } : undefined,
      dueDate:
        filter.from || filter.to
          ? {
              gte: filter.from ? parseDateOnly(filter.from) : undefined,
              lt: filter.to ? parseDateOnly(filter.to) : undefined,
            }
          : undefined,
    },
    include: { disbursement: { include: { recipient: true, _count: { select: { installments: true } } } } },
    orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }],
  });

  const today = todayDateOnly();
  return installments.map((inst) => ({
    id: inst.id,
    installmentNumber: inst.installmentNumber,
    installmentCount: inst.disbursement._count.installments,
    dueDate: toDateOnly(inst.dueDate),
    amount: inst.amount,
    paidAmount: inst.paidAmount,
    paidDate: inst.paidDate ? toDateOnly(inst.paidDate) : null,
    status: installmentStatus(inst, today),
    disbursementId: inst.disbursementId,
    disbursedDate: toDateOnly(inst.disbursement.disbursedDate),
    loanAmount: inst.disbursement.amount,
    recipientId: inst.disbursement.recipient.id,
    recipientCode: inst.disbursement.recipient.recipientCode,
    recipientName: inst.disbursement.recipient.fullName,
    recipientPhone: inst.disbursement.recipient.phoneNumber,
  }));
}
