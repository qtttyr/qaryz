import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. " +
    "See .env.example for details."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

/** Row type for the shared_debts table (with paid_amount column from migration 006) */
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
}
