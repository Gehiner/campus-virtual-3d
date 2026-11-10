import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9-]{6,32}$/.test(code)) {
    return NextResponse.redirect(new URL("/observador?error=invalid-room-code", request.url));
  }
  return NextResponse.redirect(new URL(`/s/${encodeURIComponent(code)}?view=1`, request.url));
}
