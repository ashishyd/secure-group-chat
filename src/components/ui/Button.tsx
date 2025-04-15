import { ReactNode } from "react";

export const Button = ({
  children,
  ...props
}: {
  children: ReactNode;
  [key: string]: unknown;
}) => (
  <button
    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
    {...props}
  >
    {children}
  </button>
);
