"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Tag,
  Save,
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Globe,
  CheckCircle,
  AlertCircle,
  Boxes,
  ExternalLink,
  Star,
  Search,
  Package,
} from "lucide-react";
import { AdminBadge } from "@/components/admin/AdminUI";
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

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  images?: Array<{ url: string }>;
  brand?: { id: string; name: string } | null;
  ownerSeller?: { shopName: string } | null;
}

const TABS = [
  { id: "general", label: "General Information", icon: Tag },
  { id: "media", label: "Brand Media & Assets", icon: ImageIcon },
  { id: "seo", label: "Search Engine Optimization", icon: Globe },
  { id: "products", label: "Product Tagging", icon: Boxes },
];

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"general" | "media" | "seo" | "products">("general");

  // Loading existing brand data
  const [loadingBrand, setLoadingBrand] = useState(true);

  // Form states - General
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [rawDescription, setRawDescription] = useState("");

  // Media
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [robots, setRobots] = useState("INDEX_FOLLOW");
  const [uploadingOg, setUploadingOg] = useState(false);
  const ogInputRef = useRef<HTMLInputElement>(null);

  // Product Tagging
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Submit & Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const editorRef = useRef<BlockNoteEditorRef>(null);

  // 1. Fetch Brand Data
  useEffect(() => {
    if (!brandId) return;
    setLoadingBrand(true);

    fetch(`/api/admin/brands/${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.data) {
          throw new Error(data.message || "Brand not found");
        }
        const b = data.data;
        setName(b.name || "");
        setSlug(b.slug || "");
        setWebsiteUrl(b.websiteUrl || "");
        setSortOrder(b.sortOrder || 0);
        setIsActive(b.isActive !== false);
        setIsFeatured(Boolean(b.isFeatured));
        setLogoUrl(b.logoUrl || "");
        setBannerUrl(b.bannerUrl || "");
        setRawDescription(b.description || "");

        if (b.description && editorRef.current) {
          editorRef.current.setContent(b.description);
        }

        // Prepopulate SEO
        if (b.seo) {
          setMetaTitle(b.seo.metaTitle || "");
          setMetaDescription(b.seo.metaDescription || "");
          setMetaKeywords(b.seo.metaKeywords || "");
          setCanonicalUrl(b.seo.canonicalUrl || "");
          setOgTitle(b.seo.ogTitle || "");
          setOgDescription(b.seo.ogDescription || "");
          setOgImageUrl(b.seo.ogImageUrl || "");
          setRobots(b.seo.robots || "INDEX_FOLLOW");
        }

        // Prepopulate tagged products
        if (Array.isArray(b.products)) {
          setSelectedProductIds(b.products.map((p: any) => p.id));
        }
      })
      .catch((err) => {
        console.error("Error loading brand:", err);
        setErrorMsg(err.message || "Failed to load brand details.");
      })
      .finally(() => {
        setLoadingBrand(false);
      });
  }, [brandId]);

  // Sync description into BlockNote when editor is ready
  useEffect(() => {
    if (rawDescription && editorRef.current) {
      editorRef.current.setContent(rawDescription);
    }
  }, [rawDescription]);

  // 2. Fetch Catalogue Products for Tagging
  useEffect(() => {
    setLoadingProducts(true);
    fetch("/api/admin/products?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const list = data.data?.products || data.data?.items || data.data || [];
        if (Array.isArray(list)) {
          setAvailableProducts(list);
        }
      })
      .catch((err) => console.error("Error loading products for tagging:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Upload Handlers
  const handleFileUpload = async (file: File, target: "logo" | "banner" | "og") => {
    if (target === "logo") setUploadingLogo(true);
    else if (target === "banner") setUploadingBanner(true);
    else setUploadingOg(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "brands");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to upload asset");
      }

      if (target === "logo") {
        setLogoUrl(data.data.url);
      } else if (target === "banner") {
        setBannerUrl(data.data.url);
      } else {
        setOgImageUrl(data.data.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload file");
    } finally {
      if (target === "logo") setUploadingLogo(false);
      else if (target === "banner") setUploadingBanner(false);
      else setUploadingOg(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = availableProducts.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.ownerSeller?.shopName && p.ownerSeller.shopName.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Brand name is required.");
      setActiveTab("general");
      return;
    }

    if (!slug.trim()) {
      setErrorMsg("Brand slug is required.");
      setActiveTab("general");
      return;
    }

    setIsSubmitting(true);

    try {
      let description = rawDescription;
      if (editorRef.current) {
        description = await editorRef.current.getContent();
      }

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
        websiteUrl: websiteUrl ? websiteUrl.trim() : null,
        isFeatured,
        sortOrder: Number(sortOrder) || 0,
        isActive,
        seo: {
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          metaKeywords: metaKeywords.trim() || null,
          canonicalUrl: canonicalUrl.trim() || null,
          ogTitle: ogTitle.trim() || null,
          ogDescription: ogDescription.trim() || null,
          ogImageUrl: ogImageUrl.trim() || null,
          robots: robots || null,
        },
        productIds: selectedProductIds,
      };

      const res = await fetch(`/api/admin/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to update brand");
      }

      setSuccessMsg("Brand updated successfully!");
      setTimeout(() => {
        router.push("/admin/catalogue/brands");
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingBrand) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-2 border-sunflower-100 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white-chalk-100/50">Loading brand profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Hidden file inputs for uploads */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "logo");
        }}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "banner");
        }}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={ogInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "og");
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white-chalk-100/10 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/catalogue/brands"
            className="p-2 rounded-xl bg-matt-black-200/80 border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/70 hover:text-sunflower-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sora text-xl font-bold text-white-chalk-100">
                Edit &ldquo;{name || "Brand"}&rdquo;
              </h1>
              {isFeatured && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sunflower-100/20 text-sunflower-100 border border-sunflower-100/30 font-bold">
                  <Star className="w-3 h-3 fill-sunflower-100" />
                  Featured
                </span>
              )}
              <AdminBadge status={isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <p className="text-xs text-white-chalk-100/50 mt-0.5">
              Edit brand metadata, landing page hero banner, SEO configurations, and product tagging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white-chalk-100/5 text-white-chalk-100/70 hover:text-munsell-blue-100 hover:bg-white-chalk-100/10 transition flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Official Site</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          <Link
            href="/admin/catalogue/brands"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white-chalk-100/5 text-white-chalk-100/70 hover:bg-white-chalk-100/10 transition cursor-pointer"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition flex items-center gap-2 cursor-pointer shadow-md shadow-sunflower-100/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-cadmium-red-100/10 border border-cadmium-red-100/20 flex items-center gap-3 text-xs text-cadmium-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex items-center gap-1.5 border-b border-white-chalk-100/10 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                isActiveTab
                  ? "bg-sunflower-100 text-matt-black-100 shadow"
                  : "text-white-chalk-100/60 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === "products" && selectedProductIds.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActiveTab
                      ? "bg-matt-black-100 text-sunflower-100"
                      : "bg-sunflower-100/20 text-sunflower-100"
                  }`}
                >
                  {selectedProductIds.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}
      <div>
        {/* TAB 1: GENERAL INFORMATION */}
        {activeTab === "general" && (
          <div className="space-y-6 mt-6">
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <Tag className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Basic Brand Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nike, Apple, Samsung"
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    URL Slug *
                  </label>
                  <div className="flex items-center bg-matt-black-200/50 border border-white-chalk-100/10 rounded-xl px-3 text-xs text-white-chalk-100/50">
                    <span className="font-mono text-[11px] text-white-chalk-100/40">/brand/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="nike"
                      className="w-full bg-transparent px-2 py-2.5 text-xs text-white-chalk-100 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Official Website URL
                  </label>
                  <div className="flex items-center bg-matt-black-200/50 border border-white-chalk-100/10 rounded-xl px-3 text-xs text-white-chalk-100/50">
                    <Globe className="w-3.5 h-3.5 mr-2 text-white-chalk-100/40" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://www.nike.com"
                      className="w-full bg-transparent py-2.5 text-xs text-white-chalk-100 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Display Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                  <p className="text-[10px] text-white-chalk-100/40 mt-1">
                    Lower numbers appear first in lists and brand directories (0 is highest priority).
                  </p>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white-chalk-100/10">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/5">
                  <div>
                    <p className="text-xs font-semibold text-white-chalk-100">
                      Brand Active Status
                    </p>
                    <p className="text-[10px] text-white-chalk-100/40">
                      Active brands are visible to customers and selectable by sellers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isActive ? "bg-emerald-500" : "bg-matt-black-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white-chalk-100">
                        Featured Brand
                      </p>
                      <Star className="w-3.5 h-3.5 text-sunflower-100 fill-sunflower-100" />
                    </div>
                    <p className="text-[10px] text-white-chalk-100/40">
                      Spotlight brand on homepage carousel and top of brand directory.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFeatured(!isFeatured)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isFeatured ? "bg-sunflower-100" : "bg-matt-black-300"
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-matt-black-100 transition-transform ${
                        isFeatured ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* BlockNote Editor */}
              <div className="space-y-2 pt-2 border-t border-white-chalk-100/10">
                <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                  Brand Story &amp; Description
                </label>
                <p className="text-[10px] text-white-chalk-100/40 mb-2">
                  Rich editorial content shown on the brand’s dedicated storefront landing page.
                </p>
                <div className="border border-white-chalk-100/10 rounded-xl overflow-hidden focus-within:border-sunflower-100/50 bg-[#0d1117]">
                  <BlockNoteEditor
                    ref={editorRef}
                    initialContent={rawDescription}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRAND MEDIA & ASSETS */}
        {activeTab === "media" && (
          <div className="space-y-6 mt-6">
            {/* Brand Logo */}
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-sunflower-100" />
                  <div>
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      Official Brand Logo (Square 1:1)
                    </h3>
                    <p className="text-[10px] text-white-chalk-100/40">
                      Appears on product badges, store filters, and brand directory grid (Recommended 400×400 px, PNG or SVG transparent)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                </button>
              </div>

              <div className="flex items-center gap-5">
                {logoUrl ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white-chalk-100/20 bg-matt-black-300 group flex-shrink-0">
                    <img
                      src={logoUrl}
                      alt={`${name} Logo`}
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="p-1.5 rounded bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 cursor-pointer"
                        title="Change logo"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="p-1.5 rounded bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 cursor-pointer"
                        title="Remove logo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className="w-28 h-28 rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-sunflower-100/50 bg-matt-black-200/30 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition group flex-shrink-0"
                  >
                    <ImageIcon className="w-6 h-6 text-white-chalk-100/30 group-hover:text-sunflower-100 transition" />
                    <span className="text-[10px] text-white-chalk-100/40">1:1 Square</span>
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-white-chalk-100/60">
                  <p className="font-semibold text-white-chalk-100">Logo Guidelines</p>
                  <ul className="text-[11px] text-white-chalk-100/40 list-disc list-inside space-y-0.5">
                    <li>Recommended size: 400 × 400 px (Square 1:1)</li>
                    <li>Supported formats: PNG, WEBP, SVG, JPG</li>
                    <li>Transparent PNG/SVG works best for dark/light surfaces</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Brand Hero Banner */}
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sunflower-100" />
                  <div>
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      Brand Landing Page Hero Banner
                    </h3>
                    <p className="text-[10px] text-white-chalk-100/40">
                      Wide panoramic banner rendered at the top of the official brand landing page (Recommended 1920×600 px)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadingBanner ? "Uploading..." : "Upload Banner"}
                </button>
              </div>

              {bannerUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white-chalk-100/15 group aspect-[21/7] bg-matt-black-300">
                  <img
                    src={bannerUrl}
                    alt={`${name} Banner`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-sunflower-100 text-matt-black-100 text-xs font-bold hover:bg-sunflower-200 cursor-pointer"
                    >
                      Change Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerUrl("")}
                      className="px-3 py-1.5 rounded-lg bg-cadmium-red-100 text-white-chalk-100 text-xs font-bold hover:bg-cadmium-red-200 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-sunflower-100/50 bg-matt-black-200/30 p-8 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sunflower-100/10 border border-sunflower-100/20 flex items-center justify-center text-sunflower-100 group-hover:scale-105 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white-chalk-100 group-hover:text-sunflower-100 transition">
                    Upload Brand Hero Banner
                  </p>
                  <p className="text-[10px] text-white-chalk-100/40">
                    PNG, JPG, WEBP formats up to 15MB • 1920×600 px recommended aspect ratio
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SEO */}
        {activeTab === "seo" && (
          <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
              <Globe className="w-4 h-4 text-sunflower-100" />
              <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                Search Engine Optimization &amp; Social Sharing
              </h3>
            </div>

            {/* Google SERP Live Snippet */}
            <div className="p-4 rounded-xl bg-matt-black-300 border border-white-chalk-100/10 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-white-chalk-100/40">
                <span className="w-4 h-4 rounded-full bg-sunflower-100/20 text-sunflower-100 flex items-center justify-center text-[10px] font-bold">
                  S
                </span>
                <span>storeframing.com &gt; brand &gt; {slug || "brand-slug"}</span>
              </div>
              <div className="text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer truncate">
                {metaTitle || `${name || "Brand"} - Official Products &amp; Store in Pakistan`}
              </div>
              <div className="text-xs text-[#bdc1c6] line-clamp-2">
                {metaDescription ||
                  `Shop 100% genuine ${name || "brand"} products on Storeframing. Best prices, authorized sellers, warranty & fast delivery across Pakistan.`}
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
                  placeholder={`Buy Genuine ${name || "Brand"} Products in Pakistan - Storeframing`}
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
                  placeholder={`Explore authentic ${name || "brand"} collections online at Storeframing. Compare verified seller listings, enjoy fast shipping and buyer protection.`}
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
                    placeholder="nike pakistan, shoes, sneakers, original nike"
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
                    placeholder={`https://storeframing.com/brand/${slug || "brand-slug"}`}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                </div>
              </div>

              {/* Social / OpenGraph metadata */}
              <div className="pt-4 border-t border-white-chalk-100/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sunflower-100">
                  OpenGraph Social Media Cards
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Social Card Title
                    </label>
                    <input
                      type="text"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      placeholder="e.g. Official Nike Store on Storeframing"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Robots Indexing Directive
                    </label>
                    <select
                      value={robots}
                      onChange={(e) => setRobots(e.target.value)}
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    >
                      <option value="INDEX_FOLLOW" className="bg-[#161b22]">Index, Follow (Recommended)</option>
                      <option value="NOINDEX_FOLLOW" className="bg-[#161b22]">No Index, Follow</option>
                      <option value="INDEX_NOFOLLOW" className="bg-[#161b22]">Index, No Follow</option>
                      <option value="NOINDEX_NOFOLLOW" className="bg-[#161b22]">No Index, No Follow</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Social Card Description
                  </label>
                  <input
                    type="text"
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder="Short social share snippet..."
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>

                {/* OG Image Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                      OpenGraph Share Image (1200×630 px)
                    </label>
                    <button
                      type="button"
                      onClick={() => ogInputRef.current?.click()}
                      disabled={uploadingOg}
                      className="text-[11px] font-bold text-sunflower-100 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <UploadCloud className="w-3 h-3" />
                      {uploadingOg ? "Uploading..." : "Upload Social Image"}
                    </button>
                  </div>

                  {ogImageUrl ? (
                    <div className="relative w-48 h-24 rounded-xl overflow-hidden border border-white-chalk-100/20 bg-matt-black-300 group">
                      <img src={ogImageUrl} alt="OG Card" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setOgImageUrl("")}
                          className="p-1 rounded bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => ogInputRef.current?.click()}
                      className="w-full py-4 rounded-xl border border-dashed border-white-chalk-100/10 hover:border-sunflower-100/30 text-center text-[11px] text-white-chalk-100/40 cursor-pointer transition"
                    >
                      Click to upload Facebook/Twitter social card image (1200×630 px)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRODUCT TAGGING */}
        {activeTab === "products" && (
          <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Tag Products to Brand ({selectedProductIds.length} Selected)
                </h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white-chalk-100/40" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to tag..."
                  className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white-chalk-100 outline-none focus:border-sunflower-100/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-white-chalk-100/60 py-1">
              <p>
                Select products from your catalogue that belong to this brand manufacturer.
              </p>
              {selectedProductIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="text-[11px] text-cadmium-red-200 hover:underline cursor-pointer"
                >
                  Clear Selection ({selectedProductIds.length})
                </button>
              )}
            </div>

            {loadingProducts ? (
              <div className="py-12 text-center text-xs text-white-chalk-100/40">
                Loading catalogue products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 rounded-xl bg-matt-black-200/30 border border-white-chalk-100/5 text-xs text-white-chalk-100/40">
                No products found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl border border-white-chalk-100/10">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-[#161b22] border-b border-white-chalk-100/10">
                    <tr className="text-white-chalk-100/40 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 w-10">Tag</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Seller / Store</th>
                      <th className="py-2.5 px-3">Current Brand</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white-chalk-100/5">
                    {filteredProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      const hasDifferentBrand = p.brand && p.brand.name && p.brand.id !== brandId;
                      const isCurrentBrand = p.brand && p.brand.id === brandId;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => toggleProductSelection(p.id)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? "bg-sunflower-100/10 hover:bg-sunflower-100/15"
                              : "hover:bg-white-chalk-100/5"
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by row onClick
                              className="w-4 h-4 rounded border-white-chalk-100/20 text-sunflower-100 focus:ring-sunflower-100/20 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white-chalk-100">
                            <div className="flex items-center gap-2">
                              {p.images?.[0]?.url && (
                                <img
                                  src={p.images[0].url}
                                  alt={p.name}
                                  className="w-7 h-7 rounded-md object-cover border border-white-chalk-100/10"
                                />
                              )}
                              <span className="line-clamp-1">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-white-chalk-100/50">
                            {p.ownerSeller?.shopName || "Platform"}
                          </td>
                          <td className="py-2.5 px-3">
                            {isCurrentBrand ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-sunflower-100/15 text-sunflower-100 border border-sunflower-100/30 font-semibold">
                                This Brand
                              </span>
                            ) : hasDifferentBrand ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white-chalk-100/5 text-white-chalk-100/60 border border-white-chalk-100/10">
                                {p.brand?.name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-white-chalk-100/30">
                                Unbranded
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <AdminBadge status={p.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
