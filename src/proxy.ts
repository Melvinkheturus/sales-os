import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",               // landing page
  "/sign-in(.*)",    // Clerk sign-in
  "/sign-up(.*)",    // Clerk sign-up (invite flow)
  "/api/auth/webhook(.*)", // Clerk webhook — must be public
]);

// Onboarding routes — blocked from normal app access
const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Retrieve current auth state
  const { userId, sessionClaims } = await auth();

  // If already authenticated and trying to access auth pages (sign-in or sign-up)
  if (userId && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    const onboardingState = (sessionClaims?.publicMetadata as { onboardingState?: string })?.onboardingState;
    if (onboardingState === "PLATFORM_SETUP") {
      return NextResponse.redirect(new URL("/onboarding/platform", request.url));
    }
    if (onboardingState === "PROFILE_SETUP") {
      return NextResponse.redirect(new URL("/onboarding/profile", request.url));
    }
    return NextResponse.redirect(new URL("/workspaces", request.url));
  }

  // Always allow public routes
  if (isPublicRoute(request)) return;

  // Require authentication for all other routes
  if (!userId) {
    await auth.protect();
    return;
  }

  const onboardingState = (sessionClaims?.publicMetadata as { onboardingState?: string })?.onboardingState;

  if (onboardingState === "PLATFORM_SETUP") {
    // Must complete platform setup first
    if (!isOnboardingRoute(request)) {
      return NextResponse.redirect(new URL("/onboarding/platform", request.url));
    }
    // Block access to profile onboarding until platform setup is done
    if (pathname.startsWith("/onboarding/profile")) {
      return NextResponse.redirect(new URL("/onboarding/platform", request.url));
    }
    return;
  }

  if (onboardingState === "PROFILE_SETUP") {
    // Must complete personal profile setup
    if (!isOnboardingRoute(request)) {
      return NextResponse.redirect(new URL("/onboarding/profile", request.url));
    }
    return;
  }

  // onboardingState === "COMPLETE" or undefined (existing users before this feature)
  // Block access to onboarding routes once complete
  if (isOnboardingRoute(request)) {
    return NextResponse.redirect(new URL("/workspaces", request.url));
  }
});

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
