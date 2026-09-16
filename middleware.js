// import { NextResponse } from "next/server";

// DEFAULT MIDDLEWARE

// export function middleware(request) {
//   return NextResponse.redirect(new URL("/about", request.url));
// }

// NEXTAUTH MIDDLEWARE
import { auth } from "@/app/_lib/auth";

export const middleware = auth;

export const config = {
  matcher: ["/account"],
};
