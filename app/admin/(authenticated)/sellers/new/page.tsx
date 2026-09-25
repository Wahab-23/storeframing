"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Shield,
  UploadCloud,
  Image as ImageIcon,
  File,
  FileCheck,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AdminPageHeader, AdminBadge, AdminModal } from "@/components/admin/AdminUI";
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

interface AttachedDoc {
  type: string;
  title: string;
  fileUrl: string;
  fileName: string;
}

const INITIAL_DOC_SLOTS = [
  {
    type: "IDENTITY",
    title: "National Identity Card (CNIC / Passport)",
    desc: "Proof of legal identity for store proprietor or representative",
  },
  {
    type: "BUSINESS_LICENSE",
    title: "Business License / NTN Certificate",
    desc: "National Tax Number (NTN) or SECP business incorporation cert",
  },
  {
    type: "TAX_DOCUMENT",
    title: "Sales Tax Registration (STRN / FBR)",
    desc: "Sales tax certificate or active taxpayer verification list",
  },
  {
    type: "BANK_DOCUMENT",
    title: "Bank Account Verification (IBAN / Cheque)",
    desc: "Bank maintenance certificate or voided cheque for payouts",
  },
];

export default function NewSellerPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [status, setStatus] = useState<string>("ACTIVE");
  const [verificationStatus, setVerificationStatus] = useState<string>("PENDING");
  const [commissionRate, setCommissionRate] = useState<string>("");

  // Media
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Documents
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<AttachedDoc | null>(null);

  // Refs for file inputs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const docInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const editorRef = useRef<BlockNoteEditorRef>(null);

  // Owner credentials
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("Password123!");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const handleShopNameChange = (val: string) => {
    setShopName(val);
    if (!slug || slug === val.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  // Upload Logo
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
      if (!res.ok) throw new Error(data.message || "Failed to upload logo");
      setLogoUrl(data.data.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload Banner
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
      if (!res.ok) throw new Error(data.message || "Failed to upload banner");
      setBannerUrl(data.data.url);
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  // Upload Document
  const handleDocUpload = async (type: string, title: string, file: File) => {
    setUploadingDocType(type);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "documents");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload document");

      setAttachedDocs((prev) => [
        ...prev.filter((d) => d.type !== type),
        {
          type,
          title,
          fileUrl: data.data.url,
          fileName: file.name,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading document.");
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleDocRemove = (type: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.type !== type));
  };

  const triggerDownload = (fileUrl: string, nameHint: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = nameHint || "document";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
      const res = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopName.trim(),
          slug: slug.trim(),
          description: finalDesc.trim() || undefined,
          businessEmail: businessEmail.trim() || ownerEmail.trim(),
          businessPhone: businessPhone.trim() || phone.trim() || undefined,
          status,
          verificationStatus,
          commissionRate: commissionRate ? Number(commissionRate) : undefined,
          logoUrl: logoUrl.trim() || undefined,
          bannerUrl: bannerUrl.trim() || undefined,
          documents: attachedDocs.map((d) => ({
            type: d.type,
            fileUrl: d.fileUrl,
          })),
          ownerEmail: ownerEmail.trim(),
          ownerPassword: ownerPassword.trim(),
          firstName: firstName.trim() || shopName.trim(),
          lastName: lastName.trim() || "Vendor",
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create vendor account");
      }

      router.push("/admin/sellers");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while creating vendor.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <AdminPageHeader
        title="Add New Vendor"
        description="Onboard a new merchant store directly to the marketplace, configure store media assets, verify compliance documents, and set commission rules."
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sellers", href: "/admin/sellers" },
          { label: "New Vendor" },
        ]}
        actions={
          <Link
            href="/admin/sellers"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sellers
          </Link>
        }
      />

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cadmium-red-100/15 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
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

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Section 1: Store Media (Logo & Banner) */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-6">
          <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-sunflower-100" />
              <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                Store Logo & Cover Banner
              </h3>
            </div>
            <span className="text-[11px] text-white-chalk-100/40">
              High-resolution assets for marketplace presence
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
                      alt="Logo Preview"
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
                      Square 1:1 • PNG, JPG, WEBP, SVG (Max 2MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Banner Upload Box (3:1 Ratio) */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                  Store Cover Banner
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
                      alt="Banner Preview"
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
                      Recommended: 1200×400 px, 3:1 Panorama • JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Store Profile */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <Store className="w-4 h-4 text-sunflower-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Merchant Store Profile
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
                placeholder="e.g. Apex Tech Supplies"
                value={shopName}
                onChange={(e) => handleShopNameChange(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                placeholder="apex-tech-supplies"
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
              placeholder="Store overview, products specialization, and merchant story..."
              theme="dark"
              minHeight="180px"
              onChange={(html) => setDescription(html)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Business Support Email
              </label>
              <input
                type="email"
                placeholder="contact@store.com"
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
                placeholder="+92 300 1234567"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Verification & Compliance Documents */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-pablano-200" />
              <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                Verification & KYC Documents
              </h3>
            </div>
            <span className="text-[11px] text-white-chalk-100/40">
              Attach compliance files prior to onboarding
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_DOC_SLOTS.map((slot) => {
              const attached = attachedDocs.find((d) => d.type === slot.type);
              const isUploading = uploadingDocType === slot.type;

              return (
                <div
                  key={slot.type}
                  className={`rounded-xl border p-4 transition ${
                    attached
                      ? "bg-matt-black-200/50 border-white-chalk-100/15"
                      : "bg-matt-black-200/20 border-dashed border-white-chalk-100/15"
                  }`}
                >
                  {/* Hidden file input */}
                  <input
                    ref={(el) => {
                      docInputRefs.current[slot.type] = el;
                    }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocUpload(slot.type, slot.title, file);
                      e.target.value = "";
                    }}
                  />

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white-chalk-100 flex items-center gap-1.5">
                        <File className="w-3.5 h-3.5 text-sunflower-100 shrink-0" />
                        {slot.title}
                      </h4>
                      <p className="text-[11px] text-white-chalk-100/50 mt-0.5">
                        {slot.desc}
                      </p>
                    </div>

                    {attached ? (
                      <AdminBadge variant="success">Attached</AdminBadge>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-white-chalk-100/40 bg-white-chalk-100/5 px-2 py-0.5 rounded border border-white-chalk-100/10">
                        Optional
                      </span>
                    )}
                  </div>

                  {attached ? (
                    <div className="mt-3 pt-3 border-t border-white-chalk-100/10 flex items-center justify-between">
                      <p className="text-[11px] font-mono text-white-chalk-100/80 truncate max-w-[180px]">
                        {attached.fileName}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(attached)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-munsell-blue-100 border border-white-chalk-100/15 cursor-pointer"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDownload(attached.fileUrl, attached.fileName)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-matt-black-100 text-pablano-200 border border-white-chalk-100/15 cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocRemove(attached.type)}
                          className="p-1.5 rounded-lg bg-matt-black-300 hover:bg-cadmium-red-100/20 text-cadmium-red-200 border border-cadmium-red-100/20 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-white-chalk-100/10 flex items-center justify-between">
                      <span className="text-[10px] text-white-chalk-100/40">
                        PDF, JPG, PNG (Max 10MB)
                      </span>
                      <button
                        type="button"
                        onClick={() => docInputRefs.current[slot.type]?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-sunflower-100/15 hover:bg-sunflower-100/25 text-sunflower-100 border border-sunflower-100/30 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud
                          className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`}
                        />
                        {isUploading ? "Uploading..." : "Upload Document"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Initial Governance Settings */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <Shield className="w-4 h-4 text-munsell-blue-100" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Initial Status & Financial Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Initial Store Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE (Immediate Selling)</option>
                <option value="PENDING">PENDING (Awaiting Approval)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Verification Status
              </label>
              <select
                value={verificationStatus}
                onChange={(e) => setVerificationStatus(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
              >
                <option value="VERIFIED">VERIFIED (Trusted Vendor)</option>
                <option value="PENDING">PENDING (Documents In Review)</option>
                <option value="UNVERIFIED">UNVERIFIED (No Docs)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Custom Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="e.g. 8.5 (optional)"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Owner Account Creation */}
        <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
            <UserPlus className="w-4 h-4 text-pablano-200" />
            <h3 className="font-sora text-sm font-bold text-white-chalk-100">
              Primary Account Login & Credentials
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Owner Login Email *
              </label>
              <input
                type="email"
                required
                placeholder="vendor@company.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Initial Password *
              </label>
              <input
                type="text"
                required
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Owner First Name
              </label>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Owner Last Name
              </label>
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Owner Direct Phone
              </label>
              <input
                type="text"
                placeholder="+92 300 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            <UserPlus className="w-4 h-4" />
            {saving ? "Creating Vendor..." : "Create Vendor Account"}
          </button>
        </div>
      </form>

      {/* Document Preview Modal */}
      {previewDoc && (
        <AdminModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`Document Preview: ${previewDoc.title}`}
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
                Open in New Tab
              </a>
              <button
                type="button"
                onClick={() => triggerDownload(previewDoc.fileUrl, previewDoc.fileName)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-pablano-100 text-white-chalk-100 hover:bg-pablano-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download File
              </button>
            </div>
          }
        >
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
                  Document: {previewDoc.fileName}
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
        </AdminModal>
      )}
    </div>
  );
}
