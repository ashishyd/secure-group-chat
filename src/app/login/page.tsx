"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { LinkText } from "@/components/ui/LinkText";
import { useAuth } from "@/context/AuthContext";

/**
 * LoginPage component renders a login form for user authentication.
 * It handles user input, form submission, and error handling.
 *
 * @returns {JSX.Element} The rendered login page component.
 */
export default function LoginPage() {
  // State to manage form input values (email and password)
  const [form, setForm] = useState({ email: "", password: "" });

  // State to manage error messages
  const [error, setError] = useState<string | null>(null);

  // Context function to refresh user data after login
  const { refreshUser } = useAuth();

  // Next.js router for navigation
  const router = useRouter();

  /**
   * Handles input changes in the form fields.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handles form submission for login.
   * Sends a POST request to the login API and processes the response.
   *
   * @param {React.FormEvent} e - The form submission event.
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      // Send login request to the API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh user data and navigate to the groups page on success
        await refreshUser();
        router.push("/groups");
      } else {
        // Set error message from API response or a default message
        setError(data.error || "Login failed");
      }
    } catch {
      // Handle unexpected errors
      setError("Unexpected error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <form onSubmit={handleLogin}>
          {/* Email input field */}
          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />
          {/* Password input field */}
          <TextInput
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <div className="flex flex-col items-center">
            {/* Submit button */}
            <Button type="submit">Login</Button>
          </div>
        </form>
        <div className="mt-4 text-center">
          {/* Links for forgot password and registration */}
          <LinkText href="/forgot-password">Forgot Password?</LinkText>
          <span className="mx-2">|</span>
          <LinkText href="/register">Register</LinkText>
        </div>
      </div>
    </div>
  );
}
