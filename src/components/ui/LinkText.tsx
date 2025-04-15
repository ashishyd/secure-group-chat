import Link from "next/link";
import { JSX, ReactNode } from "react";

/**
 * A reusable React component for rendering a styled link.
 *
 * @param {Object} props - The props object.
 * @param {string} props.href - The URL the link should navigate to.
 * @param {ReactNode} props.children - The content to be displayed inside the link.
 *
 * @returns {JSX.Element} A styled link component.
 */
export const LinkText = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): JSX.Element => (
  <Link href={href}>
    <span className="text-blue-600 hover:underline cursor-pointer text-sm">
      {children}
    </span>
  </Link>
);
