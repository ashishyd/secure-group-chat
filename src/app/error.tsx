"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-4">
      <h1 className="text-4xl font-bold mb-4">Oops!</h1>
      <p className="text-lg mb-2">
        {error
          ? `An error occurred: ${error.message}`
          : "An unexpected error occurred."}
      </p>
      <button
        onClick={() => {
          reset();
          router.push("/");
        }}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go Home
      </button>
    </div>
  );
}
