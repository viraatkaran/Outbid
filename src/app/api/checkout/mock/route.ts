import { NextResponse } from "next/server";
import { ValidationError } from "../../../../lib/listings";
import { completeOrder } from "../../../../lib/notify";
import { mockAllowed, providerName } from "../../../../lib/payments";

export async function POST(req: Request) {
  if (providerName() !== "mock" || !mockAllowed()) return NextResponse.json({ error: "Not available." }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b.orderId !== "string") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    const r = await completeOrder(b.orderId, `mock_${b.orderId}`);
    return NextResponse.json({ redirect: r.created ? `/manage/${r.ownerToken}?new=1` : `/l/${r.slug}` });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
