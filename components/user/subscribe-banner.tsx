import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SubscribeBanner({
  show = true,
  title = "Upgrade ke Premium",
  desc = "Buka fitur eksklusif untuk journal & presentasi kamu.",
  cta = "Subscribe",
}: {
  show?: boolean;
  title?: string;
  desc?: string;
  cta?: string;
}) {
  if (!show) return null;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/subscribe">{cta}</Link>
        </Button>
      </div>
    </Card>
  );
}
