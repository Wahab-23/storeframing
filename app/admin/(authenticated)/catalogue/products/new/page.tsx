"use client";

import { useState, useEffect, useRef } from "react";
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
  id: string;
  name: string;
  sku: string;
}

const TABS = [
  { id: "general", label: "Basics", description: "Name, brand, type, and categories", icon: Package },
  { id: "content", label: "Description", description: "Product copy and details", icon: FileText },
  { id: "images", label: "Photos & media", description: "Images and alt text", icon: ImageIcon },
  { id: "pricing", label: "Pricing & stock", description: "Seller offer setup", icon: DollarSign },
  { id: "configurations", label: "Variants", description: "Options and variant SKUs", icon: Boxes },
  { id: "seo", label: "Search preview", description: "Search title and metadata", icon: Globe },
  { id: "marketplace", label: "Seller access", description: "Ownership and visibility", icon: Store },
];

export default function NewProductPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
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

  // Variants
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

  // Dropdown options
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/brands")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.data)) setBrands(d.data);
      })
      .catch((e) => console.error("Error loading brands:", e));

    fetch("/api/admin/categories?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const catList = d.data?.categories || d.data || [];
        if (Array.isArray(catList)) setCategories(catList);
      })
      .catch((e) => console.error("Error loading categories:", e));

    fetch("/api/admin/sellers?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const sList = d.data?.sellers || d.data || [];
        if (Array.isArray(sList)) setSellers(sList);
      })
      .catch((e) => console.error("Error loading sellers:", e));
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === val.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
      if (!sku) {
        setSku(generatedSlug.slice(0, 16).toUpperCase());
      }
      if (!metaTitle) {
        setMetaTitle(`${val} | Buy Online`);
      }
    }
  };

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

  // Generate Variants Matrix
  const handleGenerateVariants = () => {
    const values = variantValuesInput
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) return;

    const baseSku = sku || slug.toUpperCase() || "PROD";
    const generated: VariantItem[] = values.map((val) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: `${variantOptionName}: ${val}`,
      sku: `${baseSku}-${val.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
    }));

    setVariants(generated);
  };

  const handleSubmit = async (e?: React.FormEvent, stayOnPage = false) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setActiveTab("general");
      setErrorMsg("Add a product name before saving.");
      return;
    }
    if (ownershipType === "SELLER_EXCLUSIVE" && !ownerSellerId) {
      setActiveTab("marketplace");
      setErrorMsg("Choose the seller who owns this exclusive product before saving.");
      return;
    }
    setSaving(true);
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
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          shortDescription: shortDescription.trim() || undefined,
          description: description.trim() || undefined,
          brandId: selectedBrandId || undefined,
          categoryIds: selectedCategoryIds,
          ownershipType,
          ownerSellerId: ownershipType === "SELLER_EXCLUSIVE" ? ownerSellerId || undefined : undefined,
          productType,
          status,
          visibility,
          modelNumber: modelNumber.trim() || undefined,
          manufacturer: manufacturer.trim() || undefined,
          countryOfOrigin: countryOfOrigin.trim() || undefined,
          weight: weight ? Number(weight) : undefined,
          length: length ? Number(length) : undefined,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          images,
          seo: {
            metaTitle: metaTitle.trim() || undefined,
            metaDescription: metaDescription.trim() || undefined,
            metaKeywords: metaKeywords.trim() || undefined,
            canonicalUrl: canonicalUrl.trim() || undefined,
          },
          variants: productType === "CONFIGURABLE" ? variants : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create product");
      }

      if (stayOnPage && data.data?.id) {
        router.push(`/admin/catalogue/products/${data.data.id}/edit`);
      } else {
        router.push("/admin/catalogue/products");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Magento-style Action Header */}
      <div className="sticky top-0 z-30 -mx-6 px-6 py-3.5 bg-matt-black-100/90 backdrop-blur-md border-b border-white-chalk-100/10 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/catalogue/products"
            className="p-2 rounded-xl text-white-chalk-100/60 hover:text-white-chalk-100 hover:bg-matt-black-200 transition cursor-pointer"
            title="Back to Products"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sora text-sm font-bold text-white-chalk-100">
                {name || "New Master Product"}
              </h1>
              <AdminBadge variant={status === "ACTIVE" ? "success" : "neutral"}>
                {status}
              </AdminBadge>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20 font-bold">
                {productType}
              </span>
            </div>
            <p className="text-[11px] text-white-chalk-100/40">
              {ownershipType === "PLATFORM" ? "Platform Shared Catalogue" : "Seller Exclusive"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/catalogue/products"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(undefined, true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-matt-black-200 hover:bg-matt-black-300 text-white-chalk-100 border border-white-chalk-100/15 transition cursor-pointer disabled:opacity-40"
          >
            Save & Continue Edit
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-sunflower-100/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Product..." : "Save Product"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cadmium-red-100/15 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden File Input */}
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

      {/* Main Studio Grid: Left Tabs Sidebar + Right Active Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Vertical Tabs (Sticky) */}
        <nav aria-label="Product sections" className="lg:col-span-1 bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-2.5 space-y-1 lg:sticky lg:top-20 shadow-xl shadow-black/20">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/40">
            Product Settings Studio
          </div>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "step" : undefined}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition cursor-pointer ${
                  isActive
                    ? "bg-sunflower-100/15 text-sunflower-100 border border-sunflower-100/30"
                    : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sunflower-100" : "text-white-chalk-100/40"}`} />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{tab.label}</span>
                  <span className={`block mt-0.5 text-[10px] font-normal ${isActive ? "text-sunflower-100/70" : "text-white-chalk-100/40"}`}>
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Active Panel Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <Package className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  General Product Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    SKU prefix for variants (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SONY-WH1000XM5"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                  <p className="mt-1 text-[10px] text-white-chalk-100/40">
                    Used to suggest SKUs when you generate variants. The prefix itself is not stored as a product SKU.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    URL Key / Slug *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="sony-wh-1000xm5-wireless-headphones"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Brand
                  </label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                  >
                    <option value="">No Brand (Generic / Unbranded)</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Product Type
                  </label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                  >
                    <option value="SIMPLE">SIMPLE (Single Item)</option>
                    <option value="CONFIGURABLE">CONFIGURABLE (Variants: Color/Size)</option>
                    <option value="BUNDLE">BUNDLE (Package)</option>
                    <option value="VIRTUAL">VIRTUAL (Service / Code)</option>
                  </select>
                </div>

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
                    <option value="DRAFT">DRAFT (Drafting)</option>
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
                    <option value="VISIBLE">Catalog & Search</option>
                    <option value="CATALOG_ONLY">Catalog Only</option>
                    <option value="SEARCH_ONLY">Search Only</option>
                    <option value="HIDDEN">Not Visible Individually</option>
                  </select>
                </div>
              </div>

              {/* Categories Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                  Taxonomy Categories ({selectedCategoryIds.length} assigned)
                </label>
                <div className="max-h-36 overflow-y-auto bg-matt-black-200/40 border border-white-chalk-100/10 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {categories.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white-chalk-100/5 text-xs text-white-chalk-100 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(c.id)}
                        onChange={() => toggleCategory(c.id)}
                        className="rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Logistics & Dimensions */}
              <div className="pt-4 border-t border-white-chalk-100/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100/70 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-sunflower-100" />
                  Manufacturing & Shipping Dimensions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Model Number (MPN)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WH-1000XM5"
                      value={modelNumber}
                      onChange={(e) => setModelNumber(e.target.value)}
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sony Corporation"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Country of Origin
                    </label>
                    <input
                      type="text"
                      placeholder="Pakistan"
                      value={countryOfOrigin}
                      onChange={(e) => setCountryOfOrigin(e.target.value)}
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.25"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
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
                      placeholder="20"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
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
                      placeholder="16"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
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
                      placeholder="8"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & DESCRIPTIONS */}
          {activeTab === "content" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-6">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Product Content (BlockNote Black Theme)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-sunflower-100/80 bg-sunflower-100/10 px-2 py-0.5 rounded border border-sunflower-100/20 font-bold">
                  BlockNote Dark Mode
                </span>
              </div>

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
                  initialContent={shortDesc}
                  placeholder="Key features, bullet specs, primary highlights..."
                  theme="dark"
                  minHeight="140px"
                  onChange={(html) => setShortDesc(html)}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
                    Detailed Product Description (Full Overview)
                  </label>
                  <span className="text-[10px] text-white-chalk-100/40">
                    Complete product storytelling, detailed technical specifications, warranty
                  </span>
                </div>
                <BlockNoteEditor
                  ref={longDescEditorRef}
                  initialContent={longDesc}
                  placeholder="Full documentation, user guides, detailed specs..."
                  theme="dark"
                  minHeight="240px"
                  onChange={(html) => setLongDesc(html)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: IMAGES & MEDIA */}
          {activeTab === "images" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-munsell-blue-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Images and Media Gallery
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sunflower-100/20"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {uploadingImage ? "Uploading..." : "Upload New Image"}
                </button>
              </div>

              {images.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-sunflower-100/50 bg-matt-black-200/30 p-10 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sunflower-100/10 border border-sunflower-100/20 flex items-center justify-center text-sunflower-100 group-hover:scale-105 transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-white-chalk-100 group-hover:text-sunflower-100 transition">
                    Drag and drop images here or browse files
                  </p>
                  <p className="text-[10px] text-white-chalk-100/40">
                    Recommended 800×800 or 1000×1000 px • PNG, JPG, WEBP (Max 15MB)
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`group relative rounded-xl border p-2 bg-matt-black-200/60 overflow-hidden space-y-2 ${
                        img.isPrimary
                          ? "border-sunflower-100 shadow-md shadow-sunflower-100/15"
                          : "border-white-chalk-100/15 hover:border-white-chalk-100/30"
                      }`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-matt-black-300 relative flex items-center justify-center">
                        <img
                          src={img.url}
                          alt={img.altText}
                          className="w-full h-full object-cover"
                        />

                        {img.isPrimary && (
                          <span className="absolute top-2 left-2 bg-sunflower-100 text-matt-black-100 text-[10px] font-bold px-2 py-0.5 rounded shadow">
                            Base / Primary
                          </span>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(idx)}
                              className="p-1.5 rounded-lg bg-sunflower-100 text-matt-black-100 text-xs font-bold hover:bg-sunflower-200 cursor-pointer"
                              title="Set as Base Image"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-1.5 rounded-lg bg-cadmium-red-100 text-white-chalk-100 text-xs font-bold hover:bg-cadmium-red-200 cursor-pointer"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Alt tag / image label..."
                          value={img.altText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setImages((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, altText: val } : item))
                            );
                          }}
                          className="w-full bg-matt-black-300/80 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-lg px-2 py-1 text-[11px] text-white-chalk-100 outline-none"
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
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <DollarSign className="w-4 h-4 text-pablano-200" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Pricing and inventory
                </h3>
              </div>
              <div className="rounded-xl border border-sunflower-100/20 bg-sunflower-100/5 p-4 space-y-2">
                <p className="text-sm font-semibold text-white-chalk-100">Seller offers own the price and stock.</p>
                <p className="text-xs leading-5 text-white-chalk-100/60">
                  This screen creates the shared catalog product. Price, compare-at price, cost, and stock are not product fields and were not saved here. Add an offer for a seller after creating the catalog record.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: CONFIGURATIONS / VARIANTS */}
          {activeTab === "configurations" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Configurable Product Variations Matrix
                  </h3>
                </div>
                <span className="text-[10px] text-white-chalk-100/40">
                  {variants.length} child variants generated
                </span>
              </div>

              {productType !== "CONFIGURABLE" ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-white-chalk-100/15 rounded-xl bg-matt-black-200/20">
                  <Boxes className="w-10 h-10 text-white-chalk-100/20 mx-auto" />
                  <p className="text-xs font-semibold text-white-chalk-100">
                    Product type is currently set to &quot;{productType}&quot;.
                  </p>
                  <p className="text-[11px] text-white-chalk-100/40 max-w-sm mx-auto">
                    To generate multiple SKUs based on attributes like Color or Size, change Product Type to <strong>CONFIGURABLE</strong> in General Settings.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProductType("CONFIGURABLE");
                      handleGenerateVariants();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer"
                  >
                    Switch to Configurable Product
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/10">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1">
                        Attribute Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Size or Color"
                        value={variantOptionName}
                        onChange={(e) => setVariantOptionName(e.target.value)}
                        className="w-full bg-matt-black-300 border border-white-chalk-100/10 rounded-lg px-2.5 py-1.5 text-xs text-white-chalk-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1">
                        Options (Comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Small, Medium, Large"
                        value={variantValuesInput}
                        onChange={(e) => setVariantValuesInput(e.target.value)}
                        className="w-full bg-matt-black-300 border border-white-chalk-100/10 rounded-lg px-2.5 py-1.5 text-xs text-white-chalk-100 outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleGenerateVariants}
                        className="w-full py-1.5 rounded-lg text-xs font-bold bg-sunflower-100/15 hover:bg-sunflower-100/25 text-sunflower-100 border border-sunflower-100/30 transition cursor-pointer"
                      >
                        Generate Matrix
                      </button>
                    </div>
                  </div>

                  {variants.length > 0 && (
                    <div className="overflow-x-auto border border-white-chalk-100/10 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="border-b border-white-chalk-100/10 bg-matt-black-200/60 text-white-chalk-100/40 uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Variant</th>
                            <th className="py-2.5 px-3">Child SKU</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white-chalk-100/5">
                          {variants.map((v, idx) => (
                            <tr key={v.id} className="hover:bg-white-chalk-100/5">
                              <td className="py-2 px-3 font-semibold text-white-chalk-100">
                                {v.name}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setVariants((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, sku: val } : item))
                                    );
                                  }}
                                  className="w-full bg-matt-black-300 border border-white-chalk-100/10 rounded px-2 py-1 text-xs text-white-chalk-100 font-mono outline-none"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1 rounded text-cadmium-red-200 hover:bg-cadmium-red-100/10 cursor-pointer"
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
            </div>
          )}

          {/* TAB 6: SEO & GOOGLE PREVIEW */}
          {activeTab === "seo" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <Globe className="w-4 h-4 text-munsell-blue-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Search Engine Optimization (SEO)
                </h3>
              </div>

              {/* Live Google Search Preview Card */}
              <div className="p-4 rounded-xl bg-matt-black-300 border border-white-chalk-100/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Google Search Snippet Preview
                </span>
                <p className="text-[11px] text-[#202124] dark:text-[#bdc1c6] truncate">
                  https://storeframing.pk/products/{slug || "url-key"}
                </p>
                <h4 className="text-sm font-semibold text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer">
                  {metaTitle || name || "Product Page Title"}
                </h4>
                <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2">
                  {metaDescription ||
                    "Shop this product online at StoreFraming. Genuine warranty, fast delivery, and trusted merchants."}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                    Meta Title Tag
                  </label>
                  <span className="text-[11px] font-mono text-white-chalk-100/40">
                    {metaTitle.length} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Sony WH-1000XM5 Headphones | StoreFraming"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60">
                    Meta Description
                  </label>
                  <span className="text-[11px] font-mono text-white-chalk-100/40">
                    {metaDescription.length} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Compelling storefront summary for search engine results..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    placeholder="wireless, noise cancelling, sony, headphones"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Canonical URL Override (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://storeframing.pk/products/..."
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MARKETPLACE & OFFERS */}
          {activeTab === "marketplace" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-5">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <Store className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Marketplace Ownership & Seller Scope
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Product Ownership Scope
                  </label>
                  <select
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                  >
                    <option value="PLATFORM">
                      PLATFORM (Shared Master Catalogue - Any approved seller can list offers)
                    </option>
                    <option value="SELLER_EXCLUSIVE">
                      SELLER_EXCLUSIVE (Restricted to a single designated vendor store)
                    </option>
                  </select>
                </div>

                {ownershipType === "SELLER_EXCLUSIVE" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Designated Exclusive Seller Owner *
                    </label>
                    <select
                      value={ownerSellerId}
                      onChange={(e) => setOwnerSellerId(e.target.value)}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="">Select Exclusive Merchant...</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shopName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/10 text-xs text-white-chalk-100/60 space-y-1">
                <p className="font-bold text-white-chalk-100">Marketplace Offer Orchestration</p>
                <p>
                  When set to <strong>PLATFORM</strong>, merchants can submit their individual offers (with their own price, stock, and condition) against this master barcode/SKU. The marketplace Buy Box algorithm automatically awards the featured add-to-cart position based on price and seller performance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
