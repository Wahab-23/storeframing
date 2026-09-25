"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  Store,
  FileCheck,
  ShieldCheck,
  Eye,
  Mail,
  Phone,
  User,
  FileText,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminModal,
} from "@/components/admin/AdminUI";

interface PendingSeller {
  id: string;
  shopName: string;
  slug: string;
  description?: string | null;
  businessEmail?: string | null;
  businessPhone?: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED" | "CLOSED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  trustBadge: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  documents?: Array<{
    id: string;
    type: string;
    fileUrl: string;
    status: string;
  }>;
}

export default function SellerApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedSeller, setSelectedSeller] = useState<PendingSeller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/sellers/approvals?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setApprovals(data.data);
      }
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprove = async (sellerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (res.ok) {
        setApprovals((prev) => prev.filter((s) => s.id !== sellerId));
        setSelectedSeller(null);
      }
    } catch (err) {
      console.error("Error approving seller:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (sellerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        setApprovals((prev) => prev.filter((s) => s.id !== sellerId));
        setSelectedSeller(null);
        setRejectReason("");
      }
    } catch (err) {
      console.error("Error rejecting seller:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = approvals.filter((s) => {
    const q = search.toLowerCase();
    const shop = s.shopName.toLowerCase();
    const email = (s.businessEmail || "").toLowerCase();
    const owner = `${s.user?.firstName || ""} ${s.user?.lastName || ""} ${s.user?.email || ""}`.toLowerCase();
    return shop.includes(q) || email.includes(q) || owner.includes(q);
  });

  const pendingCount = approvals.filter((s) => s.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Seller Approvals Queue"
        description="Review all merchant applications with pending store statuses before granting selling privileges."
        badge={`${pendingCount} Pending Store Approvals`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sellers", href: "/admin/sellers" },
          { label: "Approvals" },
        ]}
        actions={
          <Link
            href="/admin/sellers/verification"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-munsell-blue-100/20 bg-munsell-blue-100/10 text-munsell-blue-100 hover:bg-munsell-blue-100/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            KYC Documents
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Pending Store Status"
          value={pendingCount}
          subtext="Stores awaiting platform approval"
          icon={Clock}
          variant="gold"
        />
        <AdminStatCard
          label="KYC Compliance Check"
          value="Required"
          subtext="Business licenses & Identity files"
          icon={ShieldCheck}
          variant="blue"
        />
        <AdminStatCard
          label="Onboarding SLA"
          value="< 24 Hours"
          subtext="Target turnaround time"
          icon={FileCheck}
          variant="green"
        />
      </div>

      {/* Filter Bar */}
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search store name, owner, or email..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: "Pending Stores", value: "PENDING" },
          { label: "All Pending (Store + KYC)", value: "ALL" },
          { label: "Rejected Stores", value: "REJECTED" },
        ]}
        onRefresh={fetchApprovals}
        isRefreshing={loading}
      />

      {/* Table */}
      <AdminTable
        headers={[
          "Merchant Store",
          "Account Holder",
          "Contact",
          "Applied Date",
          "Store Status",
          "KYC Status",
          "Actions",
        ]}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No pending store status vendors found in the approval queue."
        colSpan={7}
      >
        {filtered.map((seller) => {
          const ownerName = seller.user
            ? `${seller.user.firstName || ""} ${seller.user.lastName || ""}`.trim() || seller.user.email
            : "—";

          const docsCount = seller.documents?.length || 0;

          return (
            <tr
              key={seller.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Store */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="font-semibold text-white-chalk-100 truncate flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-sunflower-100 shrink-0" />
                  <span>{seller.shopName}</span>
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono truncate ml-5">
                  /{seller.slug}
                </div>
              </td>

              {/* Owner */}
              <td className="px-5 py-3.5">
                <div className="font-medium text-white-chalk-100 text-xs">
                  {ownerName}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 truncate">
                  {seller.user?.email || "No email"}
                </div>
              </td>

              {/* Contact */}
              <td className="px-5 py-3.5">
                {seller.businessEmail && (
                  <div className="flex items-center gap-1 text-white-chalk-100/80 text-xs">
                    <Mail className="w-3 h-3 text-munsell-blue-100 shrink-0" />
                    <span className="truncate max-w-36">{seller.businessEmail}</span>
                  </div>
                )}
                {seller.businessPhone && (
                  <div className="flex items-center gap-1 text-white-chalk-100/50 text-[11px] mt-0.5">
                    <Phone className="w-3 h-3 text-white-chalk-100/40 shrink-0" />
                    <span>{seller.businessPhone}</span>
                  </div>
                )}
              </td>

              {/* Applied Date */}
              <td className="px-5 py-3.5 text-white-chalk-100/50 text-xs font-mono">
                {new Date(seller.createdAt).toLocaleDateString()}
              </td>

              {/* Store Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={seller.status} />
              </td>

              {/* KYC Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={seller.verificationStatus} />
                {docsCount > 0 && (
                  <div className="text-[10px] text-sunflower-100 font-mono mt-0.5">
                    {docsCount} doc{docsCount === 1 ? "" : "s"} attached
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSeller(seller);
                      setRejectReason("");
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-sunflower-100/30 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                    title="Audit Application"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review
                  </button>

                  <button
                    onClick={() => handleApprove(seller.id)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-lg border border-pablano-100/30 bg-pablano-100/10 text-pablano-200 hover:bg-pablano-100/20 transition cursor-pointer"
                    title="Quick Approve"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleReject(seller.id)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-lg border border-cadmium-red-100/30 bg-cadmium-red-100/10 text-cadmium-red-200 hover:bg-cadmium-red-100/20 transition cursor-pointer"
                    title="Quick Reject"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Audit Modal */}
      {selectedSeller && (
        <AdminModal
          isOpen={!!selectedSeller}
          onClose={() => setSelectedSeller(null)}
          title={`Review Store Application: ${selectedSeller.shopName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setSelectedSeller(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReject(selectedSeller.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100/20 text-cadmium-red-200 hover:bg-cadmium-red-100/30 border border-cadmium-red-100/30 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Store
                </button>
                <button
                  onClick={() => handleApprove(selectedSeller.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-sunflower-100/20 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Store Status
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5 text-xs">
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Store Slug
                </span>
                <p className="font-mono text-white-chalk-100 mt-0.5">
                  /{selectedSeller.slug}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Store Status
                </span>
                <div className="mt-0.5">
                  <AdminBadge status={selectedSeller.status} />
                </div>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Account Owner
                </span>
                <p className="text-white-chalk-100 font-semibold mt-0.5">
                  {selectedSeller.user
                    ? `${selectedSeller.user.firstName || ""} ${selectedSeller.user.lastName || ""}`.trim() || selectedSeller.user.email
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  KYC Verification
                </span>
                <div className="mt-0.5">
                  <AdminBadge status={selectedSeller.verificationStatus} />
                </div>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Business Email
                </span>
                <p className="text-white-chalk-100 mt-0.5">
                  {selectedSeller.businessEmail || "None provided"}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Business Phone
                </span>
                <p className="text-white-chalk-100 mt-0.5">
                  {selectedSeller.businessPhone || "None provided"}
                </p>
              </div>
            </div>

            {selectedSeller.description && (
              <div className="bg-matt-black-200/30 p-3 rounded-xl border border-white-chalk-100/5 text-xs">
                <span className="text-white-chalk-100/40 font-bold uppercase text-[10px]">
                  Store Description
                </span>
                <p className="text-white-chalk-100/80 mt-1 leading-relaxed">
                  {selectedSeller.description}
                </p>
              </div>
            )}

            {/* Documents attached */}
            <div>
              <h6 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-2">
                Attached Verification Documents ({selectedSeller.documents?.length || 0})
              </h6>
              {!selectedSeller.documents || selectedSeller.documents.length === 0 ? (
                <p className="text-xs text-white-chalk-100/40 italic p-3 bg-matt-black-200/20 rounded-lg">
                  No documents uploaded yet by this seller.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSeller.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-matt-black-200/40 rounded-xl border border-white-chalk-100/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sunflower-100" />
                        <div>
                          <span className="font-semibold text-white-chalk-100 uppercase">
                            {doc.type.replace(/_/g, " ")}
                          </span>
                          <div className="text-[10px] text-white-chalk-100/40 font-mono">
                            Status: {doc.status}
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg border border-munsell-blue-100/30 bg-munsell-blue-100/10 text-munsell-blue-100 hover:bg-munsell-blue-100/20 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
