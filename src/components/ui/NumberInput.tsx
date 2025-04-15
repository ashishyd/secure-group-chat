import { InputHTMLAttributes, JSX } from "react";

/**
 * Props for the `NumberInput` component.
 * Extends the standard HTML input attributes for an input element.
 *
 * @property {string} label - The label text displayed above the input field.
 */
interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * A reusable number input component with a label.
 *
 * @param {NumberInputProps} props - The props for the `NumberInput` component.
 * @returns {JSX.Element} A styled number input field with a label.
 *
 * @example
 * <NumberInput
 *   label="Enter a number"
 *   value={42}
 *   onChange={(e) => console.log(e.target.value)}
 * />
 */
export const NumberInput = ({
  label,
  ...props
}: NumberInputProps): JSX.Element => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
      type="number"
      {...props}
    />
  </div>
);
