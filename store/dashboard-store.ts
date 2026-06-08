"use client";

import { create } from "zustand";
import type { Job, JobFilters, JobStatus, SavedSearch } from "@/types/jobs";

type Toast = {
  id: string;
  title: string;
  description: string;
  tone: "success" | "warning" | "danger" | "info";
};

type DashboardState = {
  jobs: Job[];
  selectedJob?: Job;
  filters: JobFilters;
  savedSearches: SavedSearch[];
  toasts: Toast[];
  hiddenColumns: string[];
  darkMode: boolean;
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateStatus: (jobId: string, status: JobStatus) => void;
  selectJob: (job?: Job) => void;
  updateFilters: (filters: Partial<JobFilters>) => void;
  setSavedSearches: (savedSearches: SavedSearch[]) => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  toggleColumn: (columnId: string) => void;
  toggleTheme: () => void;
};

const defaultFilters: JobFilters = {
  query: "",
  sources: [],
  statuses: [],
  workModes: [],
  companies: [],
  locations: [],
  minScore: 0
};

export const useDashboardStore = create<DashboardState>((set) => ({
  jobs: [],
  filters: defaultFilters,
  savedSearches: [],
  toasts: [],
  hiddenColumns: [],
  darkMode: false,
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs.filter((item) => item.id !== job.id)]
    })),
  updateStatus: (jobId, status) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === jobId ? { ...job, status } : job)),
      selectedJob:
        state.selectedJob?.id === jobId ? { ...state.selectedJob, status } : state.selectedJob
    })),
  selectJob: (job) => set({ selectedJob: job }),
  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  setSavedSearches: (savedSearches) => set({ savedSearches }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        {
          id: crypto.randomUUID(),
          ...toast
        },
        ...state.toasts
      ].slice(0, 5)
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),
  toggleColumn: (columnId) =>
    set((state) => ({
      hiddenColumns: state.hiddenColumns.includes(columnId)
        ? state.hiddenColumns.filter((id) => id !== columnId)
        : [...state.hiddenColumns, columnId]
    })),
  toggleTheme: () =>
    set((state) => {
      document.documentElement.classList.toggle("dark", !state.darkMode);
      return { darkMode: !state.darkMode };
    })
}));
