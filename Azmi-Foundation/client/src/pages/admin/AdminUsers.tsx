import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/schema";

export default function AdminUsers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

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
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "User role updated" });
    },
    onError: () => toast({ title: "Error updating role", variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">{users?.length || 0} registered users</p>
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
                    ) : users.map(u => (
                      <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                              {u.profileImageUrl ? <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" /> : (u.firstName?.[0] || "?")}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{u.email || "—"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {u.role === "admin" ? (
                              <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                <Shield className="w-3 h-3" /> Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                <UserCheck className="w-3 h-3" /> User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-500">
                          {new Date(u.createdAt!).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {u.id !== currentUser?.id && (
                            <Select
                              value={u.role}
                              onValueChange={role => updateRole.mutate({ id: u.id, role })}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {u.id === currentUser?.id && (
                            <span className="text-xs text-gray-400">You</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
