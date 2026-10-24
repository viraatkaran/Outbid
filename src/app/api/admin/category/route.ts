import { NextResponse } from "next/server";
import { isCategory } from "../../../../lib/config";
import { db } from "../../../../lib/db";

/** Admin only: moves a listing to another category (a listing's category is otherwise fixed when it is created). */
export async function POST(req: Request) {
  const f = await req.formData();
  const key = process.env.ADMIN_KEY;
  if (!key || f.get("key") !== key) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const category = String(f.get("category") ?? "");
  const id = Number(f.get("id"));
  if (!isCategory(category) || !Number.isInteger(id)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  db().prepare("UPDATE listings SET category = ? WHERE id = ?").run(category, id);
  return NextResponse.redirect(new URL(`/admin?key=${encodeURIComponent(key)}`, req.url), 303);
}
