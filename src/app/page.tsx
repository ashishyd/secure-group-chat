"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push("/groups");
      } else {
        router.push("/login");
      }
    }
  }, [loading, isAuthenticated, router]);

  return <div>Loading...</div>;
}
