import React from "react";
import { Button } from "@/components/ui/Button";
import { LinkText } from "@/components/ui/LinkText";
import { Group, User } from "@/types";

/**
 * Props for the GroupCard component.
 *
 * @interface GroupCardProps
 * @property {Group} group - The group data to display.
 * @property {User | undefined} currentUser - The currently logged-in user.
 * @property {(groupId: string) => void} [onJoin] - Callback function triggered when the user joins the group.
 * @property {(groupId: string) => void} [onLeave] - Callback function triggered when the user leaves the group.
 * @property {(groupId: string) => void} [onDelete] - Callback function triggered when the user deletes the group.
 */
interface GroupCardProps {
  group: Group;
  currentUser: User | undefined;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onDelete?: (groupId: string) => void;
}

/**
 * GroupCard component displays information about a group and provides actions
 * for the current user, such as joining, leaving, or deleting the group.
 *
 * @param {GroupCardProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered GroupCard component or null if no current user is provided.
 */
const GroupCard = ({
  group,
  currentUser,
  onJoin,
  onLeave,
  onDelete,
}: GroupCardProps) => {
  // Return null if no current user is provided.
  if (!currentUser) return null;

  // Check whether the current user is the creator of the group.
  const isCreator = group.creatorId === currentUser.id;

  // Check whether the current user is a member of the group.
  const isMember = group.members?.includes(currentUser.id);

  return (
    <div className="flex justify-between items-center bg-white p-4 border rounded shadow mb-2">
      <div>
        {/* Display the group name */}
        <h3 className="text-lg font-semibold">{group.name}</h3>
        {/* Link to the group's chat */}
        <LinkText href={`/chat/${group.id}`}>Enter Chat</LinkText>
      </div>
      <div className="flex space-x-2">
        {/* Show Join button if the user is not a member */}
        {!isMember && (
          <Button onClick={() => onJoin && onJoin(group.id)}>Join</Button>
        )}
        {/* Show Leave button if the user is a member but not the creator */}
        {isMember && !isCreator && (
          <Button onClick={() => onLeave && onLeave(group.id)}>Leave</Button>
        )}
        {/* Show Delete button if the user is the creator */}
        {isCreator && (
          <Button
            onClick={() => onDelete && onDelete(group.id)}
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
