import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateUserDialog } from "./create-user-dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { SearchInput } from "@/components/admin/search-input";
import { HighlightText } from "@/components/admin/highlight-text";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await searchParams;
  const supabase = await createClient();
  const adminAuth = createAdminClient();

  let usersQuery = supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      full_name,
      role,
      phone,
      created_at,
      active_until,
      trial_started_at,
      trial_ends_at,
      current_plan_id,
      subscription_plans(name)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (query) {
    usersQuery = usersQuery.or(
      `email.ilike.%${query}%,full_name.ilike.%${query}%`,
    );
  }

  const { data: users, error } = await usersQuery;

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-600">
        Error fetching users: {error.message}
      </div>
    );
  }

  // Fetch auth data for these users to check email confirmation status
  const usersWithAuth = await Promise.all(
    (users || []).map(async (user: any) => {
      // Kita fetch satu per satu untuk akurasi karena listUsers bulk
      // mungkin tidak sync urutannya jika ada filtering query
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await adminAuth.auth.admin.getUserById(user.id);

        return {
          ...user,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          is_confirmed: !!authUser?.email_confirmed_at,
        };
      } catch (e) {
        console.error(`Failed to fetch auth user for ${user.id}`, e);
        return {
          ...user,
          email_confirmed_at: null,
          is_confirmed: false,
        };
      }
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Kelola pengguna dan status langganan mereka.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="max-w-sm">
        <SearchInput placeholder="Search users..." />
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  User
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Contact
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Activation
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Role
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Plan
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Dates
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {usersWithAuth?.map((user: any) => (
                <tr
                  key={user.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        <HighlightText
                          text={user.full_name || "No Name"}
                          highlight={query || ""}
                        />
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ID: {user.id.substring(0, 8)}...
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col text-sm">
                      <span>
                        <HighlightText
                          text={user.email}
                          highlight={query || ""}
                        />
                      </span>
                      {user.phone && (
                        <span className="text-xs text-muted-foreground">
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {user.is_confirmed ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full w-fit">
                          Verified
                        </span>
                        {user.email_confirmed_at && (
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {format(
                              new Date(user.email_confirmed_at),
                              "dd MMM",
                              { locale: id },
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.subscription_plans?.name || "Free"}
                      </span>
                      {user.current_plan_id && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {user.current_plan_id.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {/* Logic status sederhana based on active_until */}
                    {user.active_until &&
                    new Date(user.active_until) > new Date() ? (
                      <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    ) : user.trial_ends_at &&
                      new Date(user.trial_ends_at) > new Date() ? (
                      <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                        Trial
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium text-xs bg-gray-100 px-2 py-1 rounded-full dark:bg-zinc-800 dark:text-gray-400">
                        Expired
                      </span>
                    )}
                  </td>
                  <td className="p-4 align-middle text-xs">
                    <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-1">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>
                        {format(new Date(user.created_at), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </span>

                      {user.active_until && (
                        <>
                          <span className="text-muted-foreground">Active:</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {format(
                              new Date(user.active_until),
                              "dd MMM yyyy",
                              {
                                locale: id,
                              },
                            )}
                          </span>
                        </>
                      )}

                      {user.trial_ends_at && !user.active_until && (
                        <>
                          <span className="text-muted-foreground">Trial:</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {format(
                              new Date(user.trial_ends_at),
                              "dd MMM yyyy",
                              {
                                locale: id,
                              },
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {usersWithAuth?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Tidak ada user ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
