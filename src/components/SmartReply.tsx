import React from 'react';
import { Button } from './ui/Button';

interface SmartReplyProps {
    suggestions: string[];
    onReplySelect: (reply: string) => void;
}

const SmartReply = ({ suggestions, onReplySelect }: SmartReplyProps) => {
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
