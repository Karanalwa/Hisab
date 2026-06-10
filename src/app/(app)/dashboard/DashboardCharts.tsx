"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { money } from "@/lib/gst";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#8b5cf6", "#ec4899"];

export default function DashboardCharts({
  trend,
  topProducts,
  payModes,
}: {
  trend: { date: string; total: number }[];
  topProducts: { name: string; revenue: number }[];
  payModes: { name: string; value: number }[];
}) {
  return (
    <div className="grid-2" style={{ marginTop: 24 }}>
      <div className="card" style={{ padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", marginBottom: 16 }}>Sales Trend (30 Days)</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={{ stroke: "var(--line)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={{ stroke: "var(--line)" }} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
                formatter={(value: any) => money(Number(value))}
              />
              <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", marginBottom: 16 }}>Top Products</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={{ stroke: "var(--line)" }} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "k"} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--mut)" }} axisLine={{ stroke: "var(--line)" }} width={100} />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
                formatter={(value: any) => money(Number(value))}
              />
              <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding: "22px 24px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", marginBottom: 16 }}>Payment Modes</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={payModes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                {payModes.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: "var(--mut)" }} />
              <Tooltip
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
                formatter={(value: any, name: any) => [money(Number(value)), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
