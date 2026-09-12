import { CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { TutorStatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { TutorVerificationStatus } from "@/types/tutor";

interface HistoryItem {
  id:          string;
  from_status: string | null;
  to_status:   string;
  reason:      string | null;
  created_at:  string;
  profiles:    { full_name: string } | { full_name: string }[] | null;
}

interface VerificationHistoryProps {
  history: HistoryItem[];
}

export function VerificationHistory({ history }: VerificationHistoryProps) {
  return (
    <Card padding="none">
      <div className="border-b border-neutral-100 px-5 py-4">
        <CardTitle>Verification History</CardTitle>
      </div>
      <ul className="divide-y divide-neutral-50">
        {history.map((item) => {
          const admin = Array.isArray(item.profiles)
            ? item.profiles[0]
            : item.profiles;
          return (
            <li key={item.id} className="flex items-start gap-3 px-5 py-4">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {item.from_status && (
                    <>
                      <TutorStatusBadge status={item.from_status as TutorVerificationStatus} showDot={false} />
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                    </>
                  )}
                  <TutorStatusBadge status={item.to_status as TutorVerificationStatus} showDot={false} />
                </div>
                {item.reason && (
                  <p className="mt-0.5 text-xs text-neutral-500">{item.reason}</p>
                )}
                <p className="mt-0.5 text-xs text-neutral-400">
                  {admin?.full_name ?? "System"} · {formatDate(item.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
