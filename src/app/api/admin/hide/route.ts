import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(req: Request) {
  const f = await req.formData();
  const key = process.env.ADMIN_KEY;
  if (!key || f.get("key") !== key) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = Number(f.get("id"));
  const status = f.get("status") === "active" ? "active" : "hidden";
  db().prepare("UPDATE listings SET status=? WHERE id=?").run(status, id);
  return NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(key)}`, req.url), 303);
}
