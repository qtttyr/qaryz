// ============================================================
// Qaryz — Supabase Database Types
// Auto-generated from schema. Update when schema changes.
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      persons: {
        Row: PersonRow;
        Insert: PersonInsert;
        Update: PersonUpdate;
      };
      debts: {
        Row: DebtRow;
        Insert: DebtInsert;
        Update: DebtUpdate;
      };
      payments: {
        Row: PaymentRow;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
      };
      shared_debts: {
        Row: SharedDebtRow;
        Insert: SharedDebtInsert;
        Update: SharedDebtUpdate;
      };
    };
    Functions: {
      increment_shared_debt_paid: {
        Args: {
          debt_id: string;
          inc_amount: number;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
}

// ── Profiles ────────────────────────────────────────────────
export interface ProfileRow {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  currency: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  name?: string;
  username?: string | null;
  avatar_url?: string | null;
  currency?: string;
  language?: string;
}

export interface ProfileUpdate {
  name?: string;
  username?: string | null;
  avatar_url?: string | null;
  currency?: string;
  language?: string;
}

// ── Persons ─────────────────────────────────────────────────
export interface PersonRow {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonInsert {
  id?: string;
  user_id: string;
  name: string;
  avatar_url?: string | null;
  phone?: string | null;
}

export interface PersonUpdate {
  name?: string;
  avatar_url?: string | null;
  phone?: string | null;
}

// ── Debts ───────────────────────────────────────────────────
export interface DebtRow {
  id: string;
  user_id: string;
  person_id: string;
  direction: "owed_to_me" | "i_owe";
  amount: number;
  description: string | null;
  created_at: string;
  settled_at: string | null;
  updated_at: string;
}

export interface DebtInsert {
  id?: string;
  user_id: string;
  person_id: string;
  direction: "owed_to_me" | "i_owe";
  amount: number;
  description?: string | null;
  settled_at?: string | null;
}

export interface DebtUpdate {
  direction?: "owed_to_me" | "i_owe";
  amount?: number;
  description?: string | null;
  settled_at?: string | null;
}

// ── Payments ────────────────────────────────────────────────
export interface PaymentRow {
  id: string;
  user_id: string;
  debt_id: string;
  amount: number;
  note: string | null;
  type: "partial" | "full";
  created_at: string;
}

export interface PaymentInsert {
  id?: string;
  user_id: string;
  debt_id: string;
  amount: number;
  note?: string | null;
  type: "partial" | "full";
}

export interface PaymentUpdate {
  amount?: number;
  note?: string | null;
  type?: "partial" | "full";
}

// ── Shared Debts ────────────────────────────────────────────
export interface SharedDebtRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  paid_amount: number;
  description: string | null;
  created_by: string;
  created_at: string;
  settled_at: string | null;
  updated_at: string;
}

export interface SharedDebtInsert {
  id?: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  paid_amount?: number;
  description?: string | null;
  created_by: string;
}

export interface SharedDebtUpdate {
  paid_amount?: number;
  settled_at?: string | null;
  description?: string | null;
}
