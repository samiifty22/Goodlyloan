import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getScheduleInstallments } from "@/lib/actions/recipients";
import { todayDateOnly } from "@/lib/schedule";

type ScheduleItem = Awaited<ReturnType<typeof getScheduleInstallments>>[number];

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Part paid",
  OVERDUE: "Overdue",
  UPCOMING: "Upcoming",
};

function csvCell(value: string | number | null) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(items: ScheduleItem[]) {
  const rows: (string | number | null)[][] = [
    [
      "Recipient ID",
      "Recipient Name",
      "Phone",
      "Loan Date",
      "Loan Amount",
      "Installment No",
      "Total Installments",
      "Due Date",
      "Amount Due",
      "Amount Received",
      "Received On",
      "Status",
    ],
    ...items.map((i) => [
      i.recipientCode,
      i.recipientName,
      i.recipientPhone,
      i.disbursedDate,
      i.loanAmount,
      i.installmentNumber,
      i.installmentCount,
      i.dueDate,
      i.amount,
      i.paidAmount,
      i.paidDate,
      STATUS_LABELS[i.status],
    ]),
  ];

  // BOM so Excel opens Bengali names as UTF-8
  return "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function icsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

// iCalendar lines may not exceed 75 octets; continuation lines start with a space
function foldLine(line: string) {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;

  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (bytes + size > 74) {
      parts.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n");
}

function buildIcs(items: ScheduleItem[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const compact = (date: string) => date.replace(/-/g, "");
  const dayAfter = (date: string) => {
    const d = new Date(`${date}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GoodlyLoan//Repayment Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:GoodlyLoan Repayments",
  ];

  for (const i of items) {
    const remaining = i.amount - i.paidAmount;
    lines.push(
      "BEGIN:VEVENT",
      `UID:installment-${i.id}@goodlyloan`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(i.dueDate)}`,
      `DTEND;VALUE=DATE:${compact(dayAfter(i.dueDate))}`,
      `SUMMARY:${icsText(`Repayment due: BDT ${remaining.toLocaleString("en-US")} - ${i.recipientName} (${i.recipientCode})`)}`,
      `DESCRIPTION:${icsText(
        `Qard Hasana installment ${i.installmentNumber} of ${i.installmentCount}\n` +
          `Recipient: ${i.recipientName} (${i.recipientCode})\n` +
          `Phone: ${i.recipientPhone}\n` +
          `Amount due: BDT ${remaining.toLocaleString("en-US")}`
      )}`,
      "TRANSP:TRANSPARENT",
      // Reminder at 9:00 on the due date
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsText(`Repayment due today: ${i.recipientName}`)}`,
      "TRIGGER:PT9H",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") === "ics" ? "ics" : "csv";

    const items = await getScheduleInstallments({
      recipientId: searchParams.get("recipientId") || undefined,
      disbursementId: searchParams.get("disbursementId") || undefined,
    });

    const single = new Set(items.map((i) => i.recipientCode)).size === 1 ? items[0].recipientCode : "all";
    const filename = `goodlyloan-repayments-${single}-${todayDateOnly()}.${format}`;

    // The calendar only needs what is still owed; the spreadsheet gets the full history
    const body = format === "ics" ? buildIcs(items.filter((i) => i.status !== "PAID")) : buildCsv(items);

    return new NextResponse(body, {
      headers: {
        "Content-Type": format === "ics" ? "text/calendar; charset=utf-8" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Schedule export error:", error);
    return NextResponse.json({ error: error.message || "Failed to export schedule" }, { status: 500 });
  }
}
