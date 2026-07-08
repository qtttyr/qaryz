export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  /** Joined profile of the friend (not the current user) */
  name?: string;
  username?: string;
  avatar?: string;
  phone?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  /** Joined profile of the other party */
  name?: string;
  username?: string;
  avatar?: string;
}

export interface SharedDebt {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  description?: string;
  createdBy: string;
  createdAt: string;
  settledAt?: string;
  /** Joined profile of the other party */
  otherName?: string;
  otherUsername?: string;
  otherAvatar?: string;
}

/** Direction of a shared debt from the current user's perspective */
export type SharedDebtDirection = "i_owe" | "owed_to_me";
