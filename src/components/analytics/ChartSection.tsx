import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartSectionProps {
  data: { month: string; created: number; settled: number }[];
}

export default function ChartSection({ data }: ChartSectionProps) {
  return (
    <Card className="rounded-2xl border-border/50 bg-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Активность за 6 месяцев
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px] px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.2 }}
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ padding: "2px 0" }}
            />
            <Bar
              dataKey="created"
              name="Новые"
              radius={[4, 4, 0, 0]}
              barSize={16}
            >
              {data.map((_, index) => (
                <Cell key={`cell-created-${index}`} fill="var(--primary)" fillOpacity={0.8} />
              ))}
            </Bar>
            <Bar
              dataKey="settled"
              name="Закрытые"
              radius={[4, 4, 0, 0]}
              barSize={16}
            >
              {data.map((_, index) => (
                <Cell key={`cell-settled-${index}`} fill="var(--positive)" fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
