import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!req.auth && !isLogin) {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  if (req.auth && isLogin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
