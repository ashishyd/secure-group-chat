import React, { InputHTMLAttributes, JSX } from "react";

/**
 * Props for the `TextInput` component.
 * Extends the standard HTML input attributes for an input element.
 *
 * @property {string} label - The label text displayed above the input field.
 */
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * A reusable text input component with a label.
 *
 * @param {TextInputProps} props - The props for the `TextInput` component.
 * @returns {JSX.Element} A styled text input field with a label.
 *
 * @example
 * <TextInput
 *   label="Username"
 *   placeholder="Enter your username"
 *   value={username}
 *   onChange={(e) => setUsername(e.target.value)}
 * />
 */
export const TextInput = ({ label, ...props }: TextInputProps): JSX.Element => (
  <div className="mb-4 p-2">
    {/* Label for the input field */}
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {/* Input field with additional props spread */}
    <input
      className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
      type="text"
      {...props}
    />
  </div>
);
