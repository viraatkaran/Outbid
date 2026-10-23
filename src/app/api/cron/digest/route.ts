import { NextResponse } from "next/server";
import { sendDigest } from "../../../../lib/notify";

export const dynamic = "force-dynamic";

/** Weekly digest. Call with a scheduler (for example a Railway cron job): POST /api/cron/digest with header x-cron-key. */
export async function POST(req: Request) {
  const key = process.env.CRON_KEY;
  if (!key || key === "change-me" || req.headers.get("x-cron-key") !== key) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await sendDigest());
}
