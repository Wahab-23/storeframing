"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  MessageSquare,
  Eye,
  Shield,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
} from "@/components/admin/AdminUI";

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filtered = customers.filter((c) => {
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
    const email = (c.email || "").toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const activeCount = customers.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Directory"
        description="Buyer accounts, registered user activity, purchase history, and account moderation."
        badge={`${customers.length} Registered Buyers`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Customers" },
        ]}
        actions={
          <Link
            href="/admin/customers/reviews"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-sunflower-100/20 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Reviews Moderation
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total Customer Base"
          value={customers.length}
          subtext="Registered shopping accounts"
          icon={Users}
          variant="gold"
        />
        <AdminStatCard
          label="Active Accounts"
          value={activeCount}
          subtext="Eligible to browse and purchase"
          icon={UserCheck}
          variant="green"
        />
        <AdminStatCard
          label="Buyer Retention"
          value="High"
          subtext="Repeat purchase engagement"
          icon={Shield}
          variant="blue"
        />
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer name or email..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: "Active", value: "ACTIVE" },
          { label: "Inactive", value: "INACTIVE" },
          { label: "Suspended", value: "SUSPENDED" },
        ]}
        onRefresh={fetchCustomers}
        isRefreshing={loading}
      />

      <AdminTable
        headers={[
          "Customer Name",
          "Email Address",
          "Registration Date",
          "Account Status",
        ]}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No customer accounts found matching your query."
        colSpan={4}
      >
        {filtered.map((customer) => {
          const fullName =
            `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
            "Anonymous Buyer";

          return (
            <tr
              key={customer.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5">
                <div className="font-semibold text-white-chalk-100">
                  {fullName}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono">
                  ID: {customer.id}
                </div>
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 text-white-chalk-100/80 text-xs">
                  <Mail className="w-3.5 h-3.5 text-munsell-blue-100" />
                  <span>{customer.email}</span>
                </div>
              </td>

              <td className="px-5 py-3.5 text-white-chalk-100/50 text-xs font-mono">
                {new Date(customer.createdAt).toLocaleDateString()}
              </td>

              <td className="px-5 py-3.5">
                <AdminBadge status={customer.status} />
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
