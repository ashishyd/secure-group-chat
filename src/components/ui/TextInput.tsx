import React, { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const TextInput = ({ label, ...props }: TextInputProps) => (
  <div className="mb-4 p-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
      type="text"
      {...props}
    />
  </div>
);
