"use client";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { useMemo, useRef } from "react";
import { AllCommunityModule, ModuleRegistry, type ColDef, type GridApi, type GridReadyEvent, type RowClickedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/utils";
import { useDashboardStore } from "@/store/dashboard-store";
import type { Job, JobStatus } from "@/types/jobs";

const statuses: JobStatus[] = ["UNAPPLIED", "APPLIED", "INTERVIEW", "REJECTED", "OFFER", "EXPIRED", "SAVED"];

ModuleRegistry.registerModules([AllCommunityModule]);

export function JobGrid({ jobs }: { jobs: Job[] }) {
  const gridRef = useRef<GridApi<Job> | null>(null);
  const selectJob = useDashboardStore((state) => state.selectJob);
  const updateStatus = useDashboardStore((state) => state.updateStatus);
  const pushToast = useDashboardStore((state) => state.pushToast);
  const darkMode = useDashboardStore((state) => state.darkMode);

  const columnDefs = useMemo<ColDef<Job>[]>(
    () => [
      {
        headerName: "Job Title",
        field: "jobTitle",
        pinned: "left",
        minWidth: 240,
        checkboxSelection: true,
        cellRenderer: ({ data, value }: { data: Job; value: string }) => (
          <button className="text-left font-medium text-foreground hover:underline" onClick={() => selectJob(data)}>
            {value}
          </button>
        )
      },
      { headerName: "Company", field: "company", minWidth: 180 },
      { headerName: "Location", field: "location", minWidth: 180 },
      { headerName: "Salary", field: "salary", minWidth: 130 },
      { headerName: "Experience", field: "experienceRequired", minWidth: 140 },
      { headerName: "Employment Type", field: "employmentType", minWidth: 150 },
      { headerName: "Source", field: "source", minWidth: 120, filter: true },
      {
        headerName: "Posted",
        field: "postedTime",
        minWidth: 110,
        valueFormatter: ({ value }) => formatRelativeTime(value)
      },
      {
        headerName: "Scraped",
        field: "scrapedTime",
        minWidth: 110,
        sort: "desc",
        valueFormatter: ({ value }) => formatRelativeTime(value)
      },
      {
        headerName: "GPT Score",
        field: "gptRelevanceScore",
        minWidth: 120,
        cellRenderer: ({ value }: { value: number }) => (
          <span className={value >= 88 ? "font-semibold text-teal-600" : "font-medium"}>{value}</span>
        )
      },
      {
        headerName: "Match %",
        field: "matchPercentage",
        minWidth: 120,
        valueFormatter: ({ value }) => `${value}%`
      },
      {
        headerName: "Apply",
        field: "applyLink",
        minWidth: 120,
        cellRenderer: ({ data }: { data: Job }) => (
          <Button
            size="sm"
            variant="primary"
            onClick={(event) => {
              event.stopPropagation();
              window.open(data.applyLink, "_blank", "noopener,noreferrer");
              pushToast({
                tone: "info",
                title: "Apply link opened",
                description: `${data.jobTitle} at ${data.company}`
              });
            }}
          >
            <ExternalLink className="h-3 w-3" />
            Apply
          </Button>
        )
      },
      {
        headerName: "Status",
        field: "status",
        minWidth: 140,
        cellRenderer: ({ value }: { value: JobStatus }) => <StatusBadge status={value} />
      },
      { headerName: "Notes", field: "notes", minWidth: 260, editable: true },
      {
        headerName: "Quick Actions",
        minWidth: 190,
        pinned: "right",
        cellRenderer: ({ data }: { data: Job }) => (
          <select
            className="h-8 rounded-md border border-border bg-background px-2 text-xs"
            value={data.status}
            onChange={(event) => updateStatus(data.id, event.target.value as JobStatus)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )
      }
    ],
    [pushToast, selectJob, updateStatus]
  );

  function onGridReady(event: GridReadyEvent<Job>) {
    gridRef.current = event.api;
  }

  function onRowClicked(event: RowClickedEvent<Job>) {
    if (event.data) selectJob(event.data);
  }

  return (
    <div className={darkMode ? "ag-theme-quartz-dark h-[620px]" : "ag-theme-quartz h-[620px]"}>
      <AgGridReact<Job>
        rowData={jobs}
        columnDefs={columnDefs}
        theme="legacy"
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
          floatingFilter: true
        }}
        rowSelection="multiple"
        animateRows
        pagination
        paginationPageSize={50}
        rowBuffer={20}
        suppressCellFocus
        onGridReady={onGridReady}
        onRowClicked={onRowClicked}
        getRowClass={({ data }) => (data?.isNew ? "new-job-row" : "")}
      />
    </div>
  );
}
