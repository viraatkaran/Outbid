import { NextResponse } from "next/server";
import { adminFromRequest } from "../../../../lib/adminAuth";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  if (!adminFromRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const f = await req.formData();
  const id = Number(f.get("id"));
  const status = f.get("status") === "active" ? "active" : "hidden";
  db().prepare("UPDATE listings SET status=? WHERE id=?").run(status, id);
  return NextResponse.redirect(new URL("/admin#listings", req.url), 303);
}
