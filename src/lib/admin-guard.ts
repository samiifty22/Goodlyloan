import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// The fund ledger holds personal and financial data, so every action re-checks the
// session on the server instead of trusting an admin id sent from the browser.
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Not authorized");
  }
  return session.user;
}

// For a donor's own data: the caller must be that user, or an admin
export async function requireUser(userId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.id !== userId && session.user.role !== "ADMIN")) {
    throw new Error("Not authorized");
  }
  return session.user;
}

export async function writeAudit(admin: { id: string; email: string }, action: string, details: string) {
  await db.auditLog.create({
    data: { userId: admin.id, userEmail: admin.email, action, details },
  });
}
