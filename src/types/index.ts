export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  creatorId: string;
  members?: string[]; // Array of user IDs
}

export interface Message {
  id: string;
  groupId: string;
  userId: string;
  userName?: string;
  message: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: string;
}

export interface SmartReplyResponse {
  suggestions: string[];
}
