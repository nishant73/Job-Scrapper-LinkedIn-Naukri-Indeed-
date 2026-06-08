import { Activity, BriefcaseBusiness, CheckCircle2, Sparkles } from "lucide-react";
import type { DashboardAnalytics } from "@/types/jobs";

const items = [
  { key: "totalJobsFound", label: "Total jobs found", icon: BriefcaseBusiness },
  { key: "totalActiveJobs", label: "Active jobs", icon: Activity },
  { key: "jobsScrapedToday", label: "Scraped today", icon: Sparkles },
  { key: "successRate", label: "Success rate", icon: CheckCircle2, suffix: "%" }
] as const;

export function KpiStrip({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="rounded-md border border-border bg-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm text-muted">{item.label}</div>
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-normal">
              {analytics[item.key].toLocaleString("en-IN")}
              {"suffix" in item ? item.suffix : ""}
            </div>
          </div>
        );
      })}
    </section>
  );
}
