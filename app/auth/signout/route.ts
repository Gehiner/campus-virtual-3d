import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
