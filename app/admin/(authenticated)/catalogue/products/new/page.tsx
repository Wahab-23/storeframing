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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CategorySelector } from "@/components/ui/category-selector";
import { MediaUploader, type MediaImage } from "@/components/ui/media-uploader";
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
  slug?: string;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  children?: CategoryOption[];
}

interface SellerOption {
  id: string;
  shopName: string;
}

type ProductImg = MediaImage;

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

  // Tab 4: Pricing & Stock (Initial Offer creation)
  const [createInitialOffer, setCreateInitialOffer] = useState(false);
  const [offerSellerId, setOfferSellerId] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerCompareAtPrice, setOfferCompareAtPrice] = useState("");
  const [offerCostPrice, setOfferCostPrice] = useState("");
  const [offerStock, setOfferStock] = useState("");
  const [offerSellerSku, setOfferSellerSku] = useState("");
  const [offerCondition, setOfferCondition] = useState("NEW");

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

    fetch("/api/admin/sellers?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const sList = d.data?.sellers || d.data || [];
        if (Array.isArray(sList)) {
          setSellers(sList);
          if (sList.length > 0 && !offerSellerId) {
            setOfferSellerId(sList[0].id);
          }
        }
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

    // Enforce Compulsory Fields
    if (!name.trim()) {
      setActiveTab("general");
      setErrorMsg("Product Name is required. Please provide a title.");
      return;
    }

    if (!slug.trim()) {
      setActiveTab("general");
      setErrorMsg("URL Key / Slug is required for the product.");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setActiveTab("general");
      setErrorMsg("Please select at least one category for this product.");
      return;
    }

    if (ownershipType === "SELLER_EXCLUSIVE" && !ownerSellerId) {
      setActiveTab("marketplace");
      setErrorMsg("Choose the seller who owns this exclusive product before saving.");
      return;
    }

    if (createInitialOffer) {
      if (!offerSellerId) {
        setActiveTab("pricing");
        setErrorMsg("Please select a vendor store for the initial seller offer.");
        return;
      }
      if (!offerPrice || Number(offerPrice) < 0) {
        setActiveTab("pricing");
        setErrorMsg("Please enter a valid selling price for the initial seller offer.");
        return;
      }
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
          initialOffer: createInitialOffer ? {
            sellerId: offerSellerId,
            price: Number(offerPrice),
            compareAtPrice: offerCompareAtPrice ? Number(offerCompareAtPrice) : undefined,
            costPrice: offerCostPrice ? Number(offerCostPrice) : undefined,
            stock: offerStock !== "" ? Number(offerStock) : undefined,
            sellerSku: offerSellerSku.trim() || undefined,
            condition: offerCondition,
          } : undefined,
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
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/catalogue/products">
              Cancel
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => handleSubmit(undefined, true)}
          >
            Save & Continue Edit
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={saving}
            onClick={() => handleSubmit()}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Product..." : "Save Product"}
          </Button>
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
            const isCompulsoryTab = tab.id === "general";
            const isTabIncomplete = tab.id === "general" && (!name.trim() || !slug.trim() || selectedCategoryIds.length === 0);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? "step" : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition cursor-pointer ${
                  isActive
                    ? "bg-sunflower-100/15 text-sunflower-100 border border-sunflower-100/30"
                    : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-sunflower-100" : "text-white-chalk-100/40"}`} />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold flex items-center gap-1">
                      {tab.label}
                      {isCompulsoryTab && <span className="text-cadmium-red-200 font-bold">*</span>}
                    </span>
                    <span className={`block mt-0.5 text-[10px] font-normal ${isActive ? "text-sunflower-100/70" : "text-white-chalk-100/40"}`}>
                      {tab.description}
                    </span>
                  </span>
                </div>
                {isTabIncomplete && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0 ml-1">
                    Required
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Active Panel Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Card 1: Product Identification & Basics */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 pb-4">
                  <Package className="w-4 h-4 text-sunflower-100 shrink-0" />
                  <div>
                    <CardTitle>Product Identification</CardTitle>
                    <CardDescription>
                      Master catalog title, manufacturer brand, and storefront URL key
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="new-product-name">
                        Product Title / Name <span className="text-cadmium-red-200 font-bold">*</span>
                      </Label>
                      <Input
                        id="new-product-name"
                        type="text"
                        required
                        placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-product-brand">
                        Brand / Manufacturer
                      </Label>
                      <Select
                        id="new-product-brand"
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                      >
                        <option value="">No Brand (Generic / Unbranded)</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-product-slug">
                        URL Key / Slug <span className="text-cadmium-red-200 font-bold">*</span>
                      </Label>
                      <Input
                        id="new-product-slug"
                        type="text"
                        required
                        placeholder="sony-wh-1000xm5-wireless-headphones"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="new-product-sku">
                        SKU prefix for variants (optional)
                      </Label>
                      <Input
                        id="new-product-sku"
                        type="text"
                        placeholder="e.g. SONY-WH1000XM5"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="font-mono"
                      />
                      <p className="text-[10px] text-white-chalk-100/40">
                        Used to suggest SKUs when you generate variants. The prefix itself is not stored as a product SKU.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Taxonomy & Category Placement (Interactive Search + Tree) */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 pb-4">
                  <Layers className="w-4 h-4 text-sunflower-100 shrink-0" />
                  <div>
                    <CardTitle>Taxonomy & Category Placement</CardTitle>
                    <CardDescription>
                      Assign this product into parent and nested departmental categories with type-to-search
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CategorySelector
                    selectedIds={selectedCategoryIds}
                    onChange={setSelectedCategoryIds}
                    categories={categories}
                    label="Assigned Categories *"
                  />
                </CardContent>
              </Card>

              {/* Card 3: Governance & Storefront Visibility */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 pb-4">
                  <Sliders className="w-4 h-4 text-sunflower-100 shrink-0" />
                  <div>
                    <CardTitle>Product Governance & Visibility</CardTitle>
                    <CardDescription>
                      Control catalog lifecycle state, storefront discoverability, and product architecture
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-catalog-status">
                        Catalog Status
                      </Label>
                      <Select
                        id="new-catalog-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="ACTIVE">ACTIVE (Published)</option>
                        <option value="DRAFT">DRAFT (Drafting)</option>
                        <option value="INACTIVE">INACTIVE (Hidden)</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-visibility">
                        Storefront Visibility
                      </Label>
                      <Select
                        id="new-visibility"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                      >
                        <option value="VISIBLE">Catalog & Search</option>
                        <option value="CATALOG_ONLY">Catalog Only</option>
                        <option value="SEARCH_ONLY">Search Only</option>
                        <option value="HIDDEN">Not Visible Individually</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-product-type">
                        Product Type
                      </Label>
                      <Select
                        id="new-product-type"
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                      >
                        <option value="SIMPLE">SIMPLE (Single Item)</option>
                        <option value="CONFIGURABLE">CONFIGURABLE (Variants: Color/Size)</option>
                        <option value="BUNDLE">BUNDLE (Package)</option>
                        <option value="VIRTUAL">VIRTUAL (Service / Code)</option>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Logistics & Dimensions */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 pb-4">
                  <Ruler className="w-4 h-4 text-sunflower-100 shrink-0" />
                  <div>
                    <CardTitle>Manufacturing & Shipping Dimensions</CardTitle>
                    <CardDescription>
                      Manufacturer part numbers and shipping parcel logistics specifications
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-model-number">
                        Model Number (MPN)
                      </Label>
                      <Input
                        id="new-model-number"
                        type="text"
                        placeholder="e.g. WH-1000XM5"
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-manufacturer">
                        Manufacturer
                      </Label>
                      <Input
                        id="new-manufacturer"
                        type="text"
                        placeholder="e.g. Sony Corporation"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-country-origin">
                        Country of Origin
                      </Label>
                      <Input
                        id="new-country-origin"
                        type="text"
                        placeholder="Pakistan"
                        value={countryOfOrigin}
                        onChange={(e) => setCountryOfOrigin(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-weight">
                        Weight (kg)
                      </Label>
                      <Input
                        id="new-weight"
                        type="number"
                        step="0.01"
                        placeholder="0.25"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-length">
                        Length (cm)
                      </Label>
                      <Input
                        id="new-length"
                        type="number"
                        step="0.1"
                        placeholder="20"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-width">
                        Width (cm)
                      </Label>
                      <Input
                        id="new-width"
                        type="number"
                        step="0.1"
                        placeholder="16"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new-height">
                        Height (cm)
                      </Label>
                      <Input
                        id="new-height"
                        type="number"
                        step="0.1"
                        placeholder="8"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20">
              <MediaUploader
                images={images}
                onChange={(newImgs) => setImages(newImgs)}
                productName={name}
                folder="products"
                maxFiles={24}
              />
            </div>
          )}

          {/* TAB 4: PRICING & INVENTORY */}
          {activeTab === "pricing" && (
            <div className="bg-matt-black-100 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl shadow-black/20 space-y-6">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-pablano-200" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Pricing & Vendor Offer Setup
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-sunflower-100/80 bg-sunflower-100/10 px-2 py-0.5 rounded border border-sunflower-100/20 font-bold">
                  Multi-Vendor Marketplace
                </span>
              </div>

              {/* Informational architecture note */}
              <div className="rounded-xl border border-white-chalk-100/10 bg-matt-black-200/40 p-4 space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-white-chalk-100">
                  <Store className="w-4 h-4 text-sunflower-100" />
                  <span>Master Catalog vs. Seller Offers</span>
                </div>
                <p className="text-white-chalk-100/60 leading-relaxed text-[11px]">
                  Master catalog records store global attributes (title, specs, images). Merchants list individual <strong>Offers</strong> containing their own price, discount, SKU, and stock count. You can assign an initial seller offer right now during creation.
                </p>
              </div>

              {/* Initial Offer Toggle Card */}
              <div className="p-5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/60 space-y-5">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={createInitialOffer}
                    onChange={(e) => {
                      setCreateInitialOffer(e.target.checked);
                      if (e.target.checked && !offerSellerId && sellers.length > 0) {
                        setOfferSellerId(sellers[0].id);
                      }
                    }}
                    className="w-4 h-4 mt-0.5 rounded border-white-chalk-100/20 bg-matt-black-300 text-sunflower-100 focus:ring-sunflower-100/40 accent-sunflower-100 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-white-chalk-100 block">
                      Create Initial Vendor Offer with this Product
                    </span>
                    <span className="text-[11px] text-white-chalk-100/50 block mt-0.5">
                      Instantly assign a vendor store, offer price, sale price, and inventory stock quantity upon creation.
                    </span>
                  </div>
                </label>

                {createInitialOffer && (
                  <div className="pt-4 border-t border-white-chalk-100/10 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="offer-seller">
                          Designated Vendor / Merchant Store *
                        </Label>
                        <Select
                          id="offer-seller"
                          value={offerSellerId}
                          onChange={(e) => setOfferSellerId(e.target.value)}
                        >
                          <option value="">Select Vendor Store...</option>
                          {sellers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.shopName}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="offer-price">
                          Offer Price (Rs) *
                        </Label>
                        <Input
                          id="offer-price"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 4999.00"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="offer-compare-price">
                          Compare-at / Original Price (Rs)
                        </Label>
                        <Input
                          id="offer-compare-price"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 5999.00"
                          value={offerCompareAtPrice}
                          onChange={(e) => setOfferCompareAtPrice(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="offer-cost-price">
                          Cost Price (Rs)
                        </Label>
                        <Input
                          id="offer-cost-price"
                          type="number"
                          step="0.01"
                          placeholder="e.g. 3500.00"
                          value={offerCostPrice}
                          onChange={(e) => setOfferCostPrice(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="offer-stock">
                          Initial Stock Quantity (Units)
                        </Label>
                        <Input
                          id="offer-stock"
                          type="number"
                          placeholder="0"
                          value={offerStock}
                          onChange={(e) => setOfferStock(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="offer-sku">
                          Seller SKU (Optional)
                        </Label>
                        <Input
                          id="offer-sku"
                          type="text"
                          placeholder={sku || "e.g. STORE-PROD-001"}
                          value={offerSellerSku}
                          onChange={(e) => setOfferSellerSku(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="offer-condition">
                          Item Condition
                        </Label>
                        <Select
                          id="offer-condition"
                          value={offerCondition}
                          onChange={(e) => setOfferCondition(e.target.value)}
                        >
                          <option value="NEW">NEW (Brand New Sealed)</option>
                          <option value="REFURBISHED">REFURBISHED (Factory Certified)</option>
                          <option value="USED_LIKE_NEW">USED (Like New)</option>
                          <option value="USED_GOOD">USED (Good Condition)</option>
                          <option value="OPEN_BOX">OPEN BOX</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
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
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">
                        Attribute Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g. Size or Color"
                        value={variantOptionName}
                        onChange={(e) => setVariantOptionName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">
                        Options (Comma separated)
                      </Label>
                      <Input
                        type="text"
                        placeholder="Small, Medium, Large"
                        value={variantValuesInput}
                        onChange={(e) => setVariantValuesInput(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGenerateVariants}
                        className="w-full text-sunflower-100 border border-sunflower-100/30 hover:bg-sunflower-100/15"
                      >
                        Generate Matrix
                      </Button>
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

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-seo-title">
                      Meta Title Tag
                    </Label>
                    <span className="text-[11px] font-mono text-white-chalk-100/40">
                      {metaTitle.length} / 60 characters
                    </span>
                  </div>
                  <Input
                    id="new-seo-title"
                    type="text"
                    placeholder="e.g. Sony WH-1000XM5 Headphones | StoreFraming"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-seo-desc">
                      Meta Description
                    </Label>
                    <span className="text-[11px] font-mono text-white-chalk-100/40">
                      {metaDescription.length} / 160 characters
                    </span>
                  </div>
                  <textarea
                    id="new-seo-desc"
                    rows={3}
                    placeholder="Compelling storefront summary for search engine results..."
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="flex w-full rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 px-3.5 py-2 text-xs text-white-chalk-100 shadow-sm transition-colors placeholder:text-white-chalk-100/35 focus-visible:outline-none focus-visible:border-sunflower-100/60 focus-visible:ring-1 focus-visible:ring-sunflower-100/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-seo-keywords">
                      Meta Keywords
                    </Label>
                    <Input
                      id="new-seo-keywords"
                      type="text"
                      placeholder="wireless, noise cancelling, sony, headphones"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="new-seo-canonical">
                      Canonical URL Override (Optional)
                    </Label>
                    <Input
                      id="new-seo-canonical"
                      type="url"
                      placeholder="https://storeframing.pk/products/..."
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      className="font-mono"
                    />
                  </div>
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
                <div className="space-y-1.5">
                  <Label htmlFor="new-ownership-scope">
                    Product Ownership Scope
                  </Label>
                  <Select
                    id="new-ownership-scope"
                    value={ownershipType}
                    onChange={(e) => setOwnershipType(e.target.value)}
                  >
                    <option value="PLATFORM">
                      PLATFORM (Shared Master Catalogue - Any approved seller can list offers)
                    </option>
                    <option value="SELLER_EXCLUSIVE">
                      SELLER_EXCLUSIVE (Restricted to a single designated vendor store)
                    </option>
                  </Select>
                </div>

                {ownershipType === "SELLER_EXCLUSIVE" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="new-designated-seller">
                      Designated Exclusive Seller Owner *
                    </Label>
                    <Select
                      id="new-designated-seller"
                      value={ownerSellerId}
                      onChange={(e) => setOwnerSellerId(e.target.value)}
                    >
                      <option value="">Select Exclusive Merchant...</option>
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.shopName}
                        </option>
                      ))}
                    </Select>
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
