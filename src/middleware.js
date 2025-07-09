export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Add routes that should be protected
    "/dashboard/:path*",
    "/profile/:path*",
    // Add more protected routes as needed
  ]
}; 