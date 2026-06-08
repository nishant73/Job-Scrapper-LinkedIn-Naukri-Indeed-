import { savedSearches } from "@/lib/mock/jobs";
import type { DashboardAnalytics, Job, JobFilters, JobStatus, SavedSearch } from "@/types/jobs";

export async function fetchJobs(filters?: Partial<JobFilters>): Promise<Job[]> {
  const response = await fetch("/api/jobs", { cache: "no-store" });
  const data = (await response.json()) as { jobs?: Job[]; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to load scraper jobs.");
  }

  let jobs = [...(data.jobs ?? [])].sort((a, b) => Date.parse(b.scrapedTime) - Date.parse(a.scrapedTime));

  if (filters?.query) {
    const query = filters.query.toLowerCase();
    jobs = jobs.filter((job) =>
      [job.jobTitle, job.company, job.location, job.source, job.description]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  if (filters?.sources?.length) {
    jobs = jobs.filter((job) => filters.sources?.includes(job.source));
  }

  if (filters?.statuses?.length) {
    jobs = jobs.filter((job) => filters.statuses?.includes(job.status));
  }

  if (filters?.workModes?.length) {
    jobs = jobs.filter((job) => filters.workModes?.includes(job.workMode));
  }

  if (filters?.minScore) {
    jobs = jobs.filter((job) => job.gptRelevanceScore >= filters.minScore!);
  }

  return jobs;
}

export async function fetchAnalytics(): Promise<DashboardAnalytics> {
  const response = await fetch("/api/analytics", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load scraper analytics.");
  return response.json();
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  return savedSearches;
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<{ jobId: string; status: JobStatus }> {
  return { jobId, status };
}

export async function trackApplyClick(jobId: string): Promise<{ jobId: string; openedAt: string }> {
  return { jobId, openedAt: new Date().toISOString() };
}
