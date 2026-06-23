import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Let all pages through — each page handles its own auth check
  return NextResponse.next();
}

export const config = {
  matcher: [],
};