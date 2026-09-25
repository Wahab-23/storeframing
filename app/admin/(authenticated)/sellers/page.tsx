"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Store,
  ShieldCheck,
  Award,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Star,
  Users,
  Edit,
  Plus,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminModal,
} from "@/components/admin/AdminUI";

interface Seller {
  id: string;
  shopName: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED" | "CLOSED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  trustBadge: "NONE" | "VERIFIED_SELLER";
  completedOrderCount: number;
  positiveReviewCount: number;
  totalSales: number | string;
  totalOrders: number;
  averageRating: number | string;
  reviewCount: number;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  wallet?: {
    balance: number | string;
    pendingBalance: number | string;
    withdrawableBalance: number | string;
  } | null;
}

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (verificationFilter) params.set("verificationStatus", verificationFilter);

      const res = await fetch(`/api/admin/sellers?${params.toString()}`);
      const data = await res.json();

      if (data.data?.sellers) {
        setSellers(data.data.sellers);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else if (Array.isArray(data.data)) {
        setSellers(data.data);
        setTotalCount(data.data.length);
      }
    } catch (err) {
      console.error("Error fetching sellers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, verificationFilter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleUpdateStatus = async (sellerId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === sellerId ? { ...s, status: newStatus as Seller["status"] } : s
          )
        );
        if (selectedSeller && selectedSeller.id === sellerId) {
          setSelectedSeller({
            ...selectedSeller,
            status: newStatus as Seller["status"],
          });
        }
      }
    } catch (err) {
      console.error("Failed to update seller status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const activeSellers = sellers.filter((s) => s.status === "ACTIVE").length;
  const verifiedSellers = sellers.filter(
    (s) => s.verificationStatus === "VERIFIED"
  ).length;
  const pendingApprovals = sellers.filter((s) => s.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Seller Network"
        description="Oversee marketplace sellers, store statuses, KYC verification, and merchant performance."
        badge={`${totalCount} Total Vendors`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sellers" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/sellers/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sunflower-100/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vendor
            </Link>
            <Link
              href="/admin/sellers/approvals"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-sunflower-100/20 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Approvals Queue
            </Link>
            <Link
              href="/admin/sellers/verification"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-munsell-blue-100/20 bg-munsell-blue-100/10 text-munsell-blue-100 hover:bg-munsell-blue-100/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              KYC Documents
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Registered Merchants"
          value={totalCount}
          subtext="Onboarded across marketplace"
          icon={Store}
          variant="gold"
        />
        <AdminStatCard
          label="Active Stores"
          value={activeSellers}
          subtext="Taking customer orders"
          icon={CheckCircle}
          variant="green"
        />
        <AdminStatCard
          label="KYC Verified"
          value={verifiedSellers}
          subtext="Official documents approved"
          icon={ShieldCheck}
          variant="blue"
        />
        <AdminStatCard
          label="Pending Applications"
          value={pendingApprovals}
          subtext="Waiting for review"
          icon={Clock}
          variant="red"
        />
      </div>

      {/* Filters */}
      <AdminFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search store name, email or phone..."
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        statusOptions={[
          { label: "Active", value: "ACTIVE" },
          { label: "Pending", value: "PENDING" },
          { label: "Suspended", value: "SUSPENDED" },
          { label: "Rejected", value: "REJECTED" },
        ]}
        extraFilters={
          <select
            value={verificationFilter}
            onChange={(e) => {
              setVerificationFilter(e.target.value);
              setPage(1);
            }}
            className="bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-sunflower-100/50 cursor-pointer"
          >
            <option value="">All Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending KYC</option>
            <option value="UNVERIFIED">Unverified</option>
          </select>
        }
        onRefresh={fetchSellers}
        isRefreshing={loading}
      />

      {/* Sellers Table */}
      <AdminTable
        headers={[
          "Store / Merchant",
          "Account Holder",
          "Verification",
          "Rating & Sales",
          "Store Status",
          "Actions",
        ]}
        loading={loading}
        isEmpty={sellers.length === 0}
        emptyMessage="No sellers found matching the criteria."
        colSpan={6}
      >
        {sellers.map((seller) => {
          const rating = Number(seller.averageRating || 0).toFixed(1);
          const sales = Number(seller.totalSales || 0);

          return (
            <tr
              key={seller.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Store */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white-chalk-100 truncate">
                    {seller.shopName}
                  </div>
                  {seller.trustBadge === "VERIFIED_SELLER" && (
                    <span title="Verified Trust Badge" className="inline-flex">
                      <Award
                        className="w-4 h-4 text-sunflower-100 shrink-0"
                      />
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono truncate">
                  /{seller.slug}
                </div>
              </td>

              {/* Account User */}
              <td className="px-5 py-3.5">
                <div className="text-white-chalk-100/90 font-medium">
                  {seller.user
                    ? `${seller.user.firstName || ""} ${seller.user.lastName || ""}`.trim() || "Owner"
                    : "—"}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 truncate">
                  {seller.user?.email || "No email"}
                </div>
              </td>

              {/* Verification */}
              <td className="px-5 py-3.5">
                <AdminBadge status={seller.verificationStatus} />
              </td>

              {/* Rating & Sales */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1 text-sunflower-100 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{rating}</span>
                  <span className="text-white-chalk-100/40 text-[10px] font-normal">
                    ({seller.reviewCount})
                  </span>
                </div>
                <div className="text-[11px] text-white-chalk-100/60 font-mono">
                  Rs {sales.toLocaleString()} ({seller.totalOrders} orders)
                </div>
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={seller.status} />
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/admin/sellers/${seller.id}/edit`}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="Edit Vendor Store"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setSelectedSeller(seller)}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="View Seller Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {seller.status === "ACTIVE" ? (
                    <button
                      onClick={() => handleUpdateStatus(seller.id, "SUSPENDED")}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/60 hover:text-cadmium-red-200 transition cursor-pointer"
                      title="Suspend Store"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(seller.id, "ACTIVE")}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-pablano-100/30 text-white-chalk-100/60 hover:text-pablano-200 transition cursor-pointer"
                      title="Activate Store"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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

      {/* Seller Detail Modal */}
      {selectedSeller && (
        <AdminModal
          isOpen={!!selectedSeller}
          onClose={() => setSelectedSeller(null)}
          title={`Merchant: ${selectedSeller.shopName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white-chalk-100/50">Change Status:</span>
                <button
                  onClick={() => handleUpdateStatus(selectedSeller.id, "ACTIVE")}
                  disabled={actionLoading || selectedSeller.status === "ACTIVE"}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pablano-100/20 text-pablano-200 hover:bg-pablano-100/30 transition disabled:opacity-40 cursor-pointer"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedSeller.id, "SUSPENDED")}
                  disabled={actionLoading || selectedSeller.status === "SUSPENDED"}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cadmium-red-100/20 text-cadmium-red-200 hover:bg-cadmium-red-100/30 transition disabled:opacity-40 cursor-pointer"
                >
                  Suspend
                </button>
              </div>

              <button
                onClick={() => setSelectedSeller(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5">
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Shop Slug
                </p>
                <p className="text-xs font-mono text-white-chalk-100 mt-0.5">
                  /{selectedSeller.slug}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Verification
                </p>
                <div className="mt-0.5">
                  <AdminBadge status={selectedSeller.verificationStatus} />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Completed Orders
                </p>
                <p className="text-xs font-semibold text-white-chalk-100 mt-0.5">
                  {selectedSeller.completedOrderCount}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Customer Ratings
                </p>
                <p className="text-xs font-semibold text-sunflower-100 mt-0.5">
                  {Number(selectedSeller.averageRating || 0).toFixed(1)} / 5.0 (
                  {selectedSeller.reviewCount} reviews)
                </p>
              </div>
            </div>

            {/* Wallet Overview */}
            {selectedSeller.wallet && (
              <div className="bg-matt-black-200/30 p-4 rounded-xl border border-white-chalk-100/5">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4 text-sunflower-100" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100">
                    Seller Wallet Snapshot
                  </h5>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-matt-black-100/60 p-2.5 rounded-lg border border-white-chalk-100/5">
                    <p className="text-[10px] text-white-chalk-100/40 font-semibold uppercase">
                      Current Balance
                    </p>
                    <p className="text-sm font-bold font-mono text-white-chalk-100 mt-1">
                      Rs {Number(selectedSeller.wallet.balance || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-matt-black-100/60 p-2.5 rounded-lg border border-white-chalk-100/5">
                    <p className="text-[10px] text-white-chalk-100/40 font-semibold uppercase">
                      Pending Escrow
                    </p>
                    <p className="text-sm font-bold font-mono text-sunflower-100 mt-1">
                      Rs{" "}
                      {Number(
                        selectedSeller.wallet.pendingBalance || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-matt-black-100/60 p-2.5 rounded-lg border border-white-chalk-100/5">
                    <p className="text-[10px] text-white-chalk-100/40 font-semibold uppercase">
                      Withdrawable
                    </p>
                    <p className="text-sm font-bold font-mono text-pablano-200 mt-1">
                      Rs{" "}
                      {Number(
                        selectedSeller.wallet.withdrawableBalance || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
