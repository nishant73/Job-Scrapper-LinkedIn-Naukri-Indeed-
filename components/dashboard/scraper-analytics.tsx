"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { DashboardAnalytics, ScraperStatus } from "@/types/jobs";

const colors = ["#14b8a6", "#6366f1", "#f59e0b", "#22c55e"];

const statusTone: Record<ScraperStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  Running: "accent",
  Failed: "danger",
  Completed: "success",
  Idle: "neutral"
};

export function ScraperAnalytics({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-md border border-border bg-panel p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Scraper Analytics</h2>
            <p className="text-sm text-muted">Throughput, success rate, and latest run state</p>
          </div>
          <Badge tone="accent">Live</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-background text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">Scraper</th>
                  <th className="px-3 py-2">Jobs Found</th>
                  <th className="px-3 py-2">Success</th>
                  <th className="px-3 py-2">Last Run</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.scrapers.map((scraper) => (
                  <tr key={scraper.source} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{scraper.source}</td>
                    <td className="px-3 py-2">{scraper.jobsFound.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2">{scraper.successRate}%</td>
                    <td className="px-3 py-2 text-muted">{formatRelativeTime(scraper.lastRunTime)}</td>
                    <td className="px-3 py-2">
                      <Badge tone={statusTone[scraper.status]}>{scraper.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.scrapers} dataKey="jobsFound" nameKey="source" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {analytics.scrapers.map((entry, index) => (
                    <Cell key={entry.source} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-panel p-4">
        <h2 className="text-sm font-semibold">Jobs Per Scraper</h2>
        <p className="mb-4 text-sm text-muted">Active collection volume</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.scrapers}>
              <XAxis dataKey="source" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="jobsFound" radius={[4, 4, 0, 0]}>
                {analytics.scrapers.map((entry, index) => (
                  <Cell key={entry.source} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
