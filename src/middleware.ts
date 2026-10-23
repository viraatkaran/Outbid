import { NextResponse, type NextRequest } from "next/server";

/** Sends plain-http visitors to https (the proxy in front of the app reports the original scheme). */
export function middleware(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("host") ?? "";
  if (proto === "http" && !host.startsWith("localhost") && !host.startsWith("127.")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  const res = NextResponse.next();
  if (proto === "https") res.headers.set("strict-transport-security", "max-age=86400");
  return res;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
