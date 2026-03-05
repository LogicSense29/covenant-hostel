import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const unAuthorized = () => NextResponse.redirect(new URL("/unauthorized", req.url));

    // Role-Based Routing Constraints
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return unAuthorized();
    }
    
    if (pathname.startsWith("/landlord") && token.role !== "LANDLORD" && token.role !== "ADMIN") {
      return unAuthorized();
    }
    
    if (pathname.startsWith("/service-provider") && token.role !== "SERVICE_PROVIDER" && token.role !== "ADMIN") {
      return unAuthorized();
    }

    // A unified dashboard could act as a portal that dynamically shows content based on role
    // For specific sub-apps we use routing logic above.
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/landlord/:path*",
    "/service-provider/:path*",
    "/tenant/:path*"
  ],
};
