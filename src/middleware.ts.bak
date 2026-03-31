import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Simpele middleware: alleen cookies doorsturen, geen zware imports
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
