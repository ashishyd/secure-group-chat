"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * HomePage component
 *
 * This component serves as the main entry point for the application. It checks
 * the user's authentication status and redirects them to the appropriate page
 * based on their authentication state.
 *
 * - If the user is authenticated, they are redirected to the `/groups` page.
 * - If the user is not authenticated, they are redirected to the `/login` page.
 *
 * While the authentication status is being determined, a "Loading..." message
 * is displayed.
 *
 * @returns {JSX.Element} The loading message while redirecting.
 */
export default function HomePage() {
  const router = useRouter(); // Next.js router for navigation
  const { loading, isAuthenticated } = useAuth(); // Authentication context

  useEffect(() => {
    // Redirect the user based on their authentication status once loading is complete
    if (!loading) {
      if (isAuthenticated) {
        router.push("/groups"); // Redirect to groups page if authenticated
      } else {
        router.push("/login"); // Redirect to login page if not authenticated
      }
    }
  }, [loading, isAuthenticated, router]); // Dependencies for the useEffect hook

  return <div>Loading...</div>; // Display a loading message while redirecting
}
