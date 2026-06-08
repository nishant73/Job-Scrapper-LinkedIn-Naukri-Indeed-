"use client";

import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { ScraperAnalytics } from "@/components/dashboard/scraper-analytics";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/layout/toaster";
import { FiltersBar } from "@/components/jobs/filters-bar";
import { JobDetailsDrawer } from "@/components/jobs/job-details-drawer";
import { JobGrid } from "@/components/jobs/job-grid";
import { fetchAnalytics, fetchJobs, fetchSavedSearches } from "@/lib/api/jobs";
import { useLiveJobs } from "@/hooks/use-live-jobs";
import { useDashboardStore } from "@/store/dashboard-store";
import type { Job } from "@/types/jobs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false
    }
  }
});

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
}

function DashboardPage() {
  useLiveJobs();
  const [mounted, setMounted] = useState(false);
  const jobs = useDashboardStore((state) => state.jobs);
  const setJobs = useDashboardStore((state) => state.setJobs);
  const filters = useDashboardStore((state) => state.filters);
  const setSavedSearches = useDashboardStore((state) => state.setSavedSearches);
  const pushToast = useDashboardStore((state) => state.pushToast);

  const jobsQuery = useQuery({
    queryKey: ["jobs", filters],
    queryFn: () => fetchJobs(filters)
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics
  });

  const searchesQuery = useQuery({
    queryKey: ["saved-searches"],
    queryFn: fetchSavedSearches
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (jobsQuery.data) setJobs(jobsQuery.data);
  }, [jobsQuery.data, setJobs]);

  useEffect(() => {
    if (searchesQuery.data) setSavedSearches(searchesQuery.data);
  }, [searchesQuery.data, setSavedSearches]);

  const filteredJobs = useMemo(() => applyClientFilters(jobs, filters), [jobs, filters]);

  function exportCsv() {
    const headers = [
      "Job Title",
      "Company",
      "Location",
      "Salary",
      "Experience Required",
      "Employment Type",
      "Source",
      "Posted Time",
      "Scraped Time",
      "GPT Relevance Score",
      "Match Percentage",
      "Apply Link",
      "Job Status",
      "Notes"
    ];
    const rows = filteredJobs.map((job) => [
      job.jobTitle,
      job.company,
      job.location,
      job.salary ?? "",
      job.experienceRequired,
      job.employmentType,
      job.source,
      job.postedTime,
      job.scrapedTime,
      job.gptRelevanceScore,
      job.matchPercentage,
      job.applyLink,
      job.status,
      job.notes
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `job-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast({
      tone: "success",
      title: "Export ready",
      description: `${filteredJobs.length} jobs exported to CSV.`
    });
  }

  if (!mounted) return null;

  return (
    <AppShell>
      {analyticsQuery.data ? <KpiStrip analytics={analyticsQuery.data} /> : null}
      {analyticsQuery.data ? <ScraperAnalytics analytics={analyticsQuery.data} /> : null}
      <FiltersBar onExport={exportCsv} />
      <section className="overflow-hidden rounded-md border border-border bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Live Job Feed</h2>
            <p className="text-sm text-muted">
              {filteredJobs.length.toLocaleString("en-IN")} jobs · New jobs appear at the top
            </p>
          </div>
          <div className="text-xs text-muted">Sticky headers · Resizable columns · Multi-filter · Bulk select · Pagination</div>
        </div>
        <JobGrid jobs={filteredJobs} />
      </section>
      <JobDetailsDrawer />
      <Toaster />
    </AppShell>
  );
}

function applyClientFilters(jobs: Job[], filters: ReturnType<typeof useDashboardStore.getState>["filters"]) {
  return jobs.filter((job) => {
    if (filters.minScore && job.gptRelevanceScore < filters.minScore) return false;
    if (filters.sources.length && !filters.sources.includes(job.source)) return false;
    if (filters.workModes.length && !filters.workModes.includes(job.workMode)) return false;
    if (filters.statuses.length && !filters.statuses.includes(job.status)) return false;
    if (filters.postedWithinDays) {
      const age = Date.now() - Date.parse(job.postedTime);
      if (age > filters.postedWithinDays * 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });
}
