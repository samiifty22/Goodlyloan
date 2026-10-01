"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { toDateOnly, DONATION_TYPES, DISBURSEMENT_TYPES } from "@/lib/schedule";

// Where each fund stands. Money in from donors and money out to recipients are
// tallied per fund, so loan capital, gifts and running costs never mix.
export async function getFundSummary() {
  await requireAdmin();

  const [donations, returned, disbursements, repaid] = await Promise.all([
    db.donation.groupBy({ by: ["type"], _sum: { amount: true } }),
    db.donorReturn.aggregate({ _sum: { amount: true } }),
    db.disbursement.groupBy({ by: ["type"], _sum: { amount: true } }),
    db.installment.aggregate({ _sum: { paidAmount: true } }),
  ]);

  const received = (type: string) => donations.find((d) => d.type === type)?._sum.amount ?? 0;
  const given = (type: string) => disbursements.find((d) => d.type === type)?._sum.amount ?? 0;

  const qardReceived = received("QARD_HASANA");
  const qardReturned = returned._sum.amount ?? 0;
  const qardLent = given("QARD_HASANA");
  const qardRepaid = repaid._sum.paidAmount ?? 0;

  return {
    qard: {
      received: qardReceived,
      returnedToDonors: qardReturned,
      lent: qardLent,
      repaid: qardRepaid,
      // Cash available to lend: what donors put in, less what went back to them,
      // less what is out with recipients, plus what recipients have repaid
      balance: qardReceived - qardReturned - qardLent + qardRepaid,
      withRecipients: qardLent - qardRepaid,
      owedToDonors: qardReceived - qardReturned,
    },
    sadaqah: {
      received: received("SADAQAH"),
      given: given("SADAQAH"),
      balance: received("SADAQAH") - given("SADAQAH"),
    },
    operational: {
      received: received("OPERATIONAL"),
    },
  };
}

export interface LedgerEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  kind: "DONATION" | "DONOR_RETURN" | "DISBURSEMENT" | "REPAYMENT";
  label: string;
  fund: string; // "QARD_HASANA" | "SADAQAH" | "OPERATIONAL"
  direction: "IN" | "OUT";
  amount: number;
  partyType: "donor" | "recipient";
  partyId: string;
  partyCode: string;
  partyName: string;
  detail: string;
}

// Every movement of money, newest first: donations, returns to donors,
// money given to recipients, and repayments received
export async function getFundLedger(): Promise<LedgerEntry[]> {
  await requireAdmin();

  const [donations, returns, disbursements, payments] = await Promise.all([
    db.donation.findMany({ include: { donor: true } }),
    db.donorReturn.findMany({ include: { donation: { include: { donor: true } } } }),
    db.disbursement.findMany({ include: { recipient: true } }),
    db.installment.findMany({
      where: { paidAmount: { gt: 0 } },
      include: { disbursement: { include: { recipient: true } } },
    }),
  ]);

  const entries: LedgerEntry[] = [
    ...donations.map((d) => ({
      id: `donation-${d.id}`,
      date: toDateOnly(d.receivedDate),
      kind: "DONATION" as const,
      label: `${DONATION_TYPES[d.type] ?? d.type} received`,
      fund: d.type,
      direction: "IN" as const,
      amount: d.amount,
      partyType: "donor" as const,
      partyId: d.donor.id,
      partyCode: d.donor.donorCode,
      partyName: d.donor.fullName,
      detail: `Receipt ${d.receiptNumber}`,
    })),
    ...returns.map((r) => ({
      id: `return-${r.id}`,
      date: toDateOnly(r.returnedDate),
      kind: "DONOR_RETURN" as const,
      label: "Qard Hasana returned to donor",
      fund: "QARD_HASANA",
      direction: "OUT" as const,
      amount: r.amount,
      partyType: "donor" as const,
      partyId: r.donation.donor.id,
      partyCode: r.donation.donor.donorCode,
      partyName: r.donation.donor.fullName,
      detail: `Against receipt ${r.donation.receiptNumber}`,
    })),
    ...disbursements.map((d) => ({
      id: `disbursement-${d.id}`,
      date: toDateOnly(d.disbursedDate),
      kind: "DISBURSEMENT" as const,
      label: `${DISBURSEMENT_TYPES[d.type] ?? d.type} given`,
      fund: d.type,
      direction: "OUT" as const,
      amount: d.amount,
      partyType: "recipient" as const,
      partyId: d.recipient.id,
      partyCode: d.recipient.recipientCode,
      partyName: d.recipient.fullName,
      detail: d.purpose ?? "",
    })),
    ...payments.map((p) => ({
      id: `repayment-${p.id}`,
      // paidDate is always set alongside a payment; dueDate is only a fallback
      date: toDateOnly(p.paidDate ?? p.dueDate),
      kind: "REPAYMENT" as const,
      label: "Repayment received",
      fund: "QARD_HASANA",
      direction: "IN" as const,
      amount: Math.min(p.paidAmount, p.amount),
      partyType: "recipient" as const,
      partyId: p.disbursement.recipient.id,
      partyCode: p.disbursement.recipient.recipientCode,
      partyName: p.disbursement.recipient.fullName,
      detail: `Installment ${p.installmentNumber}`,
    })),
  ];

  return entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
