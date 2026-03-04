import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResyncButton } from "./resync-button";
import { MidtransDebugButton } from "./midtrans-debug-button";
import { RefreshButton } from "./refresh-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Clock, Shield } from "lucide-react";

import { KPICards } from "./kpi-cards";
import { isSameDay, isSameMonth } from "date-fns";
import { SearchInput } from "@/components/admin/search-input";
import { HighlightText } from "@/components/admin/highlight-text";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q: query } = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  // Debug: Check Current User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(
    "[AdminPayments] Current User:",
    user?.id,
    user?.role,
    user?.email,
  );

  // 0️⃣ PRE-SEARCH LOGIC
  // If query exists, find target user IDs from profiles & intents first
  const filterUserIds = new Set<string>();

  if (query) {
    // A. Search Profiles (Email/Name)
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(50);

    profiles?.forEach((p) => filterUserIds.add(p.id));

    // B. Search Intents (Order ID) -> Get User IDs
    const { data: intents } = await admin
      .from("payment_intents")
      .select("user_id")
      .ilike("midtrans_order_id", `%${query}%`)
      .limit(50);

    intents?.forEach((i) => filterUserIds.add(i.user_id));
  }

  // 1️⃣ METRICS AGGREGATION
  // Fetch ALL paid payments for accurate KPI (lightweight query)
  let metricsQuery = admin
    .from("payments")
    .select("gross_amount, paid_at, user_id")
    .eq("status", "paid");

  // Apply Search Filter to Metrics
  if (query) {
    if (filterUserIds.size > 0) {
      metricsQuery = metricsQuery.in("user_id", Array.from(filterUserIds));
    } else {
      // Query exists but no matches found -> return empty
      metricsQuery = metricsQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000",
      );
    }
  }

  const { data: allPaidPayments } = await metricsQuery;

  const today = new Date();
  const metrics = (allPaidPayments || []).reduce(
    (acc, curr) => {
      const amount = Number(curr.gross_amount) || 0;
      const date = new Date(curr.paid_at);

      acc.total += amount;
      acc.count += 1;

      if (isSameMonth(date, today)) {
        acc.month += amount;
      }

      if (isSameDay(date, today)) {
        acc.today += amount;
      }

      return acc;
    },
    { total: 0, month: 0, today: 0, count: 0 },
  );

  // 🟢 TAB 1: Revenue (Payments)
  // Sumber resmi keuangan (hanya yang sukses masuk payments table)
  // Use admin client to bypass RLS
  let paymentsQuery = admin
    .from("payments")
    .select(
      `
      id,
      created_at,
      paid_at,
      status,
      gross_amount,
      payment_channel,
      provider,
      provider_order_id,
      userId:user_id,
      plan_id,
      subscription_plans (name)
    `,
    )
    .order("paid_at", { ascending: false })
    .limit(100);

  // Apply Search Filter to Payments
  if (query) {
    if (filterUserIds.size > 0) {
      paymentsQuery = paymentsQuery.in("user_id", Array.from(filterUserIds));
    } else {
      paymentsQuery = paymentsQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000",
      );
    }
  }

  const { data: paymentsRaw, error: paymentsError } = await paymentsQuery;

  if (paymentsError) {
    console.error(
      "[AdminPayments] Payments Error:",
      JSON.stringify(paymentsError, null, 2),
    );
  } else {
    console.log("[AdminPayments] Payments Count:", paymentsRaw?.length);
  }

  // 🟡 TAB 2: Monitoring (Payment Intents + Payments Join)
  // Audit trail untuk mendeteksi lost transactions
  // Use admin client to bypass RLS
  let monitoringQuery = admin
    .from("payment_intents")
    .select(
      `
      id,
      created_at,
      status,
      midtrans_order_id,
      final_price_idr,
      userId:user_id,
      payments (
        id,
        status,
        paid_at,
        payment_channel,
        provider
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  // Apply Search Filter to Monitoring
  if (query) {
    // For monitoring, we can search by Order ID directly OR by User ID
    if (filterUserIds.size > 0) {
      // Use OR condition: Order ID matches query OR User ID matches found users
      // Note: PostgREST OR syntax is tricky. simpler to just rely on filterUserIds
      // because we already searched Order IDs and added their user_ids to filterUserIds.
      // So filtering by user_id covers both cases!
      monitoringQuery = monitoringQuery.in(
        "user_id",
        Array.from(filterUserIds),
      );
    } else {
      // No users found (neither by profile nor by intent search)
      // Just try raw Order ID match on monitoring table as fallback
      monitoringQuery = monitoringQuery.ilike(
        "midtrans_order_id",
        `%${query}%`,
      );
    }
  }

  const { data: monitoringRaw, error: monitoringError } = await monitoringQuery;

  if (monitoringError) {
    console.error(
      "[AdminPayments] Monitoring Error:",
      JSON.stringify(monitoringError, null, 2),
    );
  } else {
    console.log("[AdminPayments] Monitoring Count:", monitoringRaw?.length);
  }

  // 🔴 TAB 3: Resync Logs
  // Log aktivitas resync manual
  let resyncLogsQuery = admin
    .from("payment_resync_logs")
    .select(
      `
      id,
      intent_id,
      order_id,
      checked_at,
      midtrans_status,
      midtrans_response_code,
      triggered_rpc,
      admin_user_id,
      error_message
      `
    )
    .order("checked_at", { ascending: false })
    .limit(50);

  if (query) {
      resyncLogsQuery = resyncLogsQuery.ilike("order_id", `%${query}%`);
  }

  const { data: resyncLogsRaw, error: resyncLogsError } = await resyncLogsQuery;

  if (resyncLogsError) {
    console.error("[AdminPayments] Resync Logs Error:", resyncLogsError);
  }

  // 🔵 MANUAL JOIN: Profiles
  // Karena payments.user_id references auth.users (bukan public.profiles),
  // PostgREST tidak bisa auto-join. Kita fetch manual.
  const userIds = new Set([
    ...(paymentsRaw?.map((p) => p.userId) || []),
    ...(monitoringRaw?.map((m) => m.userId) || []),
    ...(resyncLogsRaw?.map((r) => r.admin_user_id).filter(Boolean) || []),
  ]);

  let profileMap = new Map();
  if (userIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", Array.from(userIds));

    if (profiles) {
      profileMap = new Map(profiles.map((p) => [p.id, p]));
    }
  }

  // Attach profiles to data
  const payments = paymentsRaw?.map((p) => ({
    ...p,
    profiles: profileMap.get(p.userId) || {
      email: "Unknown",
      full_name: "Unknown",
    },
  }));

  const monitoring = monitoringRaw?.map((m) => ({
    ...m,
    profiles: profileMap.get(m.userId) || {
      email: "Unknown",
      full_name: "Unknown",
    },
  }));

  const resyncLogs = resyncLogsRaw?.map((r) => ({
    ...r,
    admin_profile: r.admin_user_id ? profileMap.get(r.admin_user_id) : null,
  }));

  // Helper untuk format currency
  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Audit</h1>
          <p className="text-muted-foreground">
            Kelola pendapatan dan monitoring status pembayaran.
          </p>
        </div>
        <RefreshButton />
      </div>

      <div className="flex w-full items-center gap-4">
        <SearchInput placeholder="Search by Email, Name, or Order ID..." />
      </div>

      <KPICards
        todayRevenue={metrics.today}
        monthRevenue={metrics.month}
        totalRevenue={metrics.total}
        transactionCount={metrics.count}
      />

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full max-w-[600px] grid-cols-3">
          <TabsTrigger value="revenue">Revenue (Resmi)</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring (Audit)</TabsTrigger>
          <TabsTrigger value="resync-logs">Resync Logs</TabsTrigger>
        </TabsList>

        {/* 🟢 TAB 1: REVENUE */}
        <TabsContent value="revenue" className="mt-4">
          <div className="rounded-md border bg-card">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Confirmed Revenue
              </h2>
              <p className="text-sm text-muted-foreground">
                Data pembayaran yang sukses tercatat di sistem (Table:
                payments).
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paid_at
                        ? format(
                            new Date(payment.paid_at),
                            "dd MMM yyyy HH:mm",
                            {
                              locale: id,
                            },
                          )
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          <HighlightText
                            text={payment.profiles?.full_name || "Unknown"}
                            highlight={query}
                          />
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <HighlightText
                            text={payment.profiles?.email}
                            highlight={query}
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.subscription_plans?.name || "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <HighlightText
                        text={payment.provider_order_id}
                        highlight={query}
                      />
                    </TableCell>
                    <TableCell>{formatIDR(payment.gross_amount)}</TableCell>
                    <TableCell>
                      {payment.payment_channel || payment.provider}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "paid" ? "default" : "destructive"
                        }
                        className={
                          payment.status === "paid"
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!payments || payments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Belum ada data revenue.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 🟡 TAB 2: MONITORING */}
        <TabsContent value="monitoring" className="mt-4">
          <div className="rounded-md border bg-card">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Payment Audit Trail
              </h2>
              <p className="text-sm text-muted-foreground">
                Gabungan data Intent & Payment untuk mendeteksi transaksi
                stuck/hilang.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created At</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Order ID (Midtrans)</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Intent Status</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoring?.map((item: any) => {
                  const hasPayment = item.payments && item.payments.length > 0;
                  const paymentStatus = hasPayment
                    ? item.payments[0].status
                    : "Not Created";

                  // Logic Deteksi Masalah
                  const isStuck =
                    item.status === "pending" &&
                    !hasPayment &&
                    new Date(item.created_at).getTime() <
                      Date.now() - 10 * 60 * 1000; // > 10 mins

                  return (
                    <TableRow
                      key={item.id}
                      className={
                        isStuck ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {format(new Date(item.created_at), "dd MMM HH:mm", {
                              locale: id,
                            })}
                          </span>
                          {isStuck && (
                            <span className="text-[10px] text-yellow-600 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> STUCK 10m+
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            <HighlightText
                              text={item.profiles?.full_name || "Unknown"}
                              highlight={query}
                            />
                          </span>
                          <span className="text-xs text-muted-foreground">
                            <HighlightText
                              text={item.profiles?.email}
                              highlight={query}
                            />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <HighlightText
                          text={item.midtrans_order_id}
                          highlight={query}
                        />
                      </TableCell>
                      <TableCell>{formatIDR(item.final_price_idr)}</TableCell>
                      <TableCell>
                        {hasPayment
                          ? item.payments[0].payment_channel ||
                            item.payments[0].provider
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            paymentStatus === "paid"
                              ? "default"
                              : paymentStatus === "Not Created"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ResyncButton intentId={item.id} />
                          <MidtransDebugButton intentId={item.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!monitoring || monitoring.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      Belum ada data monitoring.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 🔴 TAB 3: RESYNC LOGS */}
        <TabsContent value="resync-logs" className="mt-4">
          <div className="rounded-md border bg-card">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Resync Audit Logs
              </h2>
              <p className="text-sm text-muted-foreground">
                Riwayat manual sync yang dilakukan oleh admin.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Midtrans Status</TableHead>
                  <TableHead>Response Code</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resyncLogs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(log.checked_at), "dd MMM HH:mm:ss", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                        <span className="font-medium">
                          {log.admin_profile?.full_name || "System/Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.admin_profile?.email || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <HighlightText
                        text={log.order_id}
                        highlight={query}
                      />
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline">{log.midtrans_status || "N/A"}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                       {log.midtrans_response_code || "-"}
                    </TableCell>
                    <TableCell>
                       {log.error_message ? (
                         <Badge variant="destructive">Error</Badge>
                       ) : (
                         <Badge variant="default" className="bg-green-600">Success</Badge>
                       )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={log.error_message}>
                       {log.error_message || "Synced successfully"}
                    </TableCell>
                  </TableRow>
                ))}
                 {(!resyncLogs || resyncLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Belum ada log resync.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
