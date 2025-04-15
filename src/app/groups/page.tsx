"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import GroupCard from "@/components/ui/GroupCard";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Group } from "@/types";

/**
 * GroupsPage Component
 *
 * This component displays a list of groups the user has joined, allows the user to create a new group,
 * and provides functionality to join, leave, or delete groups. It also handles authentication and redirects
 * unauthenticated users to the login page.
 */
export default function GroupsPage() {
  // State to manage the visibility of the "Create Group" modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State to store the name of the new group being created
  const [newGroupName, setNewGroupName] = useState<string>("");

  // State to store any error messages related to the modal
  const [modalError, setModalError] = useState<string | null>(null);

  // Next.js router for navigation
  const router = useRouter();

  // Authentication context to get user details and authentication status
  const { user, loading, isAuthenticated } = useAuth();

  // State to store the list of groups fetched from the API
  const [groups, setGroups] = useState<Group[]>([]);

  /**
   * Effect to redirect unauthenticated users to the login page.
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  /**
   * Effect to fetch all available groups from the API when the component mounts.
   */
  useEffect(() => {
    async function fetchAllGroups() {
      try {
        const res = await fetch("/api/groups");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.groups)) {
            setGroups(data.groups);
          }
        } else {
          console.error("Failed to fetch groups: ", res.statusText);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    }
    fetchAllGroups();
  }, []);

  // Display a loading message while authentication status is being determined
  if (loading) return <div className="p-4">Loading...</div>;

  // Display a redirecting message if the user is not authenticated
  if (!user) return <div className="p-4">Redirecting...</div>;

  /**
   * Handles the action of joining a group.
   *
   * @param groupId - The ID of the group to join
   */
  const handleJoin = async (groupId: string) => {
    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userId: "user1" }),
      });
      if (response.ok) {
        router.refresh();
      } else {
        console.error("Error joining group:", await response.text());
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  };

  /**
   * Handles the action of leaving a group.
   *
   * @param groupId - The ID of the group to leave
   */
  const handleLeave = async (groupId: string) => {
    try {
      const response = await fetch("/api/groups/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userId: "user1" }),
      });
      if (response.ok) {
        router.refresh();
      } else {
        console.error("Error leaving group:", await response.text());
      }
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  /**
   * Handles the action of creating a new group.
   *
   * @param e - The form submission event
   */
  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newGroupName.trim()) {
      setModalError("Group name cannot be empty.");
      return;
    }

    try {
      const payload = { name: newGroupName, creatorId: user.id };
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setIsModalOpen(false);
        setNewGroupName("");
        router.refresh();
      } else {
        setModalError(data.error || "Failed to create the group");
      }
    } catch (err) {
      console.error(err);
      setModalError("An unexpected error occurred.");
    }
  };

  return (
    <div className="relative p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Groups</h1>
      {groups.length === 0 ? (
        <p>You haven’t joined any groups yet. Create your own new group.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              currentUser={user}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onDelete={() => {} /* Placeholder for delete functionality */}
            />
          ))}
        </div>
      )}

      {/* Floating button to open the "Create Group" modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg z-50"
        aria-label="Create Group"
      >
        <span className="text-3xl">+</span>
      </button>

      {/* Modal for creating a new group */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md relative">
            <h2 className="text-xl font-bold mb-4 text-center">
              Create New Group Chat
            </h2>
            {modalError && <p className="mb-4 text-red-500">{modalError}</p>}
            <form onSubmit={handleCreateGroup}>
              <TextInput
                label="Group Name"
                name="groupName"
                type="text"
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
              <div className="flex justify-between mt-4">
                <Button type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
