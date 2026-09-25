"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Store,
  Clock,
  ExternalLink,
  Award,
  AlertCircle,
  User,
  Edit,
  FileCheck,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminModal,
} from "@/components/admin/AdminUI";

interface SellerDocument {
  id: string;
  type: string;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  notes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

interface VerificationSeller {
  id: string;
  shopName: string;
  slug: string;
  status: string;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  trustBadge: "NONE" | "VERIFIED_SELLER";
  businessEmail?: string | null;
  businessPhone?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  documents?: SellerDocument[];
}

export default function SellerVerificationPage() {
  const [sellers, setSellers] = useState<VerificationSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSeller, setSelectedSeller] = useState<VerificationSeller | null>(null);
  const [notes, setNotes] = useState("");
  const [awardTrustBadge, setAwardTrustBadge] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/sellers/verification?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setSellers(data.data);
      }
    } catch (err) {
      console.error("Error fetching verifications:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // One-click Verify Vendor
  const handleVerifyVendor = async (sellerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/sellers/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          action: "VERIFY_VENDOR",
          awardTrustBadge,
          notes: notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === sellerId
              ? {
                  ...s,
                  verificationStatus: "VERIFIED",
                  trustBadge: awardTrustBadge ? "VERIFIED_SELLER" : s.trustBadge,
                  documents: s.documents?.map((d) => ({
                    ...d,
                    status: "APPROVED",
                  })),
                }
              : s
          )
        );
        setSelectedSeller(null);
        setNotes("");
        setAwardTrustBadge(false);
      }
    } catch (err) {
      console.error("Failed to verify vendor:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Verification
  const handleRejectVerification = async (sellerId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/sellers/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId,
          action: "REJECT_VERIFICATION",
          notes: notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) =>
            s.id === sellerId
              ? {
                  ...s,
                  verificationStatus: "REJECTED",
                  trustBadge: "NONE",
                  documents: s.documents?.map((d) => ({
                    ...d,
                    status: "REJECTED",
                  })),
                }
              : s
          )
        );
        setSelectedSeller(null);
        setNotes("");
      }
    } catch (err) {
      console.error("Failed to reject verification:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Single doc status update
  const handleUpdateDocStatus = async (
    docId: string,
    docStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      const res = await fetch("/api/admin/sellers/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: docId,
          status: docStatus,
        }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) => ({
            ...s,
            documents: s.documents?.map((d) =>
              d.id === docId ? { ...d, status: docStatus } : d
            ),
          }))
        );
        if (selectedSeller) {
          setSelectedSeller({
            ...selectedSeller,
            documents: selectedSeller.documents?.map((d) =>
              d.id === docId ? { ...d, status: docStatus } : d
            ),
          });
        }
      }
    } catch (err) {
      console.error("Failed to update doc status:", err);
    }
  };

  const filtered = sellers.filter((s) => {
    const q = search.toLowerCase();
    const shop = s.shopName.toLowerCase();
    const owner = `${s.user?.firstName || ""} ${s.user?.lastName || ""} ${s.user?.email || ""}`.toLowerCase();
    return shop.includes(q) || owner.includes(q);
  });

  const verifiedCount = sellers.filter((s) => s.verificationStatus === "VERIFIED").length;
  const pendingCount = sellers.filter(
    (s) => s.verificationStatus === "PENDING" || s.documents?.some((d) => d.status === "PENDING")
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Seller KYC & Compliance Verification"
        description="Audit merchant registration credentials (CNIC, NTN, Business Licenses) and officially verify vendor accounts."
        badge={`${sellers.length} Vendors Under Review`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sellers", href: "/admin/sellers" },
          { label: "Verification" },
        ]}
        actions={
          <Link
            href="/admin/sellers/new"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sunflower-100/20"
          >
            Add New Vendor
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Pending KYC Verification"
          value={pendingCount}
          subtext="Stores requiring credential review"
          icon={Clock}
          variant="gold"
        />
        <AdminStatCard
          label="Officially Verified"
          value={verifiedCount}
          subtext="Active Trust Badge awarded"
          icon={Award}
          variant="green"
        />
        <AdminStatCard
          label="Compliance Requirement"
          value="CNIC & SECP"
          subtext="Mandatory government validation"
          icon={ShieldCheck}
          variant="blue"
        />
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search store name or owner email..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: "All Vendors", value: "ALL" },
          { label: "Pending Verification", value: "PENDING" },
          { label: "Unverified", value: "UNVERIFIED" },
          { label: "Verified Vendors", value: "VERIFIED" },
          { label: "Rejected", value: "REJECTED" },
        ]}
        onRefresh={fetchVerifications}
        isRefreshing={loading}
      />

      {/* Grouped Sellers Table - Each Vendor is 1 Row */}
      <AdminTable
        headers={[
          "Merchant Store",
          "Account Owner",
          "Submitted Documents (CNIC / License)",
          "Verification Status",
          "Trust Badge",
          "Verification Actions",
        ]}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No vendors found matching your verification filter."
        colSpan={6}
      >
        {filtered.map((seller) => {
          const ownerName = seller.user
            ? `${seller.user.firstName || ""} ${seller.user.lastName || ""}`.trim() || seller.user.email
            : "—";

          const docs = seller.documents || [];
          const isVerified = seller.verificationStatus === "VERIFIED";

          return (
            <tr
              key={seller.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Store Name & Link */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="flex items-center gap-1.5 font-semibold text-white-chalk-100 truncate">
                  <Store className="w-3.5 h-3.5 text-sunflower-100 shrink-0" />
                  <span>{seller.shopName}</span>
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono truncate ml-5">
                  /{seller.slug}
                </div>
              </td>

              {/* Owner */}
              <td className="px-5 py-3.5">
                <div className="text-white-chalk-100 text-xs font-medium">
                  {ownerName}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 truncate">
                  {seller.user?.email || seller.businessEmail || "No email"}
                </div>
              </td>

              {/* Grouped Documents Chips */}
              <td className="px-5 py-3.5">
                {docs.length === 0 ? (
                  <span className="text-white-chalk-100/35 text-[11px] italic">
                    No documents uploaded yet
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {docs.map((doc) => (
                      <span
                        key={doc.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          doc.status === "APPROVED"
                            ? "bg-pablano-100/10 text-pablano-200 border-pablano-100/30"
                            : doc.status === "REJECTED"
                            ? "bg-cadmium-red-100/10 text-cadmium-red-200 border-cadmium-red-100/30"
                            : "bg-sunflower-100/10 text-sunflower-100 border-sunflower-100/30"
                        }`}
                        title={`${doc.type.replace(/_/g, " ")} (${doc.status})`}
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>{doc.type.replace(/_/g, " ")}</span>
                        <span>· {doc.status}</span>
                      </span>
                    ))}
                  </div>
                )}
              </td>

              {/* Verification Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={seller.verificationStatus} />
              </td>

              {/* Trust Badge */}
              <td className="px-5 py-3.5">
                {seller.trustBadge === "VERIFIED_SELLER" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sunflower-100 bg-sunflower-100/10 border border-sunflower-100/20 px-2 py-0.5 rounded-full">
                    <Award className="w-3.5 h-3.5" />
                    Verified Seller
                  </span>
                ) : (
                  <span className="text-white-chalk-100/40 text-xs">Standard</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSeller(seller);
                      setNotes("");
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-sunflower-100/30 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                    title="Audit Credentials"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Review
                  </button>

                  {!isVerified ? (
                    <button
                      onClick={() => handleVerifyVendor(seller.id)}
                      disabled={actionLoading}
                      className="px-2.5 py-1.5 rounded-lg bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 shadow-sm"
                      title="Verify Vendor"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRejectVerification(seller.id)}
                      disabled={actionLoading}
                      className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/50 hover:text-cadmium-red-200 text-xs transition cursor-pointer"
                      title="Revoke Verification"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <Link
                    href={`/admin/sellers/${seller.id}/edit`}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="Full Store Edit"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Comprehensive Audit & Verification Modal */}
      {selectedSeller && (
        <AdminModal
          isOpen={!!selectedSeller}
          onClose={() => setSelectedSeller(null)}
          title={`KYC Audit: ${selectedSeller.shopName}`}
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
                  onClick={() => handleRejectVerification(selectedSeller.id)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100/20 text-cadmium-red-200 hover:bg-cadmium-red-100/30 border border-cadmium-red-100/30 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Verification
                </button>

                <button
                  onClick={() => handleVerifyVendor(selectedSeller.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-sunflower-100/20 flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  Approve & Verify Vendor
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Merchant Details */}
            <div className="grid grid-cols-2 gap-3 bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5 text-xs">
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Merchant Store
                </span>
                <p className="font-semibold text-white-chalk-100 mt-0.5">
                  {selectedSeller.shopName}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Account Owner
                </span>
                <p className="text-white-chalk-100 mt-0.5">
                  {selectedSeller.user?.firstName} {selectedSeller.user?.lastName} (
                  {selectedSeller.user?.email})
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Verification Status
                </span>
                <div className="mt-0.5">
                  <AdminBadge status={selectedSeller.verificationStatus} />
                </div>
              </div>
              <div>
                <span className="text-white-chalk-100/40 uppercase font-bold">
                  Trust Badge
                </span>
                <p className="font-mono text-sunflower-100 font-bold mt-0.5">
                  {selectedSeller.trustBadge}
                </p>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100 mb-2">
                Attached Compliance Documents ({selectedSeller.documents?.length || 0})
              </h5>

              {!selectedSeller.documents || selectedSeller.documents.length === 0 ? (
                <p className="text-xs text-white-chalk-100/40 p-3 bg-matt-black-200/20 rounded-lg italic">
                  No documents attached yet for this merchant.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {selectedSeller.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-matt-black-200/50 rounded-xl border border-white-chalk-100/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sunflower-100/10 border border-sunflower-100/20 flex items-center justify-center text-sunflower-100 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white-chalk-100 uppercase tracking-wide">
                            {doc.type.replace(/_/g, " ")}
                          </div>
                          <div className="text-[11px] text-white-chalk-100/50">
                            {doc.notes || "Uploaded credentials certificate"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <AdminBadge status={doc.status} />

                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg border border-munsell-blue-100/30 bg-munsell-blue-100/10 text-munsell-blue-100 hover:bg-munsell-blue-100/20 text-xs font-bold transition flex items-center gap-1"
                        >
                          <span>View File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        {doc.status !== "APPROVED" && (
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "APPROVED")}
                            className="p-1.5 rounded-lg border border-pablano-100/30 bg-pablano-100/10 text-pablano-200 hover:bg-pablano-100/20 transition cursor-pointer"
                            title="Approve Document"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {doc.status !== "REJECTED" && (
                          <button
                            onClick={() => handleUpdateDocStatus(doc.id, "REJECTED")}
                            className="p-1.5 rounded-lg border border-cadmium-red-100/30 bg-cadmium-red-100/10 text-cadmium-red-200 hover:bg-cadmium-red-100/20 transition cursor-pointer"
                            title="Reject Document"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Trust Badge toggle */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-matt-black-200/50 border border-white-chalk-100/10">
              <input
                type="checkbox"
                id="awardTrustBadge"
                checked={awardTrustBadge}
                onChange={(e) => setAwardTrustBadge(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer"
              />
              <label htmlFor="awardTrustBadge" className="text-xs text-white-chalk-100 cursor-pointer select-none">
                <span className="font-bold text-sunflower-100">Also award &quot;VERIFIED_SELLER&quot; Trust Badge</span>
                <p className="text-[11px] text-white-chalk-100/40 mt-0.5">
                  Keep unchecked if you only want to approve KYC identity documents. The performance badge is typically earned by proven track record or sales volume.
                </p>
              </label>
            </div>

            {/* Auditor feedback notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Audit Feedback / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional audit notes or reason if rejecting verification..."
                rows={2}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
