export type DebtDirection = "owed_to_me" | "i_owe";

export interface Debt {
  id: string;
  personId: string;
  direction: DebtDirection;
  amount: number; // always positive
  description?: string;
  createdAt: string; // ISO date
  settledAt?: string; // ISO date — when fully settled
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  note?: string;
  createdAt: string;
  type: "partial" | "full";
}

export interface Person {
  id: string;
  name: string;
  avatar?: string; // URL or base64
  createdAt: string;
}
