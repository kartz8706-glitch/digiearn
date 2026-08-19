"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PortfolioChart() {
  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[]}>
          <XAxis
            dataKey="month"
            stroke="#66756d"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#66756d"
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            contentStyle={{
              background: "#0c1813",
              border: "1px solid #1c3026",
              borderRadius: "12px",
            }}
          />

        </AreaChart>
      </ResponsiveContainer>
      <p className="-mt-44 text-center text-sm text-gray-500">Your performance chart will appear after you invest.</p>
    </div>
  );
}