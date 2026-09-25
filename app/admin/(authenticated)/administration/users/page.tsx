"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Store,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
} from "@/components/admin/AdminUI";

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string;
  seller?: {
    shopName: string;
    slug: string;
  } | null;
  roleAssignments?: Array<{
    role: {
      slug: string;
    };
  }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();

      if (data.data?.users) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else if (Array.isArray(data.data)) {
        setUsers(data.data);
        setTotalCount(data.data.length);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
        );
      }
    } catch (err) {
      console.error("Error toggling user status:", err);
    }
  };

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin & Staff Accounts"
        description="User access control, role assignments, merchant operators, and administrative privileges."
        badge={`${totalCount} Total Accounts`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Administration" },
          { label: "Users" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total System Users"
          value={totalCount}
          subtext="Admins, staff, and seller operators"
          icon={Users}
          variant="gold"
        />
        <AdminStatCard
          label="Active Privileges"
          value={activeCount}
          subtext="Operational authentication status"
          icon={UserCheck}
          variant="green"
        />
        <AdminStatCard
          label="Security Standard"
          value="RBAC Enforced"
          subtext="Granular permission checking"
          icon={Shield}
          variant="blue"
        />
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, or phone..."
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        statusOptions={[
          { label: "Active", value: "ACTIVE" },
          { label: "Suspended", value: "SUSPENDED" },
          { label: "Inactive", value: "INACTIVE" },
        ]}
        onRefresh={fetchUsers}
        isRefreshing={loading}
      />

      <AdminTable
        headers={[
          "Account User",
          "Contact",
          "Assigned Roles",
          "Associated Store",
          "Status",
          "Actions",
        ]}
        loading={loading}
        isEmpty={users.length === 0}
        emptyMessage="No system users found matching the query."
        colSpan={6}
      >
        {users.map((u) => {
          const fullName =
            `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User";
          const roles = u.roleAssignments?.map((r) => r.role.slug) || [];

          return (
            <tr
              key={u.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5">
                <div className="font-semibold text-white-chalk-100">
                  {fullName}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono">
                  ID: {u.id}
                </div>
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 text-white-chalk-100/90 text-xs">
                  <Mail className="w-3.5 h-3.5 text-sunflower-100" />
                  <span>{u.email}</span>
                </div>
                {u.phone && (
                  <div className="text-[11px] text-white-chalk-100/40 font-mono mt-0.5">
                    {u.phone}
                  </div>
                )}
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 flex-wrap">
                  {roles.length === 0 ? (
                    <span className="text-white-chalk-100/40 text-xs">Standard</span>
                  ) : (
                    roles.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20 uppercase"
                      >
                        {r}
                      </span>
                    ))
                  )}
                </div>
              </td>

              <td className="px-5 py-3.5">
                {u.seller ? (
                  <div className="flex items-center gap-1 text-white-chalk-100 font-medium">
                    <Store className="w-3.5 h-3.5 text-munsell-blue-100" />
                    <span>{u.seller.shopName}</span>
                  </div>
                ) : (
                  <span className="text-white-chalk-100/40 text-xs">Platform Internal</span>
                )}
              </td>

              <td className="px-5 py-3.5">
                <AdminBadge status={u.status} />
              </td>

              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => handleToggleStatus(u.id, u.status)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    u.status === "ACTIVE"
                      ? "border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/60 hover:text-cadmium-red-200"
                      : "border-white-chalk-100/10 hover:border-pablano-100/30 text-white-chalk-100/60 hover:text-pablano-200"
                  }`}
                  title={u.status === "ACTIVE" ? "Suspend Access" : "Activate Access"}
                >
                  {u.status === "ACTIVE" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                </button>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalCount}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
