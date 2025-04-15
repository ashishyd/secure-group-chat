"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { LinkText } from "@/components/ui/LinkText";

/**
 * RegisterPage Component
 *
 * This component renders a registration form for users to create an account.
 * It includes input fields for name, email, and password, and handles form submission
 * by sending the data to the `/api/auth/register` endpoint.
 *
 * Features:
 * - Form validation and state management
 * - Error handling for failed registration attempts
 * - Navigation to the login page upon successful registration
 */
export default function RegisterPage() {
  // State to manage form input values
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // State to manage error messages
  const [error, setError] = useState<string | null>(null);

  // Next.js router for navigation
  const router = useRouter();

  /**
   * Handles input field changes and updates the form state.
   *
   * @param e - The change event from the input field
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handles form submission for user registration.
   * Sends a POST request to the `/api/auth/register` endpoint with the form data.
   *
   * @param e - The form submission event
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (response.ok) {
        // Navigate to the login page on successful registration
        router.push("/login");
      } else {
        // Set error message if registration fails
        setError(data.error || "Registration failed");
      }
    } catch {
      // Handle unexpected errors
      setError("Unexpected error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <form onSubmit={handleRegister}>
          {/* Input field for the user's name */}
          <TextInput
            label="Name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            required
          />
          {/* Input field for the user's email */}
          <TextInput
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />
          {/* Input field for the user's password */}
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
            {/* Submit button for the registration form */}
            <Button type="submit">Register</Button>
          </div>
        </form>
        <div className="mt-4 text-center">
          {/* Link to navigate back to the login page */}
          <LinkText href="/login">Back to Login</LinkText>
        </div>
      </div>
    </div>
  );
}
