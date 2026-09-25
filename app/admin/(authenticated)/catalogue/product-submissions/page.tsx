"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Store,
  FileText,
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  Package,
  Sparkles,
  ExternalLink,
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

interface Submission {
  id: string;
  title: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "PENDING_REVIEW"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "RESUBMITTED";
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  payload?: any;
  seller?: {
    id: string;
    shopName: string;
    slug: string;
    status: string;
  } | null;
  reviewedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function ProductSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Review modal state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/admin/product-submissions?${params.toString()}`);
      const data = await res.json();

      if (data.data?.submissions) {
        setSubmissions(data.data.submissions);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else if (Array.isArray(data.data)) {
        setSubmissions(data.data);
        setTotalCount(data.data.length);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Quick Approve
  const handleApprove = async (id: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/product-submissions/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to approve submission");
      }
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "APPROVED" } : s))
      );
      setSelectedSubmission(null);
    } catch (err: any) {
      setActionError(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Reject
  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setActionError("Please provide a reason for rejection.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/product-submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reject submission");
      }
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "REJECTED", rejectionReason: rejectReason } : s
        )
      );
      setSelectedSubmission(null);
      setRejectReason("");
    } catch (err: any) {
      setActionError(err.message || "Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete submission
  const handleDeleteSubmission = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/product-submissions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete submission.");
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete submission.");
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = submissions.filter(
    (s) => s.status === "SUBMITTED" || s.status === "PENDING_REVIEW"
  ).length;

  return (
    <div className="space-y-6 pt-6">
      <AdminPageHeader
        title="Product Submissions Review"
        description="Verify, modify, and publish seller product proposals or compose new submissions directly."
        badge={`${pendingCount} Awaiting Review`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Catalogue", href: "/admin/catalogue/products" },
          { label: "Submissions" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/catalogue/product-submissions/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sunflower-100/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Submission
            </Link>
            <Link
              href="/admin/catalogue/products"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white-chalk-100/10 bg-matt-black-200/50 text-white-chalk-100/80 hover:bg-matt-black-200 hover:text-white-chalk-100 transition cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              Live Products
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Pending Moderation"
          value={pendingCount}
          subtext="Submissions waiting for approval"
          icon={Clock}
          variant="gold"
        />
        <AdminStatCard
          label="Total Records"
          value={totalCount}
          subtext="Submissions matching filter criteria"
          icon={Layers}
          variant="blue"
        />
        <AdminStatCard
          label="Approved Live"
          value={submissions.filter((s) => s.status === "APPROVED").length}
          subtext="Approved or published in catalogue"
          icon={CheckCircle}
          variant="green"
        />
      </div>

      {/* Filters */}
      <AdminFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Filter submissions by title, seller, or ID..."
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        statusOptions={[
          { label: "All Statuses", value: "ALL" },
          { label: "Pending Review", value: "PENDING_REVIEW" },
          { label: "Submitted (Queue)", value: "SUBMITTED" },
          { label: "Under Review", value: "UNDER_REVIEW" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
          { label: "Draft", value: "DRAFT" },
          { label: "Resubmitted", value: "RESUBMITTED" },
        ]}
        onRefresh={fetchSubmissions}
        isRefreshing={loading}
      />

      {/* Table */}
      <AdminTable
        headers={[
          "Proposed Product",
          "Seller Store",
          "Price & Stock",
          "Submitted",
          "Status",
          "Reviewed By",
          "Actions",
        ]}
        loading={loading}
        isEmpty={submissions.length === 0}
        emptyMessage="No product submissions found in this status queue."
        colSpan={7}
      >
        {submissions.map((sub) => {
          const payload = sub.payload || {};
          const primaryImage =
            Array.isArray(payload.images) && payload.images.length > 0
              ? payload.images.find((i: any) => i.isPrimary)?.url || payload.images[0]?.url
              : null;

          return (
            <tr
              key={sub.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Product Info with Thumbnail */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-matt-black-200/80 border border-white-chalk-100/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={sub.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-white-chalk-100/30" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/catalogue/product-submissions/${sub.id}/edit`}
                      className="font-semibold text-white-chalk-100 hover:text-sunflower-100 transition-colors truncate text-xs block"
                    >
                      {sub.title || payload.name || "Untitled Proposal"}
                    </Link>
                    <div className="text-[11px] text-white-chalk-100/40 font-mono truncate">
                      {payload.sellerSku ? `SKU: ${payload.sellerSku}` : `ID: ${sub.id.slice(0, 12)}...`}
                    </div>
                  </div>
                </div>
              </td>

              {/* Seller */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 text-white-chalk-100/90 font-medium text-xs">
                  <Store className="w-3.5 h-3.5 text-sunflower-100 shrink-0" />
                  <span className="truncate max-w-[130px]">
                    {sub.seller?.shopName || "Unknown Seller"}
                  </span>
                </div>
              </td>

              {/* Price & Stock */}
              <td className="px-5 py-3.5">
                <div className="text-xs font-semibold text-white-chalk-100">
                  {payload.price !== undefined ? `$${Number(payload.price).toFixed(2)}` : "—"}
                </div>
                <div className="text-[11px] text-white-chalk-100/40">
                  Qty: {payload.quantity !== undefined ? payload.quantity : 0} units
                </div>
              </td>

              {/* Submitted Date */}
              <td className="px-5 py-3.5 text-white-chalk-100/50 text-[11px]">
                {sub.submittedAt
                  ? new Date(sub.submittedAt).toLocaleDateString()
                  : new Date(sub.createdAt).toLocaleDateString()}
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={sub.status} />
              </td>

              {/* Reviewed By */}
              <td className="px-5 py-3.5 text-white-chalk-100/60 text-[11px]">
                {sub.reviewedBy
                  ? `${sub.reviewedBy.firstName || ""} ${sub.reviewedBy.lastName || sub.reviewedBy.email}`
                  : "—"}
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Edit Page Button */}
                  <Link
                    href={`/admin/catalogue/product-submissions/${sub.id}/edit`}
                    title="Edit Submission on dedicated page"
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 bg-white-chalk-100/5 text-white-chalk-100/80 hover:text-sunflower-100 hover:border-sunflower-100/30 transition cursor-pointer inline-flex items-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>

                  {/* Quick Review / Moderate */}
                  <button
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setRejectReason("");
                      setActionError(null);
                    }}
                    title="Quick Review & Decision"
                    className="px-2.5 py-1.5 rounded-lg border border-sunflower-100/30 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteConfirmId(sub.id)}
                    title="Delete Submission"
                    className="p-1.5 rounded-lg border border-cadmium-red-100/20 bg-cadmium-red-100/5 text-cadmium-red-200/70 hover:text-cadmium-red-200 hover:bg-cadmium-red-100/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <AdminModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Product Submission"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSubmission(deleteConfirmId)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-cadmium-red-100/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Delete
              </button>
            </div>
          }
        >
          <div className="space-y-2 text-xs">
            <p className="text-white-chalk-100/80">
              Are you sure you want to delete this product submission record? This action cannot be undone.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Quick Review & Moderate Modal */}
      {selectedSubmission && (
        <AdminModal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={`Review Proposal: ${selectedSubmission.title}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
                >
                  Close
                </button>
                <Link
                  href={`/admin/catalogue/product-submissions/${selectedSubmission.id}/edit`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-sunflower-100/30 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Open Full Edit Page
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReject(selectedSubmission.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100/20 text-cadmium-red-200 hover:bg-cadmium-red-100/30 border border-cadmium-red-100/30 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>

                <button
                  onClick={() => handleApprove(selectedSubmission.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-sunflower-100/20 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Publish
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {actionError && (
              <div className="p-3 rounded-xl bg-cadmium-red-100/10 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Seller and Overview summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-matt-black-200/50 p-3 rounded-xl border border-white-chalk-100/5">
                <span className="text-[10px] text-white-chalk-100/40 uppercase font-bold block mb-1">
                  Seller
                </span>
                <span className="font-semibold text-white-chalk-100 text-xs">
                  {selectedSubmission.seller?.shopName || "Unknown"}
                </span>
              </div>
              <div className="bg-matt-black-200/50 p-3 rounded-xl border border-white-chalk-100/5">
                <span className="text-[10px] text-white-chalk-100/40 uppercase font-bold block mb-1">
                  Status
                </span>
                <AdminBadge status={selectedSubmission.status} />
              </div>
              <div className="bg-matt-black-200/50 p-3 rounded-xl border border-white-chalk-100/5">
                <span className="text-[10px] text-white-chalk-100/40 uppercase font-bold block mb-1">
                  Proposed Price
                </span>
                <span className="font-bold text-sunflower-100 text-xs">
                  {selectedSubmission.payload?.price !== undefined
                    ? `$${Number(selectedSubmission.payload.price).toFixed(2)}`
                    : "—"}
                </span>
              </div>
              <div className="bg-matt-black-200/50 p-3 rounded-xl border border-white-chalk-100/5">
                <span className="text-[10px] text-white-chalk-100/40 uppercase font-bold block mb-1">
                  Stock Units
                </span>
                <span className="font-semibold text-white-chalk-100 text-xs">
                  {selectedSubmission.payload?.quantity ?? 0}
                </span>
              </div>
            </div>

            {/* Images Preview if any */}
            {Array.isArray(selectedSubmission.payload?.images) &&
              selectedSubmission.payload.images.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-white-chalk-100/60 mb-2">
                    Attached Product Images
                  </h5>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {selectedSubmission.payload.images.map((img: any, idx: number) => (
                      <div
                        key={idx}
                        className="w-16 h-16 rounded-xl border border-white-chalk-100/10 overflow-hidden shrink-0 bg-matt-black-200 relative group"
                      >
                        <img
                          src={img.url}
                          alt={img.altText || "Image"}
                          className="w-full h-full object-cover"
                        />
                        {img.isPrimary && (
                          <span className="absolute bottom-0 inset-x-0 bg-sunflower-100 text-matt-black-100 text-[8px] font-bold text-center py-0.5">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Product Details Overview */}
            <div className="bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5 space-y-2">
              {selectedSubmission.payload?.shortDescription && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-white-chalk-100/40 block mb-0.5">
                    Short Description
                  </span>
                  <p className="text-xs text-white-chalk-100/80">
                    {selectedSubmission.payload.shortDescription}
                  </p>
                </div>
              )}
              {selectedSubmission.payload?.description && (
                <div className="pt-2 border-t border-white-chalk-100/5">
                  <span className="text-[10px] font-bold uppercase text-white-chalk-100/40 block mb-0.5">
                    Full Description
                  </span>
                  <p className="text-xs text-white-chalk-100/70 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                    {selectedSubmission.payload.description}
                  </p>
                </div>
              )}
            </div>

            {selectedSubmission.rejectionReason && (
              <div className="p-3 rounded-xl bg-cadmium-red-100/10 border border-cadmium-red-100/20 text-xs text-cadmium-red-200">
                <strong>Previous Rejection Reason:</strong> {selectedSubmission.rejectionReason}
              </div>
            )}

            {/* Rejection Note input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Rejection Reason (Required if rejecting)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs adjustment before approval (e.g. invalid brand, blurry image, missing specs)..."
                rows={3}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-cadmium-red-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
