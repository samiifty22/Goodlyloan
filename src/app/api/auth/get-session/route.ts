import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session) {
    return NextResponse.json(null, { status: 401 });
  }
  return NextResponse.json(session);
}
