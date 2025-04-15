import type { Metadata } from "next"; // Importing the Metadata type from Next.js for defining metadata.
import { Geist, Geist_Mono } from "next/font/google"; // Importing Google Fonts utilities for Geist and Geist Mono fonts.
import "../styles/globals.css"; // Importing global CSS styles.
import { AuthProvider } from "@/context/AuthContext"; // Importing the AuthProvider component for authentication context.

/**
 * Configures the Geist Sans font with specific options.
 * @type {Object}
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS variable for the font.
  subsets: ["latin"], // Subset of characters to include.
});

/**
 * Configures the Geist Mono font with specific options.
 * @type {Object}
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // CSS variable for the font.
  subsets: ["latin"], // Subset of characters to include.
});

/**
 * Metadata for the application, used by Next.js for SEO and other purposes.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Group Chat", // Title of the application.
  description: "An mvp for group chat with AI integration", // Description of the application.
};

/**
 * Root layout component for the application.
 * Wraps the application with global providers and layout structure.
 *
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - Child components to render inside the layout.
 * @returns {JSX.Element} The root layout structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {" "}
      {/* Sets the language of the document to English. */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`} // Applies font variables and antialiasing.
      >
        <AuthProvider>{children}</AuthProvider>{" "}
        {/* Wraps children with the AuthProvider for authentication context. */}
      </body>
    </html>
  );
}
