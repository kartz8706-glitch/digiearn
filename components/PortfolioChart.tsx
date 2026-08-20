"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatUgx,
  investmentStateEvent,
  readInvestments,
} from "@/lib/investmentStore";
import { useEffect, useState } from "react";

type ChartPoint = {
  date: string;
  value: number;
};

function buildChartData() {
  let runningValue = 0;

  return readInvestments()
    .sort(
      (first, second) =>
        new Date(first.investedAt).getTime() - new Date(second.investedAt).getTime()
    )
    .map((investment) => {
      runningValue += investment.amount;

      return {
        date: new Date(investment.investedAt).toLocaleDateString("en-UG", {
          month: "short",
          day: "numeric",
        }),
        value: runningValue,
      };
    });
}

export default function PortfolioChart() {
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const updateData = () => setData(buildChartData());

    updateData();
    window.addEventListener(investmentStateEvent, updateData);
    window.addEventListener("firebase-auth-state-changed", updateData);

    return () => {
      window.removeEventListener(investmentStateEvent, updateData);
      window.removeEventListener("firebase-auth-state-changed", updateData);
    };
  }, []);

  return (
    <div className="h-[350px] w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          Your performance chart will appear after you invest.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="portfolioValue" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#43e58c" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#43e58c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#66756d"
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              stroke="#66756d"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `UGX ${Number(value).toLocaleString("en-UG")}`}
            />

            <Tooltip
              formatter={(value) => formatUgx(Number(value))}
              contentStyle={{
                background: "#0c1813",
                border: "1px solid #1c3026",
                borderRadius: "12px",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#43e58c"
              strokeWidth={3}
              fill="url(#portfolioValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
