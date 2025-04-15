import React, { JSX } from "react";
import { Button } from "./ui/Button";

/**
 * Props for the SmartReply component.
 * @interface SmartReplyProps
 * @property {string[]} suggestions - An array of suggestion strings to display as buttons.
 * @property {(reply: string) => void} onReplySelect - Callback function triggered when a suggestion is selected.
 */
interface SmartReplyProps {
  suggestions: string[];
  onReplySelect: (reply: string) => void;
}

/**
 * SmartReply Component
 *
 * A React functional component that renders a list of suggestion buttons.
 * When a button is clicked, it triggers the `onReplySelect` callback with the selected suggestion.
 *
 * @param {SmartReplyProps} props - The props for the component.
 * @returns {JSX.Element} The rendered SmartReply component.
 */
const SmartReply = ({
  suggestions,
  onReplySelect,
}: SmartReplyProps): JSX.Element => {
  return (
    <div className="flex space-x-2 mt-2">
      {suggestions.map((reply, index) => (
        <Button key={index} onClick={() => onReplySelect(reply)}>
          {reply}
        </Button>
      ))}
    </div>
  );
};

export default SmartReply;
