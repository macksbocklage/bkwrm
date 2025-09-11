import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is properly configured
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
);

export default function middleware(request: NextRequest) {
  // If Clerk is not configured, skip middleware entirely
  if (!isClerkConfigured) {
    return NextResponse.next();
  }

  // For now, just pass through when Clerk is configured
  // The actual Clerk middleware will be handled by the ClerkProvider
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
