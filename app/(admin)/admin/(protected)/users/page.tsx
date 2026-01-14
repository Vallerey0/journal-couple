import { createClient } from "@/utils/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      email,
      role,
      plan,
      subscription_status,
      trial_ends_at,
      active_until,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <pre className="text-xs text-red-500">
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}
