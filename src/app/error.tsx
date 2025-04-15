"use client";

import React from "react";
import { useRouter } from "next/navigation";

/**
 * Props for the Error component.
 * @interface ErrorProps
 * @property {Error} error - The error object containing details about the error.
 * @property {() => void} reset - A function to reset the error state.
 */
interface ErrorProps {
  error: Error;
  reset: () => void;
}

/**
 * Error component to display an error message and provide a way to navigate back home.
 *
 * @param {ErrorProps} props - The props for the Error component.
 * @param {Error} props.error - The error object containing details about the error.
 * @param {() => void} props.reset - A function to reset the error state.
 * @returns {JSX.Element} The rendered error component.
 */
export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200 p-4">
      {/* Title of the error page */}
      <h1 className="text-4xl font-bold mb-4">Oops!</h1>

      {/* Display the error message or a fallback message */}
      <p className="text-lg mb-2">
        {error
          ? `An error occurred: ${error.message}`
          : "An unexpected error occurred."}
      </p>

      {/* Button to reset the error state and navigate to the home page */}
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
