import { useAnalytics } from "@/hooks/useAnalytics";
import OverviewCard from "@/components/analytics/OverviewCard";
import StatCard from "@/components/analytics/StatCard";
import ChartSection from "@/components/analytics/ChartSection";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  UserGroupIcon,
  AiChat01Icon,
  Award01Icon,
  ChartBarLineIcon,
} from "@hugeicons/core-free-icons";
import { formatCurrency } from "@/lib/formatters";
import { useUserStore } from "@/stores/userStore";

export default function AnalyticsPage() {
  const analytics = useAnalytics();
  const currency = useUserStore((s) => s.profile.currency);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
        <p className="text-muted-foreground">Статистика ваших взаиморасчётов</p>
      </header>

      <OverviewCard
        totalOwedToMe={analytics.totalOwedToMe}
        totalIOwe={analytics.totalIOwe}
        balance={analytics.balance}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Всего людей"
          value={analytics.totalPeople}
          icon={<HugeiconsIcon icon={UserGroupIcon} size={18} />}
          accent="primary"
          index={0}
        />
        <StatCard
          label="Закрыто долгов"
          value={analytics.closedDebtsCount}
          icon={<HugeiconsIcon icon={Tick01Icon} size={18} />}
          accent="positive"
          index={1}
        />
        <StatCard
          label="Средний долг"
          value={formatCurrency(analytics.averageDebtAmount, currency)}
          icon={<HugeiconsIcon icon={ChartBarLineIcon} size={18} />}
          accent="primary"
          index={2}
        />
        <StatCard
          label="Активных долгов"
          value={analytics.activeDebtsCount}
          icon={<HugeiconsIcon icon={AiChat01Icon} size={18} />}
          accent="primary"
          index={3}
        />
      </div>

      {analytics.biggestDebt && (
        <StatCard
          label="Самый большой долг"
          value={`${analytics.biggestDebt.personName}: ${formatCurrency(analytics.biggestDebt.amount, currency)}`}
          icon={<HugeiconsIcon icon={Award01Icon} size={18} />}
          accent="negative"
          index={4}
        />
      )}

      <ChartSection data={analytics.monthlyActivity} />
      
      <div className="pb-4" />
    </div>
  );
}
