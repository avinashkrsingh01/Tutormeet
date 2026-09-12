import { cn } from "@/lib/utils";

// ─── Shell wrapper ──────────────────────────────────────────────────────────

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("min-h-screen bg-neutral-50", className)}>
      {children}
    </div>
  );
}

// ─── Page header ────────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  className?: string;
}

export function DashboardHeader({
  title,
  description,
  action,
  breadcrumb,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn("dash-header", className)}>
      <div className="min-w-0">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1 text-xs text-neutral-400">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-navy-700 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-neutral-600">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <h1 className="dash-title">{title}</h1>
        {description && (
          <p className="dash-subtitle">{description}</p>
        )}
      </div>

      {action && (
        <div className="flex flex-shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}

// ─── Page content wrapper ───────────────────────────────────────────────────

interface DashboardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <main className={cn("container-page py-8", className)}>
      {children}
    </main>
  );
}

// ─── Section within a dashboard page ───────────────────────────────────────

interface DashboardSectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          {title && (
            <div>
              <h2 className="text-base font-semibold text-navy-900 tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
              )}
            </div>
          )}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
