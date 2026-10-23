import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function POST(req: Request) {
  const f = await req.formData().catch(() => null);
  const token = String(f?.get("token") ?? "");
  if (token.length >= 16) db().prepare("DELETE FROM subscribers WHERE token = ?").run(token);
  return NextResponse.redirect(new URL("/unsubscribe?done=1", req.url), 303);
}
