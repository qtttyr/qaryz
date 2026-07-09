import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useFriendStore } from "@/stores/friendStore";
import { useDebtStore } from "@/stores/debtStore";

export interface FriendWithBalance {
  /** This friend's unique friendship row id */
  id: string;
  /** The friend's user ID (the other person) */
  userId: string;
  friendId: string;
  name: string;
  username: string;
  avatar?: string;
  phone?: string;
  /** Positive = friend owes me, negative = I owe friend */
  balance: number;
  /** Number of unsettled shared debts between us */
  activeDebtsCount: number;
  /** ISO date of the most recent activity */
  lastActivity: string;
  createdAt: string;
}

export function useFriendsWithBalances(): {
  friends: FriendWithBalance[];
  totalFriends: number;
  friendsWithDebts: FriendWithBalance[];
  friendsWithoutDebts: FriendWithBalance[];
} {
  const currentUser = useAuthStore((s) => s.user);
  const friendsList = useFriendStore((s) => s.friends);
  const sharedDebts = useDebtStore((s) => s.sharedDebts);

  return useMemo(() => {
    if (!currentUser) {
      return { friends: [], totalFriends: 0, friendsWithDebts: [], friendsWithoutDebts: [] };
    }

    const enriched: FriendWithBalance[] = friendsList.map((friend) => {
      const otherUserId =
        friend.userId === currentUser.id
          ? friend.friendId
          : friend.userId;

      // Find shared debts involving both users
      const relevantDebts = sharedDebts.filter(
        (sd) =>
          !sd.settledAt &&
          ((sd.fromUserId === currentUser.id && sd.toUserId === otherUserId) ||
            (sd.fromUserId === otherUserId && sd.toUserId === currentUser.id))
      );

      let balance = 0;
      let lastActivity = friend.createdAt;

      for (const sd of relevantDebts) {
        const remaining = sd.amount - (sd.paidAmount || 0);
        if (sd.fromUserId === currentUser.id) {
          balance -= remaining;
        } else {
          balance += remaining;
        }
        if (sd.createdAt > lastActivity) lastActivity = sd.createdAt;
      }

      return {
        id: friend.id,
        userId: otherUserId,
        friendId: friend.friendId,
        name: friend.name || "Пользователь",
        username: friend.username || "user",
        avatar: friend.avatar,
        phone: friend.phone,
        balance,
        activeDebtsCount: relevantDebts.length,
        lastActivity,
        createdAt: friend.createdAt,
      };
    });

    const withDebts = enriched.filter(
      (f) => f.balance !== 0 || f.activeDebtsCount > 0
    );
    const withoutDebts = enriched.filter(
      (f) => f.balance === 0 && f.activeDebtsCount === 0
    );

    // Sort: friends with debts first (by lastActivity), then friends without debts (by name)
    const sorted = [
      ...withDebts.sort(
        (a, b) =>
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      ),
      ...withoutDebts.sort((a, b) => a.name.localeCompare(b.name)),
    ];

    return {
      friends: sorted,
      totalFriends: enriched.length,
      friendsWithDebts: withDebts,
      friendsWithoutDebts: withoutDebts,
    };
  }, [currentUser, friendsList, sharedDebts]);
}
