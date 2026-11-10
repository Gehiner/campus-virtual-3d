import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const room = request.nextUrl.searchParams.get("room");
  const requestedNext = request.nextUrl.searchParams.get("next");
  let safeNext = new URL("/estudiante", request.url);
  if (requestedNext?.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.includes("\\")) {
    safeNext = new URL(requestedNext, request.url);
  }
  if (safeNext.origin !== new URL(request.url).origin) {
    safeNext = new URL("/estudiante", request.url);
  }
  const destination = room ? new URL(`/s/${encodeURIComponent(room)}?join=1`, request.url) : safeNext;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url));
    }
  }
  return NextResponse.redirect(destination);
}
