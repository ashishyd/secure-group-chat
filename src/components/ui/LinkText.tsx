import Link from "next/link";
import { ReactNode } from "react";

export const LinkText = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <Link href={href}>
    <span className="text-blue-600 hover:underline cursor-pointer text-sm">
      {children}
    </span>
  </Link>
);
