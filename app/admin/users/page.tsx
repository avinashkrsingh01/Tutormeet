import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };

const roleVariant = {
  parent: "blue",
  tutor: "green",
  admin: "orange",
} as const;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at, avatar_url")
    .order("created_at", { ascending: false });

  return (
    <div>
      <DashboardHeader
        title="All Users"
        description="Every registered user across all roles."
      />

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users ?? []).map((u) => {
                const variant = roleVariant[u.role as keyof typeof roleVariant] ?? "gray";
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} src={u.avatar_url} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.phone ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge variant={variant}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={u.is_active ? "green" : "red"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
