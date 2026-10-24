import { NextResponse } from "next/server";
import { COOKIE, siteOrigin } from "../../../../lib/adminAuth";

export async function POST() {
  const res = NextResponse.redirect(`${siteOrigin()}/admin/login`, 303);
  res.cookies.delete(COOKIE);
  return res;
}
