import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Check if Clerk is properly configured
const isClerkConfigured = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
  process.env.CLERK_SECRET_KEY
);

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/home(.*)',
  '/reader(.*)',
  '/api/books(.*)',
  '/api/upload(.*)',
  '/api/highlights(.*)',
  '/api/chat(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // If Clerk is not configured, skip authentication
  if (!isClerkConfigured) {
    return;
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
