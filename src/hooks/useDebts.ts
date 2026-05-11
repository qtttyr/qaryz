import { useDebtStore } from "@/stores/debtStore";
import type { DebtDirection } from "@/types/debt";

export function useDebts(direction?: DebtDirection) {
  const debts = useDebtStore((s) => s.debts);
  const payments = useDebtStore((s) => s.payments);
  const addDebt = useDebtStore((s) => s.addDebt);
  const settleDebt = useDebtStore((s) => s.settleDebt);
  const removeDebt = useDebtStore((s) => s.removeDebt);
  const addPayment = useDebtStore((s) => s.addPayment);
  const getRemainingAmount = useDebtStore((s) => s.getRemainingAmount);

  const filtered = direction
    ? debts.filter((d) => d.direction === direction && !d.settledAt)
    : debts.filter((d) => !d.settledAt);

  return {
    debts: filtered,
    allDebts: debts,
    payments,
    addDebt,
    settleDebt,
    removeDebt,
    addPayment,
    getRemainingAmount,
  };
}
