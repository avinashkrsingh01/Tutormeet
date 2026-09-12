import { Badge, type BadgeVariant } from "./Badge";
import type { TutorVerificationStatus } from "@/types/tutor";
import type { RequirementStatus } from "@/types/requirement";

// ─── Tutor verification status ────────────────────────────────────────────────

const tutorStatusConfig: Record<
  TutorVerificationStatus,
  { label: string; variant: BadgeVariant; dot?: boolean }
> = {
  draft:                { label: "Draft",                variant: "gray",   dot: true },
  pending:              { label: "Pending",              variant: "gray",   dot: true },
  profile_submitted:    { label: "Profile Submitted",    variant: "navy",   dot: true },
  documents_pending:    { label: "Documents Needed",     variant: "orange", dot: true },
  under_review:         { label: "Under Review",         variant: "orange", dot: true },
  assessment_pending:   { label: "Assessment Pending",   variant: "yellow", dot: true },
  interview_pending:    { label: "Interview Pending",    variant: "yellow", dot: true },
  verified:             { label: "Verified",             variant: "teal",   dot: true },
  rejected:             { label: "Not Approved",         variant: "red",    dot: true },
  suspended:            { label: "Suspended",            variant: "red",    dot: true },
};

export function TutorStatusBadge({
  status,
  showDot = true,
}: {
  status: TutorVerificationStatus;
  showDot?: boolean;
}) {
  const { label, variant, dot } = tutorStatusConfig[status];
  return (
    <Badge variant={variant} dot={showDot && dot}>
      {label}
    </Badge>
  );
}

// ─── Requirement status ───────────────────────────────────────────────────────

const requirementStatusConfig: Record<
  RequirementStatus,
  { label: string; variant: BadgeVariant; dot?: boolean }
> = {
  draft:           { label: "Draft",            variant: "gray",   dot: true },
  submitted:       { label: "Submitted",        variant: "navy",   dot: true },
  matching:        { label: "Finding Tutors",   variant: "orange", dot: true },
  shortlisted:     { label: "Tutors Ready",     variant: "blue",   dot: true },
  demo_scheduled:  { label: "Demo Scheduled",   variant: "yellow", dot: true },
  tutor_selected:  { label: "Tutor Selected",   variant: "teal",   dot: true },
  active:          { label: "Active",           variant: "green",  dot: true },
  completed:       { label: "Completed",        variant: "green",  dot: true },
  cancelled:       { label: "Cancelled",        variant: "red",    dot: true },
};

export function RequirementStatusBadge({
  status,
  showDot = true,
}: {
  status: RequirementStatus;
  showDot?: boolean;
}) {
  const { label, variant, dot } = requirementStatusConfig[status];
  return (
    <Badge variant={variant} dot={showDot && dot}>
      {label}
    </Badge>
  );
}

// ─── Document status ──────────────────────────────────────────────────────────

export function DocumentStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const config = {
    pending:  { label: "Pending Review", variant: "yellow" as BadgeVariant },
    approved: { label: "Approved",       variant: "teal"   as BadgeVariant },
    rejected: { label: "Rejected",       variant: "red"    as BadgeVariant },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

// ─── Demo status ──────────────────────────────────────────────────────────────

export function DemoStatusBadge({
  status,
}: {
  status: "requested" | "tutor_accepted" | "scheduled" | "completed" | "cancelled" | "no_show";
}) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    requested:      { label: "Requested",      variant: "navy"   },
    tutor_accepted: { label: "Tutor Accepted",  variant: "blue"   },
    scheduled:      { label: "Scheduled",       variant: "teal"   },
    completed:      { label: "Completed",       variant: "green"  },
    cancelled:      { label: "Cancelled",       variant: "gray"   },
    no_show:        { label: "No Show",         variant: "orange" },
  };
  const { label, variant } = config[status] ?? { label: status, variant: "gray" as BadgeVariant };
  return <Badge variant={variant} dot>{label}</Badge>;
}
