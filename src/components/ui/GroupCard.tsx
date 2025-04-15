// src/components/ui/GroupCard.tsx
import React from "react";
import { Button } from "@/components/ui/Button";
import { LinkText } from "@/components/ui/LinkText";
import { Group, User } from "@/types";

interface GroupCardProps {
  group: Group;
  currentUser: User | undefined;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onDelete?: (groupId: string) => void;
}

const GroupCard = ({
  group,
  currentUser,
  onJoin,
  onLeave,
  onDelete,
}: GroupCardProps) => {
  if (!currentUser) return null;
  // Check whether the current user is the creator.
  const isCreator = group.creatorId === currentUser._id;
  // Check whether the current user is a member.
  const isMember = group.members?.includes(currentUser._id);

  return (
    <div className="flex justify-between items-center bg-white p-4 border rounded shadow mb-2">
      <div>
        <h3 className="text-lg font-semibold">{group.name}</h3>
        <LinkText href={`/chat/${group._id}`}>Enter Chat</LinkText>
      </div>
      <div className="flex space-x-2">
        {/* Show Join button if not a member */}
        {!isMember && (
          <Button onClick={() => onJoin && onJoin(group._id)}>Join</Button>
        )}
        {/* Show Leave button if member but not creator */}
        {isMember && !isCreator && (
          <Button onClick={() => onLeave && onLeave(group._id)}>Leave</Button>
        )}
        {/* Show Delete button if current user is the creator */}
        {isCreator && (
          <Button
            onClick={() => onDelete && onDelete(group._id)}
            variant="danger"
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
