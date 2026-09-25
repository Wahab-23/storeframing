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
  Image as ImageIcon,
  Star,
  Trash2,
  Plus,
  Layers,
  Tag,
  Globe,
  Ruler,
  Scale,
  CheckCircle,
  AlertCircle,
  FileText,
  Boxes,
  DollarSign,
  Store,
  Sliders,
  Eye,
  Check,
  History,
  Clock,
  User,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
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

interface EditProductPageProps {
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
}

interface ProductImg {
  url: string;
  altText: string;
  isPrimary: boolean;
}

interface VariantItem {
  id?: string;
  name: string;
  sku: string;
  price?: string;
  stock?: string;
}

interface SellerListingItem {
  id: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  sellerSku?: string | null;
  status: string;
  seller: {
    id: string;
    shopName: string;
    slug: string;
  };
  inventory?: {
    quantity: number;
  } | null;
}

interface RevisionItem {
  id: string;
  revisionNumber: number;
  status: string;
  summary: string | null;
  payload: any;
  createdAt: string;
  publishedAt: string | null;
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  oldData: any;
  newData: any;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

const TABS = [
  { id: "general", label: "General Settings", icon: Package },
  { id: "content", label: "Content & Descriptions", icon: FileText },
  { id: "images", label: "Images & Media", icon: ImageIcon },
  { id: "pricing", label: "Pricing & Inventory", icon: DollarSign },
  { id: "configurations", label: "Configurations / Variants", icon: Boxes },
  { id: "seo", label: "Search Engine Optimization", icon: Globe },
  { id: "marketplace", label: "Marketplace & Offers", icon: Store },
  { id: "history", label: "History & Audit Trail", icon: History },
];

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reference for BlockNote editors
  const shortDescEditorRef = useRef<BlockNoteEditorRef>(null);
  const longDescEditorRef = useRef<BlockNoteEditorRef>(null);

  // Tab 1: General Info
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [productType, setProductType] = useState("SIMPLE");
  const [status, setStatus] = useState("ACTIVE");
  const [visibility, setVisibility] = useState("VISIBLE");
  const [modelNumber, setModelNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("Pakistan");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Tab 2: Content
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");

  // Tab 3: Images & Media
  const [images, setImages] = useState<ProductImg[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 4: Pricing & Inventory
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("100");
  const [stockStatus, setStockStatus] = useState("IN_STOCK");

  // Tab 5: Configurations / Variants
  const [variantOptionName, setVariantOptionName] = useState("Size");
  const [variantValuesInput, setVariantValuesInput] = useState("Small, Medium, Large");
  const [variants, setVariants] = useState<VariantItem[]>([]);

  // Tab 6: SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Tab 7: Marketplace & Scope
  const [ownershipType, setOwnershipType] = useState("PLATFORM");
  const [ownerSellerId, setOwnerSellerId] = useState("");
  const [listings, setListings] = useState<SellerListingItem[]>([]);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);

  // Tab 8: History & Audit Trail
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Dropdown options
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load Product Data and references
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/categories?limit=100").then((r) => r.json()),
      fetch("/api/admin/sellers?limit=100").then((r) => r.json()),
    ])
      .then(([prodRes, brandsRes, catRes, sellersRes]) => {
        if (Array.isArray(brandsRes.data)) setBrands(brandsRes.data);
        const catList = catRes.data?.categories || catRes.data || [];
        if (Array.isArray(catList)) setCategories(catList);
        const sellerList = sellersRes.data?.items || sellersRes.data || [];
        if (Array.isArray(sellerList)) setSellers(sellerList);

        const p = prodRes.data;
        if (p) {
          setName(p.name || "");
          setSlug(p.slug || "");
          setSku(p.variants?.[0]?.sku || p.listings?.[0]?.sellerSku || `${p.slug}-001`);
          setShortDesc(p.shortDescription || "");
          setLongDesc(p.description || "");
          setSelectedBrandId(p.brandId || "");
          setSelectedCategoryIds(
            Array.isArray(p.categories)
              ? p.categories.map((c: any) => c.categoryId || c.category?.id)
              : []
          );
          setOwnershipType(p.ownershipType || "PLATFORM");
          setOwnerSellerId(p.ownerSellerId || "");
          setProductType(p.productType || "SIMPLE");
          setStatus(p.status || "ACTIVE");
          setVisibility(p.visibility || "VISIBLE");
          setModelNumber(p.modelNumber || "");
          setManufacturer(p.manufacturer || "");
          setCountryOfOrigin(p.countryOfOrigin || "Pakistan");
          setWeight(p.weight !== null && p.weight !== undefined ? String(p.weight) : "");
          setLength(p.length !== null && p.length !== undefined ? String(p.length) : "");
          setWidth(p.width !== null && p.width !== undefined ? String(p.width) : "");
          setHeight(p.height !== null && p.height !== undefined ? String(p.height) : "");

          if (Array.isArray(p.images)) {
            setImages(
              p.images.map((img: any) => ({
                url: img.url,
                altText: img.altText || p.name,
                isPrimary: !!img.isPrimary,
              }))
            );
          }

          if (p.listings && p.listings.length > 0) {
            setListings(p.listings);
            setPrice(String(p.listings[0].price || ""));
            setCompareAtPrice(
              p.listings[0].compareAtPrice ? String(p.listings[0].compareAtPrice) : ""
            );
            if (p.listings[0].inventory) {
              setStockQuantity(String(p.listings[0].inventory.quantity));
            }
          }

          if (Array.isArray(p.variants) && p.variants.length > 0) {
            setVariants(
              p.variants.map((v: any) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                price: price || "0",
                stock: stockQuantity || "10",
              }))
            );
          }

          if (p.seo) {
            setMetaTitle(p.seo.metaTitle || "");
            setMetaDescription(p.seo.metaDescription || "");
            setMetaKeywords(p.seo.metaKeywords || "");
            setCanonicalUrl(p.seo.canonicalUrl || "");
          }

          if (Array.isArray(p.productRevisions)) {
            setRevisions(p.productRevisions);
          }

          if (Array.isArray(p.auditLogs)) {
            setAuditLogs(p.auditLogs);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load product details:", err);
        setErrorMsg("Failed to load product details.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Image Upload handler
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
      if (!res.ok) throw new Error(data.message || "Failed to upload image.");

      setImages((prev) => [
        ...prev,
        {
          url: data.data.url,
          altText: name || "Product Image",
          isPrimary: prev.length === 0,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Error uploading product image.");
    } finally {
      setUploadingImage(false);
    }
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

  // Generate Variants matrix from option values
  const handleGenerateVariants = () => {
    const values = variantValuesInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) return;

    const baseSku = sku.trim() || slug.trim() || "SKU";
    const generated: VariantItem[] = values.map((val) => ({
      name: `${variantOptionName}: ${val}`,
      sku: `${baseSku}-${val.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
      price: price || "0",
      stock: stockQuantity || "50",
    }));

    setVariants(generated);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick listing status moderation (Approve / Suspend)
  const handleUpdateListingStatus = async (listingId: string, newStatus: string) => {
    setUpdatingListingId(listingId);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update listing status");

      setListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
      );
      setSuccessMsg(`Seller listing marked as ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update seller offer.");
    } finally {
      setUpdatingListingId(null);
    }
  };

  // Save handler (can either stay on page or navigate to index)
  const handleSave = async (stayOnPage = false) => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    let shortDescription = shortDesc;
    if (shortDescEditorRef.current) {
      try {
        shortDescription = await shortDescEditorRef.current.getContent();
      } catch (err) {
        console.error("Error reading short description:", err);
      }
    }

    let description = longDesc;
    if (longDescEditorRef.current) {
      try {
        description = await longDescEditorRef.current.getContent();
      } catch (err) {
        console.error("Error reading description:", err);
      }
    }

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        shortDescription: shortDescription.trim() || null,
        description: description.trim() || null,
        brandId: selectedBrandId || null,
        categoryIds: selectedCategoryIds,
        ownershipType,
        ownerSellerId: ownershipType === "SELLER_EXCLUSIVE" ? ownerSellerId || null : null,
        productType,
        status,
        visibility,
        modelNumber: modelNumber.trim() || null,
        manufacturer: manufacturer.trim() || null,
        countryOfOrigin: countryOfOrigin.trim() || null,
        weight: weight ? Number(weight) : null,
        length: length ? Number(length) : null,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        images,
        seo: {
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          metaKeywords: metaKeywords.trim() || null,
          canonicalUrl: canonicalUrl.trim() || null,
        },
        variants: variants.map((v) => ({
          name: v.name,
          sku: v.sku,
        })),
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update product.");
      }

      setSuccessMsg("Product catalogue record updated successfully.");

      // Refresh product revisions and audit logs
      fetch(`/api/admin/products/${id}`)
        .then((r) => r.json())
        .then((fresh) => {
          if (fresh.data?.productRevisions) setRevisions(fresh.data.productRevisions);
          if (fresh.data?.auditLogs) setAuditLogs(fresh.data.auditLogs);
        })
        .catch(console.error);

      if (!stayOnPage) {
        setTimeout(() => router.push("/admin/catalogue/products"), 1200);
      } else {
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete product.");
      }
      router.push("/admin/catalogue/products");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete product.");
      setDeleteModalOpen(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-sunflower-100/30 border-t-sunflower-100 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-white-chalk-100/50">Loading Magento-Style Product Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Header with Magento-style quick action bar */}
      <div className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-white-chalk-100/10 -mx-6 -mt-6 px-6 py-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/catalogue/products"
              className="p-2 rounded-xl text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-matt-black-200 transition cursor-pointer"
              title="Back to products"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sora text-base font-bold text-white-chalk-100 truncate max-w-md">
                  {name || "Untitled Product"}
                </h1>
                <AdminBadge status={status} />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white-chalk-100/10 text-white-chalk-100/70 border border-white-chalk-100/10">
                  {ownershipType}
                </span>
              </div>
              <p className="text-[11px] text-white-chalk-100/40 font-mono">
                SKU: {sku || "UNASSIGNED"} • ID: {id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-cadmium-red-200 hover:bg-cadmium-red-100/15 border border-cadmium-red-100/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete / Archive
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 border border-white-chalk-100/10 transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save & Continue"}
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-sunflower-100/20 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-pablano-100/15 border border-pablano-100/30 text-pablano-200 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cadmium-red-100/15 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = "";
        }}
      />

      {/* Magento 2 Style Studio: Left Sidebar Vertical Tabs + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-2.5 shadow-xl space-y-1 sticky top-24">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/40 border-b border-white-chalk-100/10 mb-1">
              Product Studio Tabs
            </div>

            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? "bg-sunflower-100 text-matt-black-100 font-bold shadow-md shadow-sunflower-100/10"
                      : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === "images" && images.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-white-chalk-100/10 text-white-chalk-100/60"
                      }`}
                    >
                      {images.length}
                    </span>
                  )}
                  {tab.id === "marketplace" && listings.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-sunflower-100/20 text-sunflower-100"
                      }`}
                    >
                      {listings.length}
                    </span>
                  )}
                  {tab.id === "history" && revisions.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-munsell-blue-100/20 text-munsell-blue-100"
                      }`}
                    >
                      v{revisions[0]?.revisionNumber || 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tab Panels */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                  <Package className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Product Identification & Attributes
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Product Name / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. SONY-WH1000XM5-BLK"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      URL Key / Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. sony-wh-1000xm5-wireless-headphones"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Brand / Manufacturer
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="">No Brand (Generic / Platform)</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Categories ({selectedCategoryIds.length} Selected)
                    </label>
                    <div className="max-h-36 overflow-y-auto bg-matt-black-200/40 border border-white-chalk-100/10 rounded-xl p-2.5 space-y-1">
                      {categories.length === 0 ? (
                        <p className="text-[11px] text-white-chalk-100/40 p-1">No categories configured.</p>
                      ) : (
                        categories.map((c) => (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 p-1 rounded hover:bg-white-chalk-100/5 text-xs text-white-chalk-100 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(c.id)}
                              onChange={() => toggleCategory(c.id)}
                              className="rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer"
                            />
                            <span>{c.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Governance Card */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                  <Sliders className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Product Governance & Visibility
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Catalog Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE (Published)</option>
                      <option value="DRAFT">DRAFT (Under Review)</option>
                      <option value="INACTIVE">INACTIVE (Hidden)</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Storefront Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="VISIBLE">Catalog, Search</option>
                      <option value="CATALOG_ONLY">Catalog Only</option>
                      <option value="SEARCH_ONLY">Search Only</option>
                      <option value="HIDDEN">Not Visible Individually</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Product Type
                    </label>
                    <select
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="SIMPLE">Simple Product</option>
                      <option value="CONFIGURABLE">Configurable Product</option>
                      <option value="BUNDLE">Bundle Product</option>
                      <option value="VIRTUAL">Virtual Product</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Identification & Logistics Card */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                  <Ruler className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Identification & Package Dimensions
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Model Number (MPN)
                    </label>
                    <input
                      type="text"
                      value={modelNumber}
                      onChange={(e) => setModelNumber(e.target.value)}
                      placeholder="e.g. WH1000XM5/B"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
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
                      placeholder="e.g. Sony Corporation"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
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
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.25"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Length (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="22.0"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Width (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="18.5"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="7.5"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT (BLOCKNOTE BLACK EDITORS) */}
          {activeTab === "content" && (
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Content & Rich Storytelling (BlockNote Black)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-sunflower-100/80 bg-sunflower-100/10 px-2.5 py-0.5 rounded border border-sunflower-100/20">
                  BlockNote Dark Mode Active
                </span>
              </div>

              {/* Short Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                    Short Description / Bullet Points
                  </label>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Featured beside the image gallery on product pages
                  </span>
                </div>
                <BlockNoteEditor
                  ref={shortDescEditorRef}
                  initialContent={shortDesc}
                  placeholder="Summarize key features, warranty, and package contents..."
                  theme="dark"
                  minHeight="140px"
                  onChange={(html) => setShortDesc(html)}
                />
              </div>

              {/* Detailed Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                    Full Description & Specifications
                  </label>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Detailed breakdown, technical specs, customer guide
                  </span>
                </div>
                <BlockNoteEditor
                  ref={longDescEditorRef}
                  initialContent={longDesc}
                  placeholder="Provide comprehensive details, technical specs, user manuals..."
                  theme="dark"
                  minHeight="240px"
                  onChange={(html) => setLongDesc(html)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: IMAGES & MEDIA */}
          {activeTab === "images" && (
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Product Images & Media Gallery ({images.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadingImage ? "Uploading..." : "Upload New Image"}
                </button>
              </div>

              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-sunflower-100/50 bg-matt-black-200/30 p-10 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sunflower-100/10 border border-sunflower-100/20 flex items-center justify-center text-sunflower-100 group-hover:scale-105 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white-chalk-100 group-hover:text-sunflower-100 transition">
                    Drag & Drop or Click to Upload Images
                  </p>
                  <p className="text-[10px] text-white-chalk-100/40">
                    PNG, JPG, WEBP formats up to 15MB • Minimum 800×800 recommended
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`group relative rounded-xl border p-1 bg-matt-black-200/60 overflow-hidden ${
                        img.isPrimary
                          ? "border-sunflower-100 shadow-md shadow-sunflower-100/10"
                          : "border-white-chalk-100/15 hover:border-white-chalk-100/30"
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-matt-black-300 flex items-center justify-center relative">
                        <img
                          src={img.url}
                          alt={img.altText}
                          className="w-full h-full object-cover"
                        />

                        {img.isPrimary && (
                          <span className="absolute top-1.5 left-1.5 bg-sunflower-100 text-matt-black-100 text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                            Base / Primary
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(idx)}
                              className="p-1.5 rounded-lg bg-sunflower-100 text-matt-black-100 text-[10px] font-bold hover:bg-sunflower-200 cursor-pointer"
                              title="Set as Base Image"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 rounded-lg bg-cadmium-red-100 text-white-chalk-100 text-[10px] font-bold hover:bg-cadmium-red-200 cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="p-1">
                        <input
                          type="text"
                          value={img.altText}
                          onChange={(e) => {
                            const newAlt = e.target.value;
                            setImages((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, altText: newAlt } : item))
                            );
                          }}
                          placeholder="Alt tag..."
                          className="w-full bg-transparent text-[10px] text-white-chalk-100/70 border-b border-white-chalk-100/10 focus:border-sunflower-100/50 outline-none px-1 py-0.5"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRICING & INVENTORY */}
          {activeTab === "pricing" && (
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <DollarSign className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Pricing, Cost & Warehouse Inventory
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Catalog Base Price (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 8499"
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    MSRP / Compare-At Price (Rs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="e.g. 9999"
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Cost Price (Internal Margin)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="e.g. 6200"
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Stock Availability Status
                  </label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="BACKORDER">Backorder Permitted</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-sunflower-100/10 border border-sunflower-100/20 text-xs text-white-chalk-100/80">
                <p className="font-semibold text-sunflower-100 mb-1">Marketplace Dynamic Pricing</p>
                In a multi-seller catalog, individual approved vendors can submit offers on this master SKU. The storefront will automatically display the Buy Box or lowest active offer from verified merchants.
              </div>
            </div>
          )}

          {/* TAB 5: CONFIGURATIONS / VARIANTS */}
          {activeTab === "configurations" && (
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Configurations & Variant Matrix ({variants.length} child SKUs)
                  </h3>
                </div>
                {productType !== "CONFIGURABLE" && (
                  <span className="text-[11px] text-sunflower-100 bg-sunflower-100/10 px-2 py-0.5 rounded border border-sunflower-100/20">
                    Switch Product Type to &quot;Configurable&quot; to activate storefront variant swatches
                  </span>
                )}
              </div>

              {/* Generator Box */}
              <div className="p-4 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/10 space-y-3">
                <p className="text-xs font-bold text-white-chalk-100">Generate Variant Matrix</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-white-chalk-100/60 mb-1">
                      Option Attribute
                    </label>
                    <input
                      type="text"
                      value={variantOptionName}
                      onChange={(e) => setVariantOptionName(e.target.value)}
                      placeholder="e.g. Size, Color, Storage"
                      className="w-full bg-matt-black-200/80 border border-white-chalk-100/10 rounded-lg px-3 py-2 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-white-chalk-100/60 mb-1">
                      Values (Comma separated)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={variantValuesInput}
                        onChange={(e) => setVariantValuesInput(e.target.value)}
                        placeholder="e.g. 64GB, 128GB, 256GB"
                        className="w-full bg-matt-black-200/80 border border-white-chalk-100/10 rounded-lg px-3 py-2 text-xs text-white-chalk-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateVariants}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition shrink-0 cursor-pointer"
                      >
                        Generate Matrix
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants Table */}
              {variants.length === 0 ? (
                <div className="text-center py-8 text-white-chalk-100/40 text-xs">
                  No variants generated. Use the generator above or keep as a Simple standalone product.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white-chalk-100/10 text-white-chalk-100/40 uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-3">Variant Name</th>
                        <th className="py-2 px-3">Child SKU</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white-chalk-100/5">
                      {variants.map((v, idx) => (
                        <tr key={idx} className="hover:bg-white-chalk-100/5">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                                );
                              }}
                              className="bg-transparent text-white-chalk-100 font-semibold border-b border-white-chalk-100/10 focus:border-sunflower-100/50 outline-none px-1 py-0.5"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => {
                                const val = e.target.value;
                                setVariants((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                                );
                              }}
                              className="bg-transparent font-mono text-white-chalk-100/80 border-b border-white-chalk-100/10 focus:border-sunflower-100/50 outline-none px-1 py-0.5"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              className="p-1 rounded text-cadmium-red-200 hover:bg-cadmium-red-100/15 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SEO (SEARCH ENGINE OPTIMIZATION + LIVE SERP PREVIEW) */}
          {activeTab === "seo" && (
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <Globe className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Search Engine Optimization (SEO Metadata)
                </h3>
              </div>

              {/* Live Google Search Preview Card */}
              <div className="p-4 rounded-xl bg-matt-black-300 border border-white-chalk-100/10 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-white-chalk-100/40">
                  <span className="w-4 h-4 rounded-full bg-sunflower-100/20 text-sunflower-100 flex items-center justify-center text-[10px] font-bold">
                    S
                  </span>
                  <span>storeframing.com &gt; catalogue &gt; {slug || "product-url"}</span>
                </div>
                <div className="text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer truncate">
                  {metaTitle || name || "Product Page Title - Storeframing"}
                </div>
                <div className="text-xs text-[#bdc1c6] line-clamp-2">
                  {metaDescription ||
                    shortDesc?.replace(/<[^>]*>?/gm, "").slice(0, 160) ||
                    "Discover premium quality products with verified seller guarantees, fast dispatch, and direct warranty support on Storeframing."}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                      Meta Title
                    </label>
                    <span className="text-[10px] text-white-chalk-100/40">
                      {metaTitle.length}/60 characters recommended
                    </span>
                  </div>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Buy Sony WH-1000XM5 in Pakistan - Best Price Guaranteed"
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                      Meta Description
                    </label>
                    <span className="text-[10px] text-white-chalk-100/40">
                      {metaDescription.length}/160 characters recommended
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Order genuine Sony wireless noise-cancelling headphones. Free express delivery, official warranty, and flexible payment options across Pakistan."
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      placeholder="headphones, noise cancelling, sony audio"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://storeframing.com/products/sony-wh-1000xm5"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MARKETPLACE & SELLER OFFERS */}
          {activeTab === "marketplace" && (
            <div className="space-y-6">
              {/* Scope & Ownership card */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                  <Store className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Product Ownership & Multi-Vendor Scope
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Ownership Scope
                    </label>
                    <select
                      value={ownershipType}
                      onChange={(e) => setOwnershipType(e.target.value)}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="PLATFORM">PLATFORM (Shared Multi-Vendor Master Product)</option>
                      <option value="SELLER_EXCLUSIVE">SELLER_EXCLUSIVE (Private to One Vendor)</option>
                    </select>
                    <p className="text-[10px] text-white-chalk-100/40 mt-1">
                      {ownershipType === "PLATFORM"
                        ? "Any verified merchant can list their offer and inventory against this master product."
                        : "Only the designated vendor can manage and sell this product."}
                    </p>
                  </div>

                  {ownershipType === "SELLER_EXCLUSIVE" && (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                        Designated Seller Owner *
                      </label>
                      <select
                        value={ownerSellerId}
                        onChange={(e) => setOwnerSellerId(e.target.value)}
                        className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                      >
                        <option value="">Select a vendor...</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shopName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Seller Offers Moderation Table */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-sunflower-100" />
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      Active Seller Listings & Offers ({listings.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Live offer moderation & Buy-Box controls
                  </span>
                </div>

                {listings.length === 0 ? (
                  <div className="text-center py-10 rounded-xl bg-matt-black-200/30 border border-white-chalk-100/5">
                    <Store className="w-8 h-8 text-white-chalk-100/20 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white-chalk-100/60">
                      No vendor offers attached to this product catalogue record yet.
                    </p>
                    <p className="text-[10px] text-white-chalk-100/40 mt-0.5">
                      When sellers list this master product in their stores, their pricing and inventory will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white-chalk-100/10 text-white-chalk-100/40 uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Merchant / Store</th>
                          <th className="py-2.5 px-3">Seller SKU</th>
                          <th className="py-2.5 px-3">Offer Price</th>
                          <th className="py-2.5 px-3">Stock Units</th>
                          <th className="py-2.5 px-3">Listing Status</th>
                          <th className="py-2.5 px-3 text-right">Offer Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white-chalk-100/5">
                        {listings.map((l) => (
                          <tr key={l.id} className="hover:bg-white-chalk-100/5 transition">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white-chalk-100">
                                  {l.seller?.shopName || "Unknown Seller"}
                                </span>
                                {l.seller?.id && (
                                  <Link
                                    href={`/admin/sellers/${l.seller.id}/edit`}
                                    className="text-white-chalk-100/40 hover:text-sunflower-100 transition"
                                    title="View vendor record"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-white-chalk-100/60">
                              {l.sellerSku || "—"}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-sunflower-100">
                              Rs {Number(l.price).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono text-white-chalk-100/80">
                              {l.inventory ? `${l.inventory.quantity} units` : "Unmanaged"}
                            </td>
                            <td className="py-3 px-3">
                              <AdminBadge status={l.status} />
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {l.status !== "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateListingStatus(l.id, "ACTIVE")}
                                    disabled={updatingListingId === l.id}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-pablano-100/15 hover:bg-pablano-100/25 text-pablano-200 border border-pablano-100/30 transition cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                )}
                                {l.status === "ACTIVE" && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateListingStatus(l.id, "SUSPENDED")}
                                    disabled={updatingListingId === l.id}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cadmium-red-100/15 hover:bg-cadmium-red-100/25 text-cadmium-red-200 border border-cadmium-red-100/30 transition cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: HISTORY & AUDIT TRAIL */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Product Revisions Timeline */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-sunflower-100" />
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      Product Revision Snapshots ({revisions.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Full immutable audit history of published catalog versions
                  </span>
                </div>

                {revisions.length === 0 ? (
                  <p className="text-xs text-white-chalk-100/40 py-4 text-center">
                    No revision snapshots recorded yet.
                  </p>
                ) : (
                  <div className="relative border-l border-white-chalk-100/10 ml-4 space-y-6 py-2">
                    {revisions.map((rev) => (
                      <div key={rev.id} className="relative pl-6">
                        <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-sunflower-100 border-2 border-matt-black-100 shadow" />
                        <div className="bg-matt-black-200/50 border border-white-chalk-100/10 rounded-xl p-3.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white-chalk-100">
                              Revision #{rev.revisionNumber}
                            </span>
                            <span className="text-[10px] font-mono text-white-chalk-100/40">
                              {new Date(rev.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-white-chalk-100/80">
                            {rev.summary || "Catalog update applied."}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-white-chalk-100/50 pt-1">
                            <User className="w-3 h-3" />
                            <span>
                              {rev.createdBy
                                ? `${rev.createdBy.firstName || ""} ${rev.createdBy.lastName || ""} (${rev.createdBy.email})`
                                : "Admin Staff"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security Audit Logs with Expandable Diff */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-munsell-blue-100" />
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      System Audit Logs ({auditLogs.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Granular operational change logs & payload diffs
                  </span>
                </div>

                {auditLogs.length === 0 ? (
                  <p className="text-xs text-white-chalk-100/40 py-4 text-center">
                    No operational audit logs recorded for this product yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      return (
                        <div
                          key={log.id}
                          className="bg-matt-black-200/40 border border-white-chalk-100/10 rounded-xl p-3 text-xs space-y-2"
                        >
                          <div
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="flex items-center justify-between cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-sunflower-100" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-white-chalk-100/40" />
                              )}
                              <span className="font-bold font-mono text-sunflower-100">
                                {log.action}
                              </span>
                              <span className="text-white-chalk-100/60 font-mono text-[11px]">
                                {log.entityType}
                              </span>
                              <span className="text-[10px] text-white-chalk-100/40">
                                by {log.user?.email || "System"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-white-chalk-100/40">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white-chalk-100/10">
                              <div className="bg-matt-black-300 rounded-lg p-2.5 space-y-1">
                                <span className="text-[10px] font-bold text-cadmium-red-200 uppercase tracking-wider">
                                  Previous State (Old Data)
                                </span>
                                <pre className="text-[10px] font-mono text-white-chalk-100/70 overflow-x-auto max-h-40">
                                  {JSON.stringify(log.oldData, null, 2) || "None"}
                                </pre>
                              </div>
                              <div className="bg-matt-black-300 rounded-lg p-2.5 space-y-1">
                                <span className="text-[10px] font-bold text-pablano-200 uppercase tracking-wider">
                                  Applied State (New Data)
                                </span>
                                <pre className="text-[10px] font-mono text-white-chalk-100/70 overflow-x-auto max-h-40">
                                  {JSON.stringify(log.newData, null, 2) || "None"}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <AdminModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete / Archive Product"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-white-chalk-100/70">
              Are you sure you want to delete <strong className="text-white-chalk-100">{name}</strong>?
            </p>
            <p className="text-[11px] text-white-chalk-100/40">
              If this product is associated with existing customer orders or vendor offers, it will be safely archived (marked as ARCHIVED) rather than permanently purged to maintain transactional integrity.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white-chalk-100/10">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition disabled:opacity-40 cursor-pointer shadow-lg"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
