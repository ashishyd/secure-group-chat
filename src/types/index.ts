export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
}

export interface Group {
  _id: string;
  name: string;
  creatorId: string;
  members?: string[]; // Array of user IDs
}

export interface Message {
  _id: string;
  groupId: string;
  userId: string;
  message: string;
  imageUrl?: string;
  readBy: string[];
  createdAt: string;
}

export interface SmartReplyResponse {
  suggestions: string[];
}
