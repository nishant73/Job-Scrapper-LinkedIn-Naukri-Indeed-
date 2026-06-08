import { NextResponse } from "next/server";
import type { DashboardAnalytics, Job, ScraperMetric, ScraperSource, ScraperStatus } from "@/types/jobs";

export async function GET(request: Request) {
  const jobsUrl = new URL("/api/jobs", request.url);
  const response = await fetch(jobsUrl, { cache: "no-store" });
  const data = (await response.json()) as { jobs?: Job[] };
  const jobs = data.jobs ?? [];
  const today = new Date().toDateString();
  const sources: ScraperSource[] = ["LinkedIn", "Naukri", "Indeed", "Company Site"];
  const scrapers: ScraperMetric[] = sources
    .map((source) => {
      const sourceJobs = jobs.filter((job) => job.source === source);
      const latest = sourceJobs[0]?.scrapedTime ?? new Date().toISOString();

      const status: ScraperStatus = sourceJobs.length ? "Completed" : "Idle";

      return {
        source,
        jobsFound: sourceJobs.length,
        activeJobs: sourceJobs.filter((job) => job.status !== "EXPIRED" && job.status !== "REJECTED").length,
        successRate: sourceJobs.length ? 100 : 0,
        lastRunTime: latest,
        status,
        averageScore: sourceJobs.length
          ? Math.round(sourceJobs.reduce((sum, job) => sum + job.gptRelevanceScore, 0) / sourceJobs.length)
          : 0
      };
    })
    .filter((metric) => metric.jobsFound > 0);

  const analytics: DashboardAnalytics = {
    totalJobsFound: jobs.length,
    totalActiveJobs: jobs.filter((job) => job.status !== "EXPIRED" && job.status !== "REJECTED").length,
    jobsScrapedToday: jobs.filter((job) => new Date(job.scrapedTime).toDateString() === today).length,
    successRate: jobs.length ? 100 : 0,
    scrapers
  };

  return NextResponse.json(analytics);
}
