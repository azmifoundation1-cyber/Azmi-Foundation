import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, Star, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: meInfo } = useQuery<{ role: string; id: string }>({
    queryKey: ["/api/admin/me"],
    queryFn: () => fetch("/api/admin/me").then(r => r.json()),
  });

  const isSuperAdmin = meInfo?.role === "super_admin";

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetch("/api/admin/users").then(r => r.json()),
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "User role updated" });
    },
    onError: (err: any) => toast({ title: err.message || "Error updating role", variant: "destructive" }),
  });

  function RoleBadge({ role }: { role: string }) {
    if (role === "super_admin") return (
      <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Super Admin
      </span>
    );
    if (role === "admin") return (
      <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
        <Shield className="w-3 h-3" /> Admin
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
        <UserCheck className="w-3 h-3" /> User
      </span>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users?.length || 0} registered users
            {isSuperAdmin && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Super Admin View
              </span>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!users || users.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-gray-400">No users found</td></tr>
                    ) : users.map(u => {
                      const isCurrentUser = u.id === (currentUser as any)?.id || u.id === meInfo?.id;
                      const isTargetSuperAdmin = u.role === "super_admin";
                      // Super admins can change any role; regular admins can only flip user↔admin (not super_admin)
                      const canEdit = !isCurrentUser && (isSuperAdmin || !isTargetSuperAdmin);
                      return (
                        <tr key={u.id} className={`border-b hover:bg-gray-50 transition-colors ${isTargetSuperAdmin ? "bg-amber-50/40" : ""}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                {u.profileImageUrl
                                  ? <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                  : (u.firstName?.[0] || "?")}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {u.firstName} {u.lastName}
                                  {isTargetSuperAdmin && (
                                    <Star className="inline-block w-3.5 h-3.5 ml-1 fill-amber-400 text-amber-400" />
                                  )}
                                </p>
                                <p className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{u.email || "—"}</td>
                          <td className="py-3 px-4">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500">
                            {new Date(u.createdAt!).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {canEdit ? (
                              <Select
                                value={u.role}
                                onValueChange={role => updateRole.mutate({ id: u.id, role })}
                              >
                                <SelectTrigger className="h-7 w-32 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  {isSuperAdmin && (
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            ) : isCurrentUser ? (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                {isTargetSuperAdmin && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                                You
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
