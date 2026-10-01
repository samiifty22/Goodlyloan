import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBackupData } from "@/lib/actions/system";
import { todayDateOnly } from "@/lib/schedule";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const backup = await getBackupData();

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="goodlyloan-backup-${todayDateOnly()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Backup export error:", error);
    return NextResponse.json({ error: error.message || "Failed to create backup" }, { status: 500 });
  }
}
