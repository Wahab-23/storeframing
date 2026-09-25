"use client";

import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Award,
  Wallet,
  ArrowLeft,
  DollarSign,
  User,
  FileText,
  Clock,
  UploadCloud,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  RefreshCw,
  FileCheck,
  FilePlus,
  X,
  File,
  Check,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  AdminPageHeader,
  AdminBadge,
  AdminStatCard,
  AdminModal,
} from "@/components/admin/AdminUI";
import type { BlockNoteEditorRef } from "@/components/blocknote/blocknoteEditor";

const BlockNoteEditor = dynamic(
  () => import("@/components/blocknote/blocknoteEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 rounded-xl bg-matt-black-200/50 border border-white-chalk-100/10 animate-pulse flex items-center justify-center text-xs text-white-chalk-100/40">
        Loading rich editor...
      </div>
    ),
  }
);

interface EditSellerPageProps {
  params: Promise<{ id: string }>;
}

interface SellerDoc {
  id: string;
  sellerId: string;
  type: string;
  fileUrl: string;
  status: string;
  notes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

const STANDARD_DOC_TYPES = [
  {
    type: "IDENTITY",
    title: "National Identity Card (CNIC / Passport)",
    desc: "Proof of legal identity for store owner / authorized representative",
    hint: "PDF, JPG, PNG up to 10MB",
  },
  {
    type: "BUSINESS_LICENSE",
    title: "Business License / NTN Registration",
    desc: "National Tax Number (NTN) or SECP business incorporation cert",
    hint: "PDF, JPG, PNG up to 10MB",
  },
  {
    type: "TAX_DOCUMENT",
    title: "Sales Tax Registration (STRN / FBR)",
    desc: "Sales tax certificate or active taxpayer verification list",
    hint: "PDF, JPG, PNG up to 10MB",
  },
  {
    type: "BANK_DOCUMENT",
    title: "Bank Account Verification (IBAN / Cheque)",
    desc: "Bank maintenance certificate or voided cheque for vendor payouts",
    hint: "PDF, JPG, PNG up to 10MB",
  },
];

export default function EditSellerPage({ params }: EditSellerPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Seller Fields
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [status, setStatus] = useState<string>("PENDING");
  const [verificationStatus, setVerificationStatus] = useState<string>("UNVERIFIED");
  const [trustBadge, setTrustBadge] = useState<string>("NONE");
  const [commissionRate, setCommissionRate] = useState<string>("");

  // Documents
  const [documents, setDocuments] = useState<SellerDoc[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Document Viewer & Upload Modal State
  const [previewDoc, setPreviewDoc] = useState<SellerDoc | null>(null);
  const [customDocModalOpen, setCustomDocModalOpen] = useState(false);
  const [customDocType, setCustomDocType] = useState("OTHER");
  const [customDocNotes, setCustomDocNotes] = useState("");
  const [customDocFile, setCustomDocFile] = useState<File | null>(null);
  const [uploadingCustomDoc, setUploadingCustomDoc] = useState(false);

  // Hidden File Input Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const editorRef = useRef<BlockNoteEditorRef>(null);

  // Owner User Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  // Policy Fields
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");

  // Read-only stats
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageRating: "0.0",
    reviewCount: 0,
    productsCount: 0,
    walletBalance: 0,
    pendingBalance: 0,
  });

  const fetchSellerData = async () => {
    try {
      const res = await fetch(`/api/admin/sellers/${id}`);
      const resData = await res.json();
      const s = resData.data;
      if (s) {
        setShopName(s.shopName || "");
        setSlug(s.slug || "");
        setDescription(s.description || "");
        setBusinessEmail(s.businessEmail || "");
        setBusinessPhone(s.businessPhone || "");
        setLogoUrl(s.logoUrl || "");
        setBannerUrl(s.bannerUrl || "");
        setStatus(s.status || "PENDING");
        setVerificationStatus(s.verificationStatus || "UNVERIFIED");
        setTrustBadge(s.trustBadge || "NONE");
        setCommissionRate(s.commissionRate ? String(s.commissionRate) : "");
        setDocuments(s.documents || []);

        if (s.user) {
          setFirstName(s.user.firstName || "");
          setLastName(s.user.lastName || "");
          setOwnerEmail(s.user.email || "");
          setOwnerPhone(s.user.phone || "");
        }

        if (s.policies) {
          setShippingPolicy(s.policies.shippingPolicy || "");
          setReturnPolicy(s.policies.returnPolicy || "");
          setRefundPolicy(s.policies.refundPolicy || "");
        }

        setStats({
          totalSales: Number(s.totalSales || 0),
          totalOrders: Number(s.totalOrders || 0),
          averageRating: Number(s.averageRating || 0).toFixed(1),
          reviewCount: Number(s.reviewCount || 0),
          productsCount: s._count?.products || 0,
          walletBalance: Number(s.wallet?.balance || 0),
          pendingBalance: Number(s.wallet?.pendingBalance || 0),
        });
      }
    } catch (err) {
      console.error("Failed to fetch seller:", err);
      setErrorMsg("Failed to load seller details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSellerData();
  }, [id]);

  // Handle Logo Upload
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logos");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload logo.");
      }

      setLogoUrl(data.data.url);
      setSuccessMsg("Store logo uploaded. Click 'Save Vendor Information' to persist.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "banners");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload banner.");
      }

      setBannerUrl(data.data.url);
      setSuccessMsg("Store cover banner uploaded. Click 'Save Vendor Information' to persist.");
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Handle Single Document Upload
  const handleDocUpload = async (docType: string, file: File) => {
    setUploadingDocType(docType);
    setErrorMsg(null);
    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "documents");

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Failed to upload document file.");
      }

      const fileUrl = uploadData.data.url;

      // 2. Attach to seller documents
      const attachRes = await fetch(`/api/admin/sellers/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          fileUrl,
          status: "APPROVED",
        }),
      });
      const attachData = await attachRes.json();
      if (!attachRes.ok) {
        throw new Error(attachData.message || "Failed to record document.");
      }

      setSuccessMsg(`${docType.replace(/_/g, " ")} document attached and approved.`);
      // Refresh documents
      await fetchSellerData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to attach document.");
    } finally {
      setUploadingDocType(null);
    }
  };

  // Handle Document Delete
  const handleDocDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to remove this document?")) return;
    try {
      const res = await fetch(`/api/admin/sellers/${id}/documents?documentId=${docId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete document.");
      }
      setSuccessMsg("Document removed successfully.");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err: any) {
      setErrorMsg(err.message || "Error deleting document.");
    }
  };

  // Handle Custom Document Modal Upload
  const handleUploadCustomDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocFile) return;
    setUploadingCustomDoc(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", customDocFile);
      formData.append("folder", "documents");

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || "Failed to upload custom document.");
      }

      const attachRes = await fetch(`/api/admin/sellers/${id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: customDocType,
          fileUrl: uploadData.data.url,
          notes: customDocNotes || undefined,
          status: "APPROVED",
        }),
      });
      const attachData = await attachRes.json();
      if (!attachRes.ok) {
        throw new Error(attachData.message || "Failed to attach custom document.");
      }

      setCustomDocModalOpen(false);
      setCustomDocFile(null);
      setCustomDocNotes("");
      setSuccessMsg("Custom document attached successfully.");
      await fetchSellerData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to attach custom document.");
    } finally {
      setUploadingCustomDoc(false);
    }
  };

  // Handle Document Download Trigger
  const triggerDownload = (fileUrl: string, nameHint?: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = nameHint || fileUrl.split("/").pop() || "document";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Main Form Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    let finalDesc = description;
    if (editorRef.current) {
      try {
        finalDesc = await editorRef.current.getContent();
      } catch (e) {
        console.error("Failed to get editor content:", e);
      }
    }

    try {
      const res = await fetch(`/api/admin/sellers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopName.trim(),
          slug: slug.trim(),
          description: finalDesc.trim(),
          businessEmail: businessEmail.trim(),
          businessPhone: businessPhone.trim(),
          logoUrl: logoUrl.trim() || null,
          bannerUrl: bannerUrl.trim() || null,
          status,
          verificationStatus,
          trustBadge,
          commissionRate: commissionRate ? Number(commissionRate) : null,
          user: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: ownerEmail.trim(),
            phone: ownerPhone.trim() || null,
          },
          policies: {
            shippingPolicy: shippingPolicy.trim() || null,
            returnPolicy: returnPolicy.trim() || null,
            refundPolicy: refundPolicy.trim() || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update vendor information");
      }

      setSuccessMsg("Vendor store details updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-sunflower-100/30 border-t-sunflower-100 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-white-chalk-100/50">Loading vendor control panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminPageHeader
        title={`Vendor Control: ${shopName}`}
        description="Full administrative governance over vendor store credentials, branding media, compliance documents, status moderation, and policies."
        badge={`ID: ${id}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sellers", href: "/admin/sellers" },
          { label: "Edit Vendor" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/sellers"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sellers
            </Link>
          </div>
        }
      />

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-matt-black-100 border border-white-chalk-100/10 p-3.5 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">Total Sales</p>
          <p className="font-mono text-base font-bold text-sunflower-100 mt-1">
            Rs {stats.totalSales.toLocaleString()}
          </p>
        </div>
        <div className="bg-matt-black-100 border border-white-chalk-100/10 p-3.5 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">Orders Fulfilled</p>
          <p className="font-mono text-base font-bold text-white-chalk-100 mt-1">
            {stats.totalOrders} orders
          </p>
        </div>
        <div className="bg-matt-black-100 border border-white-chalk-100/10 p-3.5 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">Current Balance</p>
          <p className="font-mono text-base font-bold text-pablano-200 mt-1">
            Rs {stats.walletBalance.toLocaleString()}
          </p>
        </div>
        <div className="bg-matt-black-100 border border-white-chalk-100/10 p-3.5 rounded-xl">
          <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">Live Products</p>
          <p className="font-mono text-base font-bold text-munsell-blue-100 mt-1">
            {stats.productsCount} listings
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-pablano-100/15 border border-pablano-100/30 text-pablano-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cadmium-red-100/15 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden Global File Inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLogoUpload(file);
          e.target.value = "";
        }}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleBannerUpload(file);
          e.target.value = "";
        }}
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store Branding & Media Assets (Logo & Banner) */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-6">
          <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sunflower-100" />
              <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                Store Branding & Media Assets
              </h3>
            </div>
            <span className="text-[11px] text-white-chalk-100/40">
              Live storefront display images
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo Upload Box (1:1 Ratio) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                  Store Logo
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20 font-bold">
                  1:1 Ratio (500×500 px)
                </span>
              </div>

              {logoUrl ? (
                <div className="relative group rounded-2xl border border-white-chalk-100/15 overflow-hidden bg-matt-black-200/60 p-3 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-xl border border-white-chalk-100/20 bg-matt-black-300/60 overflow-hidden flex items-center justify-center relative shadow-inner">
                    <img
                      src={logoUrl}
                      alt="Store Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex-1 py-1.5 px-3 rounded-lg text-[11px] font-semibold bg-matt-black-200 hover:bg-matt-black-300 text-white-chalk-100 border border-white-chalk-100/15 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${uploadingLogo ? "animate-spin" : ""}`} />
                      {uploadingLogo ? "Uploading..." : "Change Logo"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="p-1.5 rounded-lg text-cadmium-red-200 hover:bg-cadmium-red-100/20 border border-cadmium-red-100/20 transition cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-white-chalk-100/40 truncate w-full text-center mt-1.5 font-mono">
                    {logoUrl.split("/").pop()}
                  </p>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-sunflower-100/50 bg-matt-black-200/30 hover:bg-matt-black-200/50 p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition text-center group min-h-[190px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-sunflower-100/10 border border-sunflower-100/20 flex items-center justify-center text-sunflower-100 group-hover:scale-105 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white-chalk-100 group-hover:text-sunflower-100 transition">
                      {uploadingLogo ? "Uploading Logo..." : "Upload Store Logo"}
                    </p>
                    <p className="text-[10px] text-white-chalk-100/40 mt-0.5">
                      PNG, JPG, WEBP or SVG (Max 2MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Banner Upload Box (3:1 Ratio) */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                  Store Cover / Hero Banner
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-munsell-blue-100/10 text-munsell-blue-100 border border-munsell-blue-100/20 font-bold">
                  3:1 Ratio (1200×400 px)
                </span>
              </div>

              {bannerUrl ? (
                <div className="relative group rounded-2xl border border-white-chalk-100/15 overflow-hidden bg-matt-black-200/60 p-3">
                  <div className="w-full h-32 rounded-xl border border-white-chalk-100/20 bg-matt-black-300/60 overflow-hidden relative shadow-inner">
                    <img
                      src={bannerUrl}
                      alt="Store Cover Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={uploadingBanner}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white-chalk-100 text-matt-black-100 hover:bg-sunflower-100 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${uploadingBanner ? "animate-spin" : ""}`} />
                        {uploadingBanner ? "Uploading..." : "Replace Cover"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerUrl("")}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-white-chalk-100/50">
                    <span className="font-mono truncate max-w-sm">
                      {bannerUrl.split("/").pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="text-sunflower-100 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Change Banner
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-munsell-blue-100/50 bg-matt-black-200/30 hover:bg-matt-black-200/50 p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition text-center group min-h-[190px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-munsell-blue-100/10 border border-munsell-blue-100/20 flex items-center justify-center text-munsell-blue-100 group-hover:scale-105 transition">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white-chalk-100 group-hover:text-munsell-blue-100 transition">
                      {uploadingBanner ? "Uploading Banner..." : "Upload Store Banner"}
                    </p>
                    <p className="text-[10px] text-white-chalk-100/40 mt-0.5">
                      Recommended: 1200×400 px, Panorama 3:1 • JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Store Profile & Identity */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <Store className="w-4 h-4 text-sunflower-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Store Profile & Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Shop Display Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Store URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                Store Description (Rich Text Editor)
              </label>
              <span className="text-[10px] font-mono text-sunflower-100/70 bg-sunflower-100/10 px-2 py-0.5 rounded border border-sunflower-100/20">
                BlockNote Black
              </span>
            </div>
            <BlockNoteEditor
              ref={editorRef}
              initialContent={description}
              placeholder="Merchant description visible on storefront shop profile..."
              theme="dark"
              minHeight="180px"
              onChange={(html) => setDescription(html)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Business Email
              </label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Business Phone
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Vendor KYC & Compliance Documents */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
          <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-pablano-200" />
              <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                KYC & Compliance Documents
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setCustomDocModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-matt-black-200 hover:bg-matt-black-300 text-sunflower-100 border border-sunflower-100/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Upload Additional Document
            </button>
          </div>

          <p className="text-xs text-white-chalk-100/50">
            View, download, or replace attached legal vendor verification files. If a document has not yet been submitted, use the upload trigger below to attach it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STANDARD_DOC_TYPES.map((std) => {
              const attachedDoc = documents.find((d) => d.type === std.type);
              const isUploadingThis = uploadingDocType === std.type;

              return (
                <div
                  key={std.type}
                  className={`rounded-xl border p-4 transition ${
                    attachedDoc
                      ? "bg-matt-black-200/50 border-white-chalk-100/15"
                      : "bg-matt-black-200/20 border-dashed border-white-chalk-100/15 hover:border-white-chalk-100/30"
                  }`}
                >
                  {/* Hidden File Input for this type */}
                  <input
                    ref={(el) => {
                      docInputRefs.current[std.type] = el;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocUpload(std.type, file);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white-chalk-100 flex items-center gap-1.5">
                        <File className="w-3.5 h-3.5 text-sunflower-100 shrink-0" />
                        {std.title}
                      </h4>
                      <p className="text-[11px] text-white-chalk-100/50 mt-0.5">
                        {std.desc}
                      </p>
                    </div>

                    {attachedDoc ? (
                      <AdminBadge
                        variant={
                          attachedDoc.status === "APPROVED"
                            ? "success"
                            : attachedDoc.status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {attachedDoc.status}
                      </AdminBadge>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-white-chalk-100/40 bg-white-chalk-100/5 px-2 py-0.5 rounded border border-white-chalk-100/10">
                        Missing
                      </span>
                    )}
                  </div>

                  {attachedDoc ? (
                    <div className="mt-4 pt-3 border-t border-white-chalk-100/10 flex items-center justify-between gap-2">
                      <div className="truncate max-w-[180px]">
                        <p className="text-[11px] font-mono text-white-chalk-100/80 truncate">
                          {attachedDoc.fileUrl.split("/").pop()}
                        </p>
                        <p className="text-[9px] text-white-chalk-100/40">
                          {new Date(attachedDoc.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(attachedDoc)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-white-chalk-100 border border-white-chalk-100/15 transition cursor-pointer"
                          title="View Document"
                        >
                          <Eye className="w-3.5 h-3.5 text-munsell-blue-100" />
                        </button>

                        {/* Download Button */}
                        <button
                          type="button"
                          onClick={() =>
                            triggerDownload(
                              attachedDoc.fileUrl,
                              `${std.type}_${shopName.replace(/\s+/g, "_")}`
                            )
                          }
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-white-chalk-100 border border-white-chalk-100/15 transition cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5 text-pablano-200" />
                        </button>

                        {/* Replace Document Button */}
                        <button
                          type="button"
                          onClick={() => docInputRefs.current[std.type]?.click()}
                          disabled={isUploadingThis}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-white-chalk-100 border border-white-chalk-100/15 transition cursor-pointer"
                          title="Replace Document"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 text-sunflower-100 ${
                              isUploadingThis ? "animate-spin" : ""
                            }`}
                          />
                        </button>

                        {/* Delete Document Button */}
                        <button
                          type="button"
                          onClick={() => handleDocDelete(attachedDoc.id)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-cadmium-red-100/20 text-white-chalk-100 border border-cadmium-red-100/20 transition cursor-pointer"
                          title="Remove Document"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-cadmium-red-200" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-white-chalk-100/10 flex items-center justify-between">
                      <span className="text-[10px] text-white-chalk-100/40">
                        {std.hint}
                      </span>
                      <button
                        type="button"
                        onClick={() => docInputRefs.current[std.type]?.click()}
                        disabled={isUploadingThis}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-sunflower-100/15 hover:bg-sunflower-100/25 text-sunflower-100 border border-sunflower-100/30 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud
                          className={`w-3.5 h-3.5 ${isUploadingThis ? "animate-spin" : ""}`}
                        />
                        {isUploadingThis ? "Uploading..." : "Upload Document"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Any Other Attached Documents */}
          {documents.filter((d) => !STANDARD_DOC_TYPES.some((std) => std.type === d.type)).length >
            0 && (
            <div className="pt-4 border-t border-white-chalk-100/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                Additional Attached Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents
                  .filter((d) => !STANDARD_DOC_TYPES.some((std) => std.type === d.type))
                  .map((otherDoc) => (
                    <div
                      key={otherDoc.id}
                      className="rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 p-3.5 flex items-center justify-between"
                    >
                      <div className="truncate max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white-chalk-100/10 text-white-chalk-100 font-mono">
                            {otherDoc.type}
                          </span>
                          <AdminBadge
                            variant={otherDoc.status === "APPROVED" ? "success" : "warning"}
                          >
                            {otherDoc.status}
                          </AdminBadge>
                        </div>
                        <p className="text-[11px] font-mono text-white-chalk-100/80 truncate mt-1">
                          {otherDoc.fileUrl.split("/").pop()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(otherDoc)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-munsell-blue-100 border border-white-chalk-100/15 cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDownload(otherDoc.fileUrl)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-pablano-200 border border-white-chalk-100/15 cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocDelete(otherDoc.id)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-cadmium-red-100/20 text-cadmium-red-200 border border-cadmium-red-100/20 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Administrative Governance & Moderation */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <Shield className="w-4 h-4 text-munsell-blue-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Administrative Governance & Status
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Store Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Taking Orders)</option>
                <option value="PENDING">PENDING (Awaiting Approval)</option>
                <option value="SUSPENDED">SUSPENDED (Frozen)</option>
                <option value="REJECTED">REJECTED (Declined)</option>
                <option value="CLOSED">CLOSED (Terminated)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                KYC Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
              >
                <option value="VERIFIED">VERIFIED (KYC Approved)</option>
                <option value="PENDING">PENDING (Documents In Review)</option>
                <option value="UNVERIFIED">UNVERIFIED (No Docs)</option>
                <option value="REJECTED">REJECTED (Failed Compliance)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Trust Badge Awarded
              </label>
              <select
                value={trustBadge}
                onChange={(e) => setTrustBadge(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer font-bold text-sunflower-100"
              >
                <option value="VERIFIED_SELLER">VERIFIED_SELLER (Badge Active)</option>
                <option value="NONE">NONE (Standard Merchant)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Custom Commission Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 10.0 (leave blank for platform default)"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white-chalk-100/40 font-bold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-white-chalk-100/40 mt-1">
                Overrides the default marketplace commission rule on vendor sales.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Merchant Owner Account */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <User className="w-4 h-4 text-pablano-200" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Account Holder Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Account Login Email
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Owner Phone Number
              </label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Store Policies */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <FileText className="w-4 h-4 text-sunflower-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Vendor Store Policies
            </h3>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
              Shipping & Delivery Policy
            </label>
            <textarea
              rows={2}
              value={shippingPolicy}
              onChange={(e) => setShippingPolicy(e.target.value)}
              placeholder="e.g. Standard dispatch within 24-48 business hours..."
              className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Return Policy
              </label>
              <textarea
                rows={2}
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                placeholder="e.g. 7-day hassle-free return for unsealed items..."
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Refund Policy
              </label>
              <textarea
                rows={2}
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                placeholder="e.g. Processed to original payment method within 3 business days..."
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/admin/sellers"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-sunflower-100/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Vendor Information"}
          </button>
        </div>
      </form>

      {/* Document Preview Modal */}
      {previewDoc && (
        <AdminModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.type.replace(/_/g, " ")}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <a
                href={previewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-sunflower-100 hover:underline flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open File in New Tab
              </a>
              <button
                type="button"
                onClick={() =>
                  triggerDownload(
                    previewDoc.fileUrl,
                    `${previewDoc.type}_${shopName.replace(/\s+/g, "_")}`
                  )
                }
                className="px-4 py-2 rounded-xl text-xs font-bold bg-pablano-100 text-white-chalk-100 hover:bg-pablano-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download File
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-white-chalk-100/60 pb-2 border-b border-white-chalk-100/10">
              <span>Status: <AdminBadge variant={previewDoc.status === "APPROVED" ? "success" : "warning"}>{previewDoc.status}</AdminBadge></span>
              <span className="font-mono">{previewDoc.fileUrl.split("/").pop()}</span>
            </div>

            <div className="bg-matt-black-300 rounded-xl p-2 border border-white-chalk-100/10 min-h-[300px] max-h-[500px] overflow-auto flex items-center justify-center">
              {previewDoc.fileUrl.match(/\.(jpg|jpeg|png|webp|svg)$/i) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt="Document"
                  className="max-h-[480px] max-w-full object-contain mx-auto rounded"
                />
              ) : previewDoc.fileUrl.match(/\.pdf$/i) ? (
                <iframe
                  src={previewDoc.fileUrl}
                  className="w-full h-[450px] rounded border border-white-chalk-100/10"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-12 h-12 text-white-chalk-100/30 mx-auto mb-2" />
                  <p className="text-xs text-white-chalk-100">
                    Binary document file: {previewDoc.fileUrl.split("/").pop()}
                  </p>
                  <a
                    href={previewDoc.fileUrl}
                    download
                    className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File to View
                  </a>
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      {/* Upload Custom Document Modal */}
      {customDocModalOpen && (
        <AdminModal
          isOpen={customDocModalOpen}
          onClose={() => {
            setCustomDocModalOpen(false);
            setCustomDocFile(null);
          }}
          title="Upload Additional Verification Document"
          maxWidth="md"
        >
          <form onSubmit={handleUploadCustomDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Document Classification *
              </label>
              <select
                value={customDocType}
                onChange={(e) => setCustomDocType(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
              >
                <option value="IDENTITY">IDENTITY (CNIC / Passport)</option>
                <option value="BUSINESS_LICENSE">BUSINESS_LICENSE (NTN / SECP)</option>
                <option value="TAX_DOCUMENT">TAX_DOCUMENT (Sales Tax / STRN)</option>
                <option value="BANK_DOCUMENT">BANK_DOCUMENT (IBAN / Cheque)</option>
                <option value="OTHER">OTHER (General Supporting Document)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Internal Review Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified against FBR active taxpayer portal"
                value={customDocNotes}
                onChange={(e) => setCustomDocNotes(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Select File (PDF, JPG, PNG) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setCustomDocFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-white-chalk-100 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-sunflower-100 file:text-matt-black-100 hover:file:bg-sunflower-200 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white-chalk-100/10">
              <button
                type="button"
                onClick={() => setCustomDocModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingCustomDoc || !customDocFile}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {uploadingCustomDoc ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
