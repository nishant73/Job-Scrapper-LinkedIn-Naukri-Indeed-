import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/types/jobs";

const statusTone: Record<JobStatus, React.ComponentProps<typeof Badge>["tone"]> = {
  UNAPPLIED: "neutral",
  APPLIED: "accent",
  INTERVIEW: "violet",
  REJECTED: "danger",
  OFFER: "success",
  EXPIRED: "warning",
  SAVED: "success"
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}
