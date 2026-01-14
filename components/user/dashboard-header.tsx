import { UserMenu } from "@/components/user/user-menu";

export function DashboardHeader({
  title,
  subtitle,
  initials = "U",
}: {
  title: string;
  subtitle?: string;
  initials?: string;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold leading-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <UserMenu initials={initials} />
    </div>
  );
}
