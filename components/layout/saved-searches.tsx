"use client";

import { Bookmark, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardStore } from "@/store/dashboard-store";

export function SavedSearches() {
  const searches = useDashboardStore((state) => state.savedSearches);
  const updateFilters = useDashboardStore((state) => state.updateFilters);

  return (
    <div className="space-y-5">
      <nav className="space-y-1">
        <Button className="w-full justify-start" variant="ghost">
          <Clock className="h-4 w-4" />
          Live Feed
        </Button>
        <Button className="w-full justify-start" variant="ghost">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </Button>
      </nav>

      <section>
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">Saved Searches</div>
        <div className="space-y-1">
          {searches.map((search) => (
            <Button
              key={search.id}
              className="w-full justify-start"
              variant="ghost"
              onClick={() => updateFilters(search.filters)}
            >
              <Bookmark className="h-4 w-4" />
              {search.name}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
