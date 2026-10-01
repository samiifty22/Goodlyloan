import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFundLedger } from "@/lib/actions/funds";
import { todayDateOnly, DONATION_TYPES } from "@/lib/schedule";

function csvCell(value: string | number | null) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const ledger = await getFundLedger();

    const rows: (string | number | null)[][] = [
      ["Date", "Movement", "Fund", "Party Type", "Party ID", "Party Name", "Money In", "Money Out", "Detail"],
      ...ledger.map((e) => [
        e.date,
        e.label,
        DONATION_TYPES[e.fund] ?? e.fund,
        e.partyType === "donor" ? "Donor" : "Recipient",
        e.partyCode,
        e.partyName,
        e.direction === "IN" ? e.amount : null,
        e.direction === "OUT" ? e.amount : null,
        e.detail,
      ]),
    ];

    // BOM so Excel opens Bengali names as UTF-8
    const body = "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="goodlyloan-ledger-${todayDateOnly()}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Ledger export error:", error);
    return NextResponse.json({ error: error.message || "Failed to export ledger" }, { status: 500 });
  }
}
