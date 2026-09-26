"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Package,
  Save,
  ArrowLeft,
  UploadCloud,
  ImageIcon,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Store,
  Tag,
  Globe,
  ShieldAlert,
  Sparkles,
  Clock,
  Layers,
  ChevronRight,
  Eye,
} from "lucide-react";
import { AdminBadge, AdminModal } from "@/components/admin/AdminUI";
import type { BlockNoteEditorRef } from "@/components/blocknote/blocknoteEditor";

const BlockNoteEditor = dynamic(
  () => import("@/components/blocknote/blocknoteEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-44 rounded-xl bg-matt-black-200/50 border border-white-chalk-100/10 animate-pulse flex items-center justify-center text-xs text-white-chalk-100/40">
        Loading BlockNote black editor...
      </div>
    ),
  }
);

interface EditSubmissionPageProps {
  params: Promise<{ id: string }>;
}

interface BrandOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface SellerOption {
  id: string;
  shopName: string;
  status: string;
}

interface ProductImg {
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder?: number;
}

const TABS = [
  { id: "general", label: "General & Store", icon: Package },
  { id: "pricing", label: "Pricing & Stock", icon: DollarSign },
  { id: "content", label: "Content & Specs", icon: FileText },
  { id: "media", label: "Images & Media", icon: ImageIcon },
  { id: "moderation", label: "Moderation & Status", icon: ShieldAlert },
];

export default function EditProductSubmissionPage({ params }: EditSubmissionPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // BlockNote Editor Refs
  const shortDescEditorRef = useRef<BlockNoteEditorRef>(null);
  const descriptionEditorRef = useRef<BlockNoteEditorRef>(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Submission metadata
  const [submissionData, setSubmissionData] = useState<any>(null);

  // Tab 1: General & Store
  const [sellerId, setSellerId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [productType, setProductType] = useState("SIMPLE");
  const [brandId, setBrandId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [status, setStatus] = useState("PENDING_REVIEW");

  // Tab 2: Pricing & Stock
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellerSku, setSellerSku] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [condition, setCondition] = useState("NEW");

  // Tab 3: Content & Specs
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [warrantyTitle, setWarrantyTitle] = useState("");
  const [warrantyDescription, setWarrantyDescription] = useState("");

  // Tab 4: Media
  const [images, setImages] = useState<ProductImg[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown options
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/product-submissions/${id}`).then((r) => r.json()),
      fetch("/api/admin/sellers?limit=100").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/categories?limit=100").then((r) => r.json()),
    ])
      .then(([subRes, sellersData, brandsData, catData]) => {
        const sList = sellersData.data?.sellers || sellersData.data || [];
        if (Array.isArray(sList)) setSellers(sList);

        if (Array.isArray(brandsData.data)) setBrands(brandsData.data);

        const cList = catData.data?.categories || catData.data || [];
        if (Array.isArray(cList)) setCategories(cList);

        const sub = subRes.data;
        if (sub) {
          setSubmissionData(sub);
          const payload = sub.payload || {};

          setSellerId(sub.seller?.id || sub.sellerId || (sList.length > 0 ? sList[0].id : ""));
          setName(sub.title || payload.name || "");
          setSlug(payload.slug || "");
          setProductType(payload.productType || "SIMPLE");
          setBrandId(payload.brandId || "");
          setStatus(sub.status || "PENDING_REVIEW");

          const catIds: string[] = Array.isArray(payload.categories)
            ? payload.categories
              .map((c: any) => (typeof c === "string" ? c : c.categoryId || c.id))
              .filter(Boolean)
            : [];
          setSelectedCategoryIds(catIds);

          setPrice(payload.price !== undefined ? String(payload.price) : "");
          setCompareAtPrice(
            payload.compareAtPrice !== undefined && payload.compareAtPrice !== null
              ? String(payload.compareAtPrice)
              : ""
          );
          setCostPrice(
            payload.costPrice !== undefined && payload.costPrice !== null
              ? String(payload.costPrice)
              : ""
          );
          setSellerSku(payload.sellerSku || "");
          setQuantity(payload.quantity !== undefined ? String(payload.quantity) : "0");
          setLowStockThreshold(
            payload.lowStockThreshold !== undefined ? String(payload.lowStockThreshold) : "5"
          );
          setCondition(payload.condition || "NEW");

          setShortDescription(payload.shortDescription || "");
          setDescription(payload.description || "");
          setModelNumber(payload.modelNumber || "");
          setManufacturer(payload.manufacturer || "");
          countryOfOrigin ? setCountryOfOrigin(payload.countryOfOrigin) : setCountryOfOrigin(payload.countryOfOrigin || "");
          setWarrantyTitle(payload.warrantyTitle || "");
          setWarrantyDescription(payload.warrantyDescription || "");

          const imgs: ProductImg[] = Array.isArray(payload.images)
            ? payload.images.map((img: any, i: number) => ({
              url: img.url || "",
              altText: img.altText || "",
              isPrimary: img.isPrimary ?? i === 0,
              sortOrder: img.sortOrder ?? i,
            }))
            : [];
          setImages(imgs);
        } else {
          setErrorMsg("Submission not found.");
        }
      })
      .catch((err) => {
        console.error("Failed to load submission data:", err);
        setErrorMsg("Failed to load submission details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload image.");
      }

      setImages((prev) => [
        ...prev,
        {
          url: data.data.url,
          altText: name || "Product Image",
          isPrimary: prev.length === 0,
          sortOrder: prev.length,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading product image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: imageUrlInput.trim(),
        altText: name || "Product Image",
        isPrimary: prev.length === 0,
        sortOrder: prev.length,
      },
    ]);
    setImageUrlInput("");
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((i) => i !== catId) : [...prev, catId]
    );
  };

  const handleSave = async (andApprove = false) => {
    if (andApprove) {
      setApproving(true);
    } else {
      setSaving(true);
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!name.trim()) {
        throw new Error("Product title is required.");
      }
      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        throw new Error("Please enter a valid price greater than 0.");
      }

      const shortDescHtml = shortDescEditorRef.current
        ? await shortDescEditorRef.current.getContent()
        : shortDescription;
      const descHtml = descriptionEditorRef.current
        ? await descriptionEditorRef.current.getContent()
        : description;

      const bodyData = {
        sellerId,
        name: name.trim(),
        slug: slug.trim() || undefined,
        productType,
        brandId: brandId || null,
        categories: selectedCategoryIds,
        status: andApprove ? "APPROVED" : status,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        costPrice: costPrice ? Number(costPrice) : null,
        quantity: Number(quantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        condition,
        sellerSku: sellerSku.trim() || null,
        shortDescription: shortDescHtml?.trim() || null,
        description: descHtml?.trim() || null,
        modelNumber: modelNumber.trim() || null,
        manufacturer: manufacturer.trim() || null,
        countryOfOrigin: countryOfOrigin.trim() || null,
        warrantyTitle: warrantyTitle.trim() || null,
        warrantyDescription: warrantyDescription.trim() || null,
        images,
      };

      const res = await fetch(`/api/admin/product-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update submission.");
      }

      if (andApprove) {
        const approveRes = await fetch(`/api/admin/product-submissions/${id}/approve`, {
          method: "POST",
        });
        const approveData = await approveRes.json();
        if (!approveRes.ok) {
          throw new Error(approveData.message || "Saved changes, but approval failed.");
        }
        setStatus("APPROVED");
        setSuccessMsg("Submission approved and product published to marketplace successfully!");
      } else {
        setSuccessMsg("Submission updated successfully!");
      }

      // Refresh current submission record
      setSubmissionData((prev: any) => ({
        ...prev,
        ...data.data,
        status: andApprove ? "APPROVED" : status,
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save submission.");
    } finally {
      setSaving(false);
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg("Please provide a rejection note explaining required corrections.");
      return;
    }

    setRejecting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/product-submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reject submission.");
      }

      setStatus("REJECTED");
      setRejectModalOpen(false);
      setSuccessMsg("Submission rejected with feedback.");
      setSubmissionData((prev: any) => ({
        ...prev,
        status: "REJECTED",
        rejectionReason: rejectReason.trim(),
      }));
    } catch (err: any) {
      setErrorMsg(err.message || "Rejection action failed.");
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/product-submissions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete submission.");
      }
      router.push("/admin/catalogue/product-submissions");
    } catch (err: any) {
      alert(err.message || "Failed to delete submission.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-12 text-center text-xs text-white-chalk-100/40 animate-pulse">
        Loading product submission proposal...
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 pb-20 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white-chalk-100/10 pb-6">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-white-chalk-100/40 mb-1.5 font-medium">
            <Link href="/admin/dashboard" className="hover:text-sunflower-100 transition-colors">
              Admin
            </Link>
            <span>/</span>
            <Link href="/admin/catalogue/products" className="hover:text-sunflower-100 transition-colors">
              Catalogue
            </Link>
            <span>/</span>
            <Link href="/admin/catalogue/product-submissions" className="hover:text-sunflower-100 transition-colors">
              Submissions
            </Link>
            <span>/</span>
            <span className="text-white-chalk-100/70">Edit Proposal</span>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/catalogue/product-submissions"
              className="p-1.5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/50 text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-matt-black-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold font-sora text-white-chalk-100 tracking-tight truncate max-w-lg">
              {name || "Edit Product Proposal"}
            </h1>
            <AdminBadge status={status} />
          </div>
          <p className="text-xs text-white-chalk-100/60 mt-1">
            Seller Store: <span className="text-white-chalk-100 font-semibold">{submissionData?.seller?.shopName || "Unknown"}</span> &bull; Submitted: {submissionData?.submittedAt ? new Date(submissionData.submittedAt).toLocaleDateString() : "Draft"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 rounded-xl text-xs font-semibold border border-cadmium-red-100/20 bg-cadmium-red-100/10 text-cadmium-red-200 hover:bg-cadmium-red-100/20 transition cursor-pointer"
            title="Delete Proposal"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {status !== "REJECTED" && (
            <button
              onClick={() => {
                setRejectReason(submissionData?.rejectionReason || "");
                setRejectModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100/20 border border-cadmium-red-100/30 text-cadmium-red-200 hover:bg-cadmium-red-100/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          )}

          <button
            onClick={() => handleSave(false)}
            disabled={saving || approving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white-chalk-100/10 border border-white-chalk-100/20 text-white-chalk-100 hover:bg-white-chalk-100/20 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {status !== "APPROVED" && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving || approving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-sunflower-100/20 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {approving ? "Publishing..." : "Approve & Publish"}
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-cadmium-red-100/10 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-pablano-100/10 border border-pablano-100/30 text-pablano-200 text-xs flex items-center gap-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {submissionData?.rejectionReason && (
        <div className="p-4 rounded-2xl bg-cadmium-red-100/10 border border-cadmium-red-100/20 text-xs text-cadmium-red-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Current Rejection Reason:
          </div>
          <p className="text-white-chalk-100/80 pl-5">{submissionData.rejectionReason}</p>
        </div>
      )}

      {/* Main Grid: Left Tabs Sidebar & Right Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs (Left) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-3 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${isActive
                    ? "bg-sunflower-100 text-matt-black-100 shadow-md shadow-sunflower-100/10 font-bold"
                    : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-matt-black-100" : "text-white-chalk-100/50"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Proposal Summary Card */}
          <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/40 p-4 space-y-3 text-xs">
            <h4 className="font-bold text-white-chalk-100/40 uppercase tracking-wider text-[10px]">
              Audit & Review Details
            </h4>
            <div className="space-y-1.5 text-white-chalk-100/70">
              <div className="flex justify-between">
                <span>Seller:</span>
                <span className="font-semibold text-white-chalk-100">{submissionData?.seller?.shopName || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <AdminBadge status={status} />
              </div>
              <div className="flex justify-between">
                <span>Reviewed By:</span>
                <span className="text-white-chalk-100 font-mono">
                  {submissionData?.reviewedBy?.email || "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="text-white-chalk-100">
                  {new Date(submissionData?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Panels (Right) */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: General & Store */}
          {activeTab === "general" && (
            <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-sunflower-100" />
                Store & General Classification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seller Store */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Seller Store <span className="text-cadmium-red-100">*</span>
                  </label>
                  <select
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  >
                    <option value="" disabled>Select Seller Store</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-matt-black-100">
                        {s.shopName} {s.status !== "ACTIVE" ? `(${s.status})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Submission Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  >
                    <option value="PENDING_REVIEW" className="bg-matt-black-100">Pending Review</option>
                    <option value="SUBMITTED" className="bg-matt-black-100">Submitted (Queue)</option>
                    <option value="UNDER_REVIEW" className="bg-matt-black-100">Under Review</option>
                    <option value="DRAFT" className="bg-matt-black-100">Draft</option>
                    <option value="APPROVED" className="bg-matt-black-100">Approved</option>
                    <option value="REJECTED" className="bg-matt-black-100">Rejected</option>
                    <option value="RESUBMITTED" className="bg-matt-black-100">Resubmitted</option>
                  </select>
                </div>
              </div>

              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                  Product Name / Title <span className="text-cadmium-red-100">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wireless Noise-Cancelling Headphones Pro"
                  className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30 font-medium"
                />
              </div>

              {/* Slug & Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. wireless-noise-cancelling-headphones-pro"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Product Type
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  >
                    <option value="SIMPLE" className="bg-matt-black-100">Simple Product</option>
                    <option value="VARIABLE" className="bg-matt-black-100">Variable Product</option>
                    <option value="DIGITAL" className="bg-matt-black-100">Digital Product</option>
                    <option value="VIRTUAL" className="bg-matt-black-100">Virtual Product</option>
                    <option value="SERVICE" className="bg-matt-black-100">Service</option>
                    <option value="BUNDLE" className="bg-matt-black-100">Bundle</option>
                  </select>
                </div>
              </div>

              {/* Brand & Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Brand (Optional)
                  </label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  >
                    <option value="" className="bg-matt-black-100">No Brand / Generic</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id} className="bg-matt-black-100">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Assigned Categories
                  </label>
                  <div className="max-h-36 overflow-y-auto custom-scrollbar border border-white-chalk-100/10 bg-matt-black-200/40 rounded-xl p-2.5 space-y-1.5">
                    {categories.length === 0 ? (
                      <p className="text-xs text-white-chalk-100/40 italic">No categories loaded.</p>
                    ) : (
                      categories.map((c) => {
                        const isChecked = selectedCategoryIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition ${isChecked
                              ? "bg-sunflower-100/10 text-sunflower-100"
                              : "text-white-chalk-100/70 hover:bg-white-chalk-100/5"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCategory(c.id)}
                              className="rounded border-white-chalk-100/20 text-sunflower-100 focus:ring-0"
                            />
                            <span>{c.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Stock */}
          {activeTab === "pricing" && (
            <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-sunflower-100" />
                Pricing, Inventory & Conditions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Selling Price ($) <span className="text-cadmium-red-100">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-white-chalk-100/40 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white-chalk-100 outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Compare-at Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-white-chalk-100/40 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Cost Price ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-white-chalk-100/40 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Seller SKU
                  </label>
                  <input
                    type="text"
                    value={sellerSku}
                    onChange={(e) => setSellerSku(e.target.value)}
                    placeholder="e.g. KB-ERG-PRO-01"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="5"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                  Item Condition
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["NEW", "USED", "REFURBISHED", "OPEN_BOX"].map((cond) => (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => setCondition(cond)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${condition === cond
                        ? "bg-sunflower-100/10 text-sunflower-100 border-sunflower-100/40 shadow-sm"
                        : "bg-matt-black-200/40 text-white-chalk-100/60 border-white-chalk-100/10 hover:text-white-chalk-100"
                        }`}
                    >
                      {cond.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Content & Specs */}
          {activeTab === "content" && (
            <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sunflower-100" />
                Descriptions & Technical Specifications
              </h3>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                    Short Description (Storefront Bullet Highlights)
                  </label>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Displayed above the fold next to the Buy Box
                  </span>
                </div>
                <BlockNoteEditor
                  ref={shortDescEditorRef}
                  initialContent={shortDescription}
                  placeholder="Key features, bullet specs, primary highlights..."
                  theme="dark"
                  minHeight="140px"
                  onChange={(html) => setShortDescription(html)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                    Detailed Product Description
                  </label>
                  <span className="text-[10px] font-mono text-sunflower-100/80 bg-sunflower-100/10 px-2 py-0.5 rounded border border-sunflower-100/20 font-bold">
                    BlockNote Editor
                  </span>
                </div>
                <BlockNoteEditor
                  ref={descriptionEditorRef}
                  initialContent={description}
                  placeholder="Comprehensive product specifications, features, package contents, materials..."
                  theme="dark"
                  minHeight="260px"
                  onChange={(html) => setDescription(html)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    placeholder="e.g. MOD-9900"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    placeholder="e.g. Logitech, Sony, Apple"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. Pakistan, Japan, USA"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Warranty Title
                  </label>
                  <input
                    type="text"
                    value={warrantyTitle}
                    onChange={(e) => setWarrantyTitle(e.target.value)}
                    placeholder="e.g. 1 Year Official Replacement Warranty"
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Warranty Terms
                  </label>
                  <input
                    type="text"
                    value={warrantyDescription}
                    onChange={(e) => setWarrantyDescription(e.target.value)}
                    placeholder="e.g. Covers internal manufacturing defects..."
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Media & Images */}
          {activeTab === "media" && (
            <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sunflower-100" />
                Product Imagery & Gallery
              </h3>

              {/* Upload & Add URL Controls */}
              <div className="bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-sunflower-100/10 border border-sunflower-100/30 text-sunflower-100 hover:bg-sunflower-100/20 transition cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-40"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Upload Image File"}
                  </button>

                  <div className="w-full flex items-center gap-2">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or enter direct image URL (https://...)..."
                      className="flex-1 bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white-chalk-100/10 border border-white-chalk-100/20 text-white-chalk-100 hover:bg-white-chalk-100/20 transition cursor-pointer shrink-0"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Gallery Grid */}
              {images.length === 0 ? (
                <div className="py-12 rounded-xl border border-dashed border-white-chalk-100/10 flex flex-col items-center justify-center text-center">
                  <ImageIcon className="w-10 h-10 text-white-chalk-100/20 mb-2" />
                  <p className="text-xs text-white-chalk-100/50 font-medium">
                    No images attached. Upload or link product imagery to enhance seller proposals.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-2 flex flex-col justify-between bg-matt-black-200/40 relative group ${img.isPrimary ? "border-sunflower-100/60 shadow-md shadow-sunflower-100/5" : "border-white-chalk-100/10"
                        }`}
                    >
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-matt-black-300 relative mb-2">
                        <img
                          src={img.url}
                          alt={img.altText || "Product Image"}
                          className="w-full h-full object-cover"
                        />
                        {img.isPrimary && (
                          <span className="absolute top-2 left-2 bg-sunflower-100 text-matt-black-100 text-[9px] font-bold px-2 py-0.5 rounded shadow">
                            Primary
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-auto pt-1">
                        {!img.isPrimary ? (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="text-[10px] text-sunflower-100 hover:underline cursor-pointer"
                          >
                            Set Primary
                          </button>
                        ) : (
                          <span className="text-[10px] text-white-chalk-100/40">Main Image</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="text-[10px] text-cadmium-red-200/70 hover:text-cadmium-red-200 cursor-pointer ml-auto flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Moderation & Status */}
          {activeTab === "moderation" && (
            <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sunflower-100" />
                Moderation Decisions & Status
              </h3>

              <div className="p-4 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/5 space-y-2 text-xs">
                <div className="font-semibold text-white-chalk-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sunflower-100" />
                  Live Catalogue Publishing
                </div>
                <p className="text-white-chalk-100/60 leading-relaxed">
                  Approving this submission creates a live marketplace listing and indexes the product into the platform catalogue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                  Change Submission Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "PENDING_REVIEW", label: "Pending Review" },
                    { id: "UNDER_REVIEW", label: "Under Review" },
                    { id: "APPROVED", label: "Approved" },
                    { id: "REJECTED", label: "Rejected" },
                    { id: "DRAFT", label: "Draft" },
                    { id: "SUBMITTED", label: "Submitted" },
                    { id: "RESUBMITTED", label: "Resubmitted" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${status === s.id
                        ? "bg-sunflower-100/10 text-sunflower-100 border-sunflower-100/40"
                        : "bg-matt-black-200/40 text-white-chalk-100/60 border-white-chalk-100/10 hover:text-white-chalk-100"
                        }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <AdminModal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Product Proposal"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-cadmium-red-100/20 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                {rejecting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-white-chalk-100/70">
              Provide feedback for the seller explaining what needs to be changed (e.g. invalid pricing, unclear images, missing specifications).
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-cadmium-red-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30"
            />
          </div>
        </AdminModal>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <AdminModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Product Submission"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-cadmium-red-100/20 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          }
        >
          <div className="space-y-2 text-xs">
            <p className="text-white-chalk-100/80">
              Are you sure you want to permanently delete this product submission proposal? This action cannot be reversed.
            </p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
