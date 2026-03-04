import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  Music,
  Heart,
  ExternalLink,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch Key Metrics (Parallel)
  const [
    { count: usersCount },
    { count: couplesCount },
    { count: paymentsCount },
    { data: paymentsData },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("couples").select("*", { count: "exact", head: true }),
    admin
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid"),
    // Fetch limited payments to sum up (for efficiency, ideally use RPC for sum)
    // But for now, let's fetch last 1000 paid to estimate or just fetch all ID only to be safe?
    // Let's use a smarter approach: Just fetch `gross_amount` of paid transactions
    admin.from("payments").select("gross_amount").eq("status", "paid"),
  ]);

  const totalRevenue = (paymentsData || []).reduce(
    (acc, curr) => acc + (Number(curr.gross_amount) || 0),
    0,
  );

  // 2. Fetch Recent Activity
  const { data: recentCouples } = await admin
    .from("couples")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentPayments } = await admin
    .from("payments")
    .select("*, profiles(full_name, email)")
    .eq("status", "paid")
    .order("paid_at", { ascending: false })
    .limit(5);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email}. Here's what's happening today.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +{paymentsCount || 0} transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Couples
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{couplesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered couples</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Music Library</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage</div>
            <Link
              href="/admin/default-music"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View Library <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* RECENT COUPLES (Left - 4 cols) */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Couples</CardTitle>
            <CardDescription>
              New couples who just joined the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Couple</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCouples?.map((couple) => (
                  <TableRow key={couple.id}>
                    <TableCell>
                      <div className="font-medium">
                        {couple.male_name} & {couple.female_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /{couple.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {couple.relationship_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(couple.created_at), "dd MMM yyyy", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="icon" variant="ghost">
                        <Link
                          href={`/${couple.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentCouples || recentCouples.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No couples found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* RECENT PAYMENTS (Right - 3 cols) */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest successful transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentPayments?.map((payment: any) => (
                <div key={payment.id} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {payment.profiles?.full_name || "Unknown User"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.profiles?.email || "No email"}
                    </p>
                  </div>
                  <div className="ml-auto font-medium">
                    +{formatIDR(payment.gross_amount)}
                  </div>
                </div>
              ))}
              {(!recentPayments || recentPayments.length === 0) && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No recent payments.
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/payments">View All Transactions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
