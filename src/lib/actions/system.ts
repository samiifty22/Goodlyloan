"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// Storage allowance of the current database plan (Neon Free: 0.5 GB per branch).
// Raise this when the plan is upgraded.
const STORAGE_LIMIT_BYTES = 512 * 1024 * 1024;

export async function getStorageUsage() {
  await requireAdmin();

  // The plan's allowance counts every database on the branch, including Postgres's own
  const [{ size }] = await db.$queryRaw<{ size: bigint }[]>`
    SELECT sum(pg_database_size(datname))::bigint AS size FROM pg_database
  `;
  const usedBytes = Number(size);

  return {
    usedBytes,
    limitBytes: STORAGE_LIMIT_BYTES,
    percent: Math.min(Math.round((usedBytes / STORAGE_LIMIT_BYTES) * 1000) / 10, 100),
  };
}

// Everything needed to rebuild the records elsewhere. Login sessions and password
// hashes are deliberately left out so a backup file cannot be used to sign in.
export async function getBackupData() {
  const admin = await requireAdmin();

  const [
    users,
    donorPaymentInfo,
    settings,
    categories,
    borrowers,
    campaigns,
    campaignUpdates,
    documents,
    contributions,
    paymentProofs,
    receipts,
    repayments,
    repaymentReceipts,
    notifications,
    donors,
    donations,
    donorReturns,
    recipients,
    disbursements,
    installments,
    auditLogs,
  ] = await Promise.all([
    db.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true } }),
    db.donorPaymentInfo.findMany(),
    db.settings.findMany(),
    db.category.findMany(),
    db.borrower.findMany(),
    db.campaign.findMany(),
    db.campaignUpdate.findMany(),
    db.document.findMany(),
    db.contribution.findMany(),
    db.paymentProof.findMany(),
    db.receipt.findMany(),
    db.repayment.findMany(),
    db.repaymentReceipt.findMany(),
    db.notification.findMany(),
    db.donor.findMany(),
    db.donation.findMany(),
    db.donorReturn.findMany(),
    db.recipient.findMany(),
    db.disbursement.findMany(),
    db.installment.findMany(),
    db.auditLog.findMany(),
  ]);

  const tables = {
    users,
    donorPaymentInfo,
    settings,
    categories,
    borrowers,
    campaigns,
    campaignUpdates,
    documents,
    contributions,
    paymentProofs,
    receipts,
    repayments,
    repaymentReceipts,
    notifications,
    donors,
    donations,
    donorReturns,
    recipients,
    disbursements,
    installments,
    auditLogs,
  };

  await db.auditLog.create({
    data: {
      userId: admin.id,
      userEmail: admin.email,
      action: "BACKUP_DOWNLOAD",
      details: "Downloaded a full data backup",
    },
  });

  return {
    app: "GoodlyLoan",
    exportedAt: new Date().toISOString(),
    exportedBy: admin.email,
    rowCounts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])),
    tables,
  };
}
