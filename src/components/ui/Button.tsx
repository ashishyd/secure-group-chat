import { JSX, ReactNode } from "react";

/**
 * A reusable `Button` component for React applications.
 *
 * @param {Object} props - The props object for the Button component.
 * @param {ReactNode} props.children - The content to be displayed inside the button.
 * @param {Object} [props.[key: string]] - Additional props to be passed to the button element.
 * @returns {JSX.Element} A styled button element.
 */
export const Button = ({
  children,
  ...props
}: {
  children: ReactNode;
  [key: string]: unknown;
}): JSX.Element => (
  <button
    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
    {...props}
  >
    {children}
  </button>
);
