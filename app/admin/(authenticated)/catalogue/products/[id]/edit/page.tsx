"use client";

import { useState, useEffect, useRef, use, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CategorySelector } from "@/components/ui/category-selector";
import { MediaUploader, type MediaImage } from "@/components/ui/media-uploader";
import { ProductRevisionTimeline } from "@/components/admin/ProductRevisionTimeline";
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
  id?: string;
  name: string;
  sku: string;
}

interface SellerListingItem {
  id: string;
  price: string | number;
  compareAtPrice?: string | number | null;
  costPrice?: string | number | null;
  sellerSku?: string | null;
  condition?: string;
  warrantyTitle?: string | null;
  warrantyDescription?: string | null;
  description?: string | null;
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
  { id: "general", label: "Basics", description: "Name, brand, type, and categories", icon: Package },
  { id: "content", label: "Description", description: "Product copy and details", icon: FileText },
  { id: "images", label: "Photos & media", description: "Images and alt text", icon: ImageIcon },
  { id: "pricing", label: "Pricing & stock", description: "Seller offer setup", icon: DollarSign },
  { id: "configurations", label: "Variants", description: "Options and variant SKUs", icon: Boxes },
  { id: "seo", label: "Search preview", description: "Search title and metadata", icon: Globe },
  { id: "marketplace", label: "Seller offers", description: "Ownership and merchant offers", icon: Store },
  { id: "history", label: "History", description: "Revisions and recorded events", icon: History },
];

function buildFormSnapshot(data: {
  name: string;
  slug: string;
  sku: string;
  shortDesc: string;
  longDesc: string;
  selectedBrandId: string;
  selectedCategoryIds: string[];
  ownershipType: string;
  ownerSellerId: string;
  productType: string;
  status: string;
  visibility: string;
  modelNumber: string;
  manufacturer: string;
  countryOfOrigin: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  images: Array<{ url: string; altText?: string; isPrimary?: boolean }>;
  variants: Array<{ name: string; sku: string }>;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
}): string {
  return JSON.stringify({
    name: (data.name || "").trim(),
    slug: (data.slug || "").trim(),
    sku: (data.sku || "").trim(),
    shortDesc: (data.shortDesc || "").trim(),
    longDesc: (data.longDesc || "").trim(),
    selectedBrandId: data.selectedBrandId || "",
    selectedCategoryIds: [...(data.selectedCategoryIds || [])].sort(),
    ownershipType: data.ownershipType || "PLATFORM",
    ownerSellerId: data.ownershipType === "SELLER_EXCLUSIVE" ? data.ownerSellerId || "" : "",
    productType: data.productType || "SIMPLE",
    status: data.status || "ACTIVE",
    visibility: data.visibility || "VISIBLE",
    modelNumber: (data.modelNumber || "").trim(),
    manufacturer: (data.manufacturer || "").trim(),
    countryOfOrigin: (data.countryOfOrigin || "").trim(),
    weight: (data.weight || "").trim(),
    length: (data.length || "").trim(),
    width: (data.width || "").trim(),
    height: (data.height || "").trim(),
    images: (data.images || []).map((img) => ({
      url: img.url,
      altText: (img.altText || "").trim(),
      isPrimary: Boolean(img.isPrimary),
    })),
    variants: (data.variants || []).map((v) => ({
      name: (v.name || "").trim(),
      sku: (v.sku || "").trim(),
    })),
    metaTitle: (data.metaTitle || "").trim(),
    metaDescription: (data.metaDescription || "").trim(),
    metaKeywords: (data.metaKeywords || "").trim(),
    canonicalUrl: (data.canonicalUrl || "").trim(),
  });
}

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
  const [listings, setListings] = useState<SellerListingItem[]>([]);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);

  // Inline Offer Editor State (No popups)
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [offerSellerId, setOfferSellerId] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerCompareAtPrice, setOfferCompareAtPrice] = useState("");
  const [offerCostPrice, setOfferCostPrice] = useState("");
  const [offerStock, setOfferStock] = useState("");
  const [offerSellerSku, setOfferSellerSku] = useState("");
  const [offerCondition, setOfferCondition] = useState("NEW");
  const [offerWarrantyTitle, setOfferWarrantyTitle] = useState("");
  const [offerWarrantyDescription, setOfferWarrantyDescription] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerStatus, setOfferStatus] = useState("ACTIVE");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  // Tab 8: History & Audit Trail
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);

  // Dropdown options
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Dirty / Unsaved Changes tracking
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);

  const currentSnapshot = useMemo(() => {
    return buildFormSnapshot({
      name,
      slug,
      sku,
      shortDesc,
      longDesc,
      selectedBrandId,
      selectedCategoryIds,
      ownershipType,
      ownerSellerId,
      productType,
      status,
      visibility,
      modelNumber,
      manufacturer,
      countryOfOrigin,
      weight,
      length,
      width,
      height,
      images,
      variants,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
    });
  }, [
    name,
    slug,
    sku,
    shortDesc,
    longDesc,
    selectedBrandId,
    selectedCategoryIds,
    ownershipType,
    ownerSellerId,
    productType,
    status,
    visibility,
    modelNumber,
    manufacturer,
    countryOfOrigin,
    weight,
    length,
    width,
    height,
    images,
    variants,
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalUrl,
  ]);

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    return initialSnapshot !== currentSnapshot;
  }, [initialSnapshot, currentSnapshot]);

  const handleSkuChange = (val: string) => {
    setSku(val);
    setVariants((prev) => {
      if (prev.length <= 1) {
        const firstName = prev[0]?.name || "Default";
        const firstId = prev[0]?.id;
        return [{ ...(firstId ? { id: firstId } : {}), name: firstName, sku: val }];
      }
      return prev;
    });
  };

  // Load Product Data and references
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/sellers?limit=100").then((r) => r.json()),
    ])
      .then(([prodRes, brandsRes, sellersRes]) => {
        if (Array.isArray(brandsRes.data)) setBrands(brandsRes.data);
        const sellerList = sellersRes.data?.sellers || sellersRes.data?.items || (Array.isArray(sellersRes.data) ? sellersRes.data : []);
        if (Array.isArray(sellerList)) setSellers(sellerList);

        const p = prodRes.data;
        if (p) {
          const loadedName = p.name || "";
          const loadedSlug = p.slug || "";
          const loadedSku = p.variants?.[0]?.sku || p.listings?.[0]?.sellerSku || (p.slug ? `${p.slug}-001` : "");
          const loadedShortDesc = p.shortDescription || "";
          const loadedLongDesc = p.description || "";
          const loadedBrandId = p.brandId || "";
          const initialCats = Array.isArray(p.categories)
            ? p.categories.map((c: any) => c.category).filter(Boolean)
            : [];
          const initialCatIds = Array.isArray(p.categories)
            ? p.categories.map((c: any) => c.categoryId || c.category?.id).filter(Boolean)
            : [];
          const loadedOwnershipType = p.ownershipType || "PLATFORM";
          const loadedOwnerSellerId = p.ownerSellerId || "";
          const loadedProductType = p.productType || "SIMPLE";
          const loadedStatus = p.status || "ACTIVE";
          const loadedVisibility = p.visibility || "VISIBLE";
          const loadedModelNumber = p.modelNumber || "";
          const loadedManufacturer = p.manufacturer || "";
          const loadedCountryOfOrigin = p.countryOfOrigin || "Pakistan";
          const loadedWeight = p.weight !== null && p.weight !== undefined ? String(p.weight) : "";
          const loadedLength = p.length !== null && p.length !== undefined ? String(p.length) : "";
          const loadedWidth = p.width !== null && p.width !== undefined ? String(p.width) : "";
          const loadedHeight = p.height !== null && p.height !== undefined ? String(p.height) : "";
          const loadedImages = Array.isArray(p.images)
            ? p.images.map((img: any) => ({
                url: img.url,
                altText: img.altText || loadedName,
                isPrimary: !!img.isPrimary,
              }))
            : [];
          const loadedVariants = Array.isArray(p.variants) && p.variants.length > 0
            ? p.variants.map((v: any) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
              }))
            : [{ name: "Default", sku: loadedSku }];
          const loadedMetaTitle = p.seo?.metaTitle || "";
          const loadedMetaDescription = p.seo?.metaDescription || "";
          const loadedMetaKeywords = p.seo?.metaKeywords || "";
          const loadedCanonicalUrl = p.seo?.canonicalUrl || "";

          setName(loadedName);
          setSlug(loadedSlug);
          setSku(loadedSku);
          setShortDesc(loadedShortDesc);
          setLongDesc(loadedLongDesc);
          setSelectedBrandId(loadedBrandId);
          setCategories(initialCats);
          setSelectedCategoryIds(initialCatIds);
          setOwnershipType(loadedOwnershipType);
          setOwnerSellerId(loadedOwnerSellerId);
          setProductType(loadedProductType);
          setStatus(loadedStatus);
          setVisibility(loadedVisibility);
          setModelNumber(loadedModelNumber);
          setManufacturer(loadedManufacturer);
          setCountryOfOrigin(loadedCountryOfOrigin);
          setWeight(loadedWeight);
          setLength(loadedLength);
          setWidth(loadedWidth);
          setHeight(loadedHeight);
          setImages(loadedImages);

          if (p.listings && p.listings.length > 0) {
            setListings(p.listings);
          }

          setVariants(loadedVariants);
          setMetaTitle(loadedMetaTitle);
          setMetaDescription(loadedMetaDescription);
          setMetaKeywords(loadedMetaKeywords);
          setCanonicalUrl(loadedCanonicalUrl);

          if (Array.isArray(p.productRevisions)) {
            setRevisions(p.productRevisions);
          }

          setInitialSnapshot(
            buildFormSnapshot({
              name: loadedName,
              slug: loadedSlug,
              sku: loadedSku,
              shortDesc: loadedShortDesc,
              longDesc: loadedLongDesc,
              selectedBrandId: loadedBrandId,
              selectedCategoryIds: initialCatIds,
              ownershipType: loadedOwnershipType,
              ownerSellerId: loadedOwnerSellerId,
              productType: loadedProductType,
              status: loadedStatus,
              visibility: loadedVisibility,
              modelNumber: loadedModelNumber,
              manufacturer: loadedManufacturer,
              countryOfOrigin: loadedCountryOfOrigin,
              weight: loadedWeight,
              length: loadedLength,
              width: loadedWidth,
              height: loadedHeight,
              images: loadedImages,
              variants: loadedVariants,
              metaTitle: loadedMetaTitle,
              metaDescription: loadedMetaDescription,
              metaKeywords: loadedMetaKeywords,
              canonicalUrl: loadedCanonicalUrl,
            })
          );
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
    }));

    setVariants(generated);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const resetOfferForm = () => {
    setEditingListingId(null);
    setOfferSellerId(sellers[0]?.id || "");
    setOfferPrice("");
    setOfferCompareAtPrice("");
    setOfferCostPrice("");
    setOfferStock("");
    setOfferSellerSku("");
    setOfferCondition("NEW");
    setOfferWarrantyTitle("");
    setOfferWarrantyDescription("");
    setOfferDescription("");
    setOfferStatus("ACTIVE");
  };

  const openNewOffer = () => {
    resetOfferForm();
    if (sellers.length > 0) setOfferSellerId(sellers[0].id);
    setShowInlineForm(true);
  };

  const openEditOffer = (l: SellerListingItem) => {
    setEditingListingId(l.id);
    setOfferSellerId(l.seller.id);
    setOfferPrice(String(l.price ?? ""));
    setOfferCompareAtPrice(l.compareAtPrice ? String(l.compareAtPrice) : "");
    setOfferCostPrice(l.costPrice ? String(l.costPrice) : "");
    setOfferStock(l.inventory ? String(l.inventory.quantity) : "");
    setOfferSellerSku(l.sellerSku || "");
    setOfferCondition(l.condition || "NEW");
    setOfferWarrantyTitle(l.warrantyTitle || "");
    setOfferWarrantyDescription(l.warrantyDescription || "");
    setOfferDescription(l.description || "");
    setOfferStatus(l.status || "ACTIVE");
    setShowInlineForm(true);
  };

  const handleSaveOffer = async () => {
    const targetSellerId = ownershipType === "SELLER_EXCLUSIVE" ? ownerSellerId : offerSellerId;
    if (!targetSellerId) {
      setErrorMsg("Please select a vendor store for this offer.");
      return;
    }
    if (!offerPrice || Number(offerPrice) < 0) {
      setErrorMsg("Please enter a valid non-negative selling price.");
      return;
    }

    setSubmittingOffer(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (editingListingId) {
        const res = await fetch(`/api/admin/listings/${editingListingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            price: Number(offerPrice),
            compareAtPrice: offerCompareAtPrice ? Number(offerCompareAtPrice) : null,
            costPrice: offerCostPrice ? Number(offerCostPrice) : null,
            sellerSku: offerSellerSku.trim() || null,
            stock: offerStock !== "" ? Number(offerStock) : null,
            condition: offerCondition,
            warrantyTitle: offerWarrantyTitle.trim() || null,
            warrantyDescription: offerWarrantyDescription.trim() || null,
            description: offerDescription.trim() || null,
            status: offerStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Failed to update offer");
        setSuccessMsg("Seller offer updated successfully!");
      } else {
        const res = await fetch("/api/admin/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId: targetSellerId,
            productId: id,
            price: Number(offerPrice),
            compareAtPrice: offerCompareAtPrice ? Number(offerCompareAtPrice) : undefined,
            costPrice: offerCostPrice ? Number(offerCostPrice) : undefined,
            sellerSku: offerSellerSku.trim() || undefined,
            stock: offerStock !== "" ? Number(offerStock) : undefined,
            condition: offerCondition,
            warrantyTitle: offerWarrantyTitle.trim() || undefined,
            warrantyDescription: offerWarrantyDescription.trim() || undefined,
            description: offerDescription.trim() || undefined,
            status: offerStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || "Failed to add offer");
        setSuccessMsg("Seller offer saved successfully!");
      }

      setShowInlineForm(false);
      resetOfferForm();

      // Refresh listings
      const listRes = await fetch(`/api/admin/products/${id}`);
      const listData = await listRes.json();
      if (listData.data?.listings) {
        setListings(listData.data.listings);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while saving the offer.");
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleDeleteOffer = async (listingId: string) => {
    if (!confirm("Are you sure you want to remove this seller offer?")) return;
    setDeletingListingId(listingId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to delete offer");

      // Refresh listings
      const listRes = await fetch(`/api/admin/products/${id}`);
      const listData = await listRes.json();
      if (listData.data?.listings) {
        setListings(listData.data.listings);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error deleting offer.");
    } finally {
      setDeletingListingId(null);
    }
  };

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
      const payloadVariants =
        variants.length > 0
          ? variants.map((v) => ({ name: v.name, sku: v.sku }))
          : sku.trim()
          ? [{ name: "Default", sku: sku.trim() }]
          : [];

      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
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
        variants: payloadVariants,
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

      // Reset baseline snapshot so Save button is disabled until next edit
      setInitialSnapshot(
        buildFormSnapshot({
          name: name.trim(),
          slug: slug.trim(),
          sku: sku.trim(),
          shortDesc: shortDescription,
          longDesc: description,
          selectedBrandId,
          selectedCategoryIds,
          ownershipType,
          ownerSellerId: ownershipType === "SELLER_EXCLUSIVE" ? ownerSellerId || "" : "",
          productType,
          status,
          visibility,
          modelNumber: modelNumber.trim(),
          manufacturer: manufacturer.trim(),
          countryOfOrigin: countryOfOrigin.trim(),
          weight: weight.trim(),
          length: length.trim(),
          width: width.trim(),
          height: height.trim(),
          images,
          variants: payloadVariants,
          metaTitle: metaTitle.trim(),
          metaDescription: metaDescription.trim(),
          metaKeywords: metaKeywords.trim(),
          canonicalUrl: canonicalUrl.trim(),
        })
      );

      // Refresh product revisions and audit logs
      fetch(`/api/admin/products/${id}`)
        .then((r) => r.json())
        .then((fresh) => {
          if (fresh.data?.productRevisions) setRevisions(fresh.data.productRevisions);
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
            {hasChanges ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/25">
                <span className="w-1.5 h-1.5 rounded-full bg-sunflower-100 animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white-chalk-100/40">
                <Check className="w-3 h-3 text-emerald-400" />
                All changes saved
              </span>
            )}

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete / Archive
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving || !hasChanges}
              className={cn(
                "transition",
                !hasChanges && "opacity-40 cursor-not-allowed hover:bg-transparent text-white-chalk-100/40"
              )}
              title={hasChanges ? "Save and remain on this edit page" : "No changes to save"}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save & Continue"}
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || !hasChanges}
              className={cn(
                "transition",
                !hasChanges && "opacity-40 cursor-not-allowed hover:bg-sunflower-100"
              )}
              title={hasChanges ? "Save and return to catalogue" : "No changes to save"}
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Product"}
            </Button>
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-4">
        {/* Left Column: Navigation Sidebar */}
        <nav aria-label="Product sections" className="lg:col-span-1">
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
                  aria-current={isActive ? "step" : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${isActive
                    ? "bg-sunflower-100 text-matt-black-100 font-bold shadow-md shadow-sunflower-100/10"
                    : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold">{tab.label}</span>
                      <span className={`block mt-0.5 text-[10px] font-normal ${isActive ? "text-matt-black-100/70" : "text-white-chalk-100/40"}`}>
                        {tab.description}
                      </span>
                    </span>
                  </div>
                  {tab.id === "images" && images.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-white-chalk-100/10 text-white-chalk-100/60"
                        }`}
                    >
                      {images.length}
                    </span>
                  )}
                  {tab.id === "marketplace" && listings.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-sunflower-100/20 text-sunflower-100"
                        }`}
                    >
                      {listings.length}
                    </span>
                  )}
                  {tab.id === "history" && revisions.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? "bg-matt-black-100 text-white-chalk-100" : "bg-munsell-blue-100/20 text-munsell-blue-100"
                        }`}
                    >
                      v{revisions[0]?.revisionNumber || 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Column: Tab Panels */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: GENERAL */}
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
                      <Label htmlFor="product-name">
                        Product Name / Title *
                      </Label>
                      <Input
                        id="product-name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-brand">
                        Brand / Manufacturer
                      </Label>
                      <Select
                        id="product-brand"
                        value={selectedBrandId}
                        onChange={(e) => setSelectedBrandId(e.target.value)}
                      >
                        <option value="">No Brand (Generic / Platform)</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-slug">
                        URL Key / Slug *
                      </Label>
                      <Input
                        id="product-slug"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="e.g. sony-wh-1000xm5-wireless-headphones"
                        className="font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="product-sku">
                        Product Master SKU
                      </Label>
                      <Input
                        id="product-sku"
                        value={sku}
                        onChange={(e) => handleSkuChange(e.target.value)}
                        placeholder="e.g. SONY-WH1000XM5"
                        className="font-mono font-semibold"
                      />
                      <p className="text-[10px] text-white-chalk-100/40">
                        Primary inventory SKU for this product. Updates the catalog record and syncs with product variants.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Taxonomy & Category Placement (Interactive search & tree) */}
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
                    label="Assigned Categories"
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
                      <Label htmlFor="catalog-status">
                        Catalog Status
                      </Label>
                      <Select
                        id="catalog-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="ACTIVE">ACTIVE (Published)</option>
                        <option value="DRAFT">DRAFT (Under Review)</option>
                        <option value="INACTIVE">INACTIVE (Hidden)</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="storefront-visibility">
                        Storefront Visibility
                      </Label>
                      <Select
                        id="storefront-visibility"
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                      >
                        <option value="VISIBLE">Catalog, Search</option>
                        <option value="CATALOG_ONLY">Catalog Only</option>
                        <option value="SEARCH_ONLY">Search Only</option>
                        <option value="HIDDEN">Not Visible Individually</option>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="product-type">
                        Product Type
                      </Label>
                      <Select
                        id="product-type"
                        value={productType}
                        onChange={(e) => setProductType(e.target.value)}
                      >
                        <option value="SIMPLE">Simple Product</option>
                        <option value="CONFIGURABLE">Configurable Product</option>
                        <option value="BUNDLE">Bundle Product</option>
                        <option value="VIRTUAL">Virtual Product</option>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Identification & Logistics Dimensions */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 pb-4">
                  <Ruler className="w-4 h-4 text-sunflower-100 shrink-0" />
                  <div>
                    <CardTitle>Identification & Package Dimensions</CardTitle>
                    <CardDescription>
                      Manufacturer part numbers and shipping parcel logistics specifications
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="model-number">
                        Model Number (MPN)
                      </Label>
                      <Input
                        id="model-number"
                        type="text"
                        value={modelNumber}
                        onChange={(e) => setModelNumber(e.target.value)}
                        placeholder="e.g. WH1000XM5/B"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="manufacturer">
                        Manufacturer
                      </Label>
                      <Input
                        id="manufacturer"
                        type="text"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        placeholder="e.g. Sony Corporation"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="country-origin">
                        Country of Origin
                      </Label>
                      <Input
                        id="country-origin"
                        type="text"
                        value={countryOfOrigin}
                        onChange={(e) => setCountryOfOrigin(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="weight">
                        Weight (kg)
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="0.25"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="length">
                        Length (cm)
                      </Label>
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="22.0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="width">
                        Width (cm)
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="18.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="height">
                        Height (cm)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="7.5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: CONTENT (BLOCKNOTE BLACK EDITORS) */}
          {activeTab === "content" && (
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Content & Rich Storytelling
                  </h3>
                </div>
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
            <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl">
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
            <div className="space-y-6">
              {ownershipType === "SELLER_EXCLUSIVE" ? (
                /* EXCLUSIVE SINGLE-VENDOR OFFER CARD */
                <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-sunflower-100" />
                      <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                        Exclusive Vendor Pricing & Stock
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-sunflower-100/80 bg-sunflower-100/10 px-2.5 py-0.5 rounded border border-sunflower-100/20 font-bold">
                      SELLER_EXCLUSIVE Scope
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/40 text-xs text-white-chalk-100/60 leading-relaxed">
                    This product is set to <strong>SELLER_EXCLUSIVE</strong> scope. Exactly one designated vendor store owns pricing, stock, and fulfillment for this item.
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="edit-exclusive-vendor">
                          Designated Exclusive Vendor Store *
                        </Label>
                        <Select
                          id="edit-exclusive-vendor"
                          value={ownerSellerId}
                          onChange={(e) => {
                            setOwnerSellerId(e.target.value);
                            setOfferSellerId(e.target.value);
                          }}
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
                        <Label htmlFor="exclusive-price">Selling Price (Rs) *</Label>
                        <Input
                          id="exclusive-price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exclusive-compare-price">Compare-at / Original Price (Rs)</Label>
                        <Input
                          id="exclusive-compare-price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={offerCompareAtPrice}
                          onChange={(e) => setOfferCompareAtPrice(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exclusive-cost-price">Cost Price (Rs)</Label>
                        <Input
                          id="exclusive-cost-price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={offerCostPrice}
                          onChange={(e) => setOfferCostPrice(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exclusive-stock">Stock Quantity (Units)</Label>
                        <Input
                          id="exclusive-stock"
                          type="number"
                          placeholder="0"
                          value={offerStock}
                          onChange={(e) => setOfferStock(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exclusive-sku">Seller SKU (Optional)</Label>
                        <Input
                          id="exclusive-sku"
                          type="text"
                          placeholder={sku || "SKU-001"}
                          value={offerSellerSku}
                          onChange={(e) => setOfferSellerSku(e.target.value)}
                          className="font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="exclusive-condition">Condition</Label>
                        <Select
                          id="exclusive-condition"
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

                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="exclusive-warranty-title">Warranty Title</Label>
                        <Input
                          id="exclusive-warranty-title"
                          type="text"
                          placeholder="e.g. 1 Year Brand Warranty"
                          value={offerWarrantyTitle}
                          onChange={(e) => setOfferWarrantyTitle(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="exclusive-warranty-desc">Warranty Details</Label>
                        <textarea
                          id="exclusive-warranty-desc"
                          rows={2}
                          placeholder="Coverage terms, claim process, exclusions..."
                          value={offerWarrantyDescription}
                          onChange={(e) => setOfferWarrantyDescription(e.target.value)}
                          className="flex w-full rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 px-3.5 py-2 text-xs text-white-chalk-100 shadow-sm transition-colors placeholder:text-white-chalk-100/35 focus-visible:outline-none focus-visible:border-sunflower-100/60 focus-visible:ring-1 focus-visible:ring-sunflower-100/40 resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="button"
                        disabled={submittingOffer}
                        onClick={handleSaveOffer}
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        {submittingOffer ? "Saving Offer..." : "Save Exclusive Pricing & Stock"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* PLATFORM MULTI-VENDOR OFFERS STUDIO */
                <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-sunflower-100" />
                      <div>
                        <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                          Multi-Vendor Seller Offers ({listings.length})
                        </h3>
                        <p className="text-[11px] text-white-chalk-100/40">
                          Manage merchant pricing, discounts, stock levels, and buy-box competition
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={showInlineForm ? "secondary" : "default"}
                      size="sm"
                      onClick={() => {
                        if (showInlineForm && !editingListingId) {
                          setShowInlineForm(false);
                        } else {
                          openNewOffer();
                        }
                      }}
                    >
                      {showInlineForm && !editingListingId ? (
                        "Hide Form"
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Vendor Offer
                        </>
                      )}
                    </Button>
                  </div>

                  {/* INLINE EXPANDABLE OFFER FORM CARD (NO POPUPS) */}
                  {showInlineForm && (
                    <div className="p-5 rounded-xl border border-sunflower-100/30 bg-matt-black-200/60 space-y-4">
                      <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-sunflower-100" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100">
                            {editingListingId ? "Edit Vendor Offer" : "Add New Vendor Offer"}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInlineForm(false);
                            resetOfferForm();
                          }}
                          className="text-white-chalk-100/40 hover:text-white-chalk-100 text-xs font-semibold cursor-pointer"
                        >
                          Cancel / Close
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                          <Label htmlFor="inline-offer-seller">Vendor / Merchant Store *</Label>
                          <Select
                            id="inline-offer-seller"
                            disabled={!!editingListingId}
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
                          <Label htmlFor="inline-offer-price">Selling Price (Rs) *</Label>
                          <Input
                            id="inline-offer-price"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 4999.00"
                            value={offerPrice}
                            onChange={(e) => setOfferPrice(e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="inline-offer-compare">Compare-at / Original Price (Rs)</Label>
                          <Input
                            id="inline-offer-compare"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 5999.00"
                            value={offerCompareAtPrice}
                            onChange={(e) => setOfferCompareAtPrice(e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="inline-offer-cost">Cost Price (Rs)</Label>
                          <Input
                            id="inline-offer-cost"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 3500.00"
                            value={offerCostPrice}
                            onChange={(e) => setOfferCostPrice(e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="inline-offer-stock">Stock Quantity (Units)</Label>
                          <Input
                            id="inline-offer-stock"
                            type="number"
                            placeholder="0"
                            value={offerStock}
                            onChange={(e) => setOfferStock(e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="inline-offer-sku">Seller SKU</Label>
                          <Input
                            id="inline-offer-sku"
                            type="text"
                            placeholder={sku || "SKU-001"}
                            value={offerSellerSku}
                            onChange={(e) => setOfferSellerSku(e.target.value)}
                            className="font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="inline-offer-condition">Item Condition</Label>
                          <Select
                            id="inline-offer-condition"
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

                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                          <Label htmlFor="inline-offer-warranty-title">Warranty Title</Label>
                          <Input
                            id="inline-offer-warranty-title"
                            type="text"
                            placeholder="e.g. 1 Year Official Brand Warranty"
                            value={offerWarrantyTitle}
                            onChange={(e) => setOfferWarrantyTitle(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                          <Label htmlFor="inline-offer-warranty-desc">Warranty Details</Label>
                          <textarea
                            id="inline-offer-warranty-desc"
                            rows={2}
                            placeholder="Warranty coverage terms, claim instructions..."
                            value={offerWarrantyDescription}
                            onChange={(e) => setOfferWarrantyDescription(e.target.value)}
                            className="flex w-full rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 px-3.5 py-2 text-xs text-white-chalk-100 shadow-sm transition-colors placeholder:text-white-chalk-100/35 focus-visible:outline-none focus-visible:border-sunflower-100/60 focus-visible:ring-1 focus-visible:ring-sunflower-100/40 resize-none"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                          <Label htmlFor="inline-offer-status">Offer Status</Label>
                          <Select
                            id="inline-offer-status"
                            value={offerStatus}
                            onChange={(e) => setOfferStatus(e.target.value)}
                          >
                            <option value="ACTIVE">ACTIVE (Published & Live)</option>
                            <option value="INACTIVE">INACTIVE (Hidden)</option>
                            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-white-chalk-100/10">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowInlineForm(false);
                            resetOfferForm();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={submittingOffer}
                          onClick={handleSaveOffer}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {submittingOffer ? "Saving Offer..." : "Save Seller Offer"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {listings.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white-chalk-100/15 rounded-xl bg-matt-black-200/20 space-y-3">
                      <Store className="w-10 h-10 text-white-chalk-100/20 mx-auto" />
                      <div>
                        <p className="text-xs font-semibold text-white-chalk-100">
                          No merchant offers attached to this master product yet.
                        </p>
                        <p className="text-[11px] text-white-chalk-100/40 mt-1 max-w-md mx-auto">
                          As an admin, you can attach offers from registered vendor stores with custom pricing, compare-at discounts, and inventory stock.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={openNewOffer}
                      >
                        <Plus className="w-4 h-4 mr-1 text-sunflower-100" />
                        Attach First Vendor Offer
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white-chalk-100/10 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-matt-black-200/60 text-white-chalk-100/40 uppercase tracking-wider text-[10px] border-b border-white-chalk-100/10">
                          <tr>
                            <th className="py-3 px-3">Merchant / Store</th>
                            <th className="py-3 px-3">Seller SKU</th>
                            <th className="py-3 px-3">Selling Price</th>
                            <th className="py-3 px-3">Compare At</th>
                            <th className="py-3 px-3">Stock Units</th>
                            <th className="py-3 px-3">Condition</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white-chalk-100/5">
                          {listings.map((l) => (
                            <tr key={l.id} className="hover:bg-white-chalk-100/5 transition">
                              <td className="py-3 px-3 font-semibold text-white-chalk-100">
                                <div className="flex items-center gap-1.5">
                                  <span>{l.seller?.shopName || "Unknown Seller"}</span>
                                  {l.seller?.id && (
                                    <Link
                                      href={`/admin/sellers/${l.seller.id}/edit`}
                                      className="text-white-chalk-100/40 hover:text-sunflower-100 transition"
                                      title="View vendor profile"
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
                              <td className="py-3 px-3 font-mono text-white-chalk-100/40 line-through">
                                {l.compareAtPrice ? `Rs ${Number(l.compareAtPrice).toLocaleString()}` : "—"}
                              </td>
                              <td className="py-3 px-3 font-mono text-white-chalk-100/80">
                                {l.inventory ? `${l.inventory.quantity} units` : "Unmanaged"}
                              </td>
                              <td className="py-3 px-3 font-mono text-[10px] text-white-chalk-100/70">
                                {l.condition || "NEW"}
                              </td>
                              <td className="py-3 px-3">
                                <AdminBadge status={l.status} />
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditOffer(l)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white-chalk-100/10 hover:bg-white-chalk-100/20 text-white-chalk-100 transition cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  {l.status !== "ACTIVE" ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateListingStatus(l.id, "ACTIVE")}
                                      disabled={updatingListingId === l.id}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-pablano-100/15 hover:bg-pablano-100/25 text-pablano-200 border border-pablano-100/30 transition cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateListingStatus(l.id, "SUSPENDED")}
                                      disabled={updatingListingId === l.id}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cadmium-red-100/15 hover:bg-cadmium-red-100/25 text-cadmium-red-200 border border-cadmium-red-100/30 transition cursor-pointer"
                                    >
                                      Suspend
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOffer(l.id)}
                                    disabled={deletingListingId === l.id}
                                    className="p-1 rounded text-cadmium-red-200 hover:bg-cadmium-red-100/15 transition cursor-pointer"
                                    title="Delete offer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">
                      Option Attribute
                    </Label>
                    <Input
                      type="text"
                      value={variantOptionName}
                      onChange={(e) => setVariantOptionName(e.target.value)}
                      placeholder="e.g. Size, Color, Storage"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-[11px]">
                      Values (Comma separated)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={variantValuesInput}
                        onChange={(e) => setVariantValuesInput(e.target.value)}
                        placeholder="e.g. 64GB, 128GB, 256GB"
                      />
                      <Button
                        type="button"
                        onClick={handleGenerateVariants}
                        className="shrink-0"
                      >
                        Generate Matrix
                      </Button>
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
                                if (idx === 0) {
                                  setSku(val);
                                }
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
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo-meta-title">
                      Meta Title
                    </Label>
                    <span className="text-[10px] text-white-chalk-100/40">
                      {metaTitle.length}/60 characters recommended
                    </span>
                  </div>
                  <Input
                    id="seo-meta-title"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Buy Sony WH-1000XM5 in Pakistan - Best Price Guaranteed"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo-meta-desc">
                      Meta Description
                    </Label>
                    <span className="text-[10px] text-white-chalk-100/40">
                      {metaDescription.length}/160 characters recommended
                    </span>
                  </div>
                  <textarea
                    id="seo-meta-desc"
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Order genuine Sony wireless noise-cancelling headphones. Free express delivery, official warranty, and flexible payment options across Pakistan."
                    className="flex w-full rounded-xl border border-white-chalk-100/15 bg-matt-black-200/50 px-3.5 py-2 text-xs text-white-chalk-100 shadow-sm transition-colors placeholder:text-white-chalk-100/35 focus-visible:outline-none focus-visible:border-sunflower-100/60 focus-visible:ring-1 focus-visible:ring-sunflower-100/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seo-keywords">
                      Meta Keywords
                    </Label>
                    <Input
                      id="seo-keywords"
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      placeholder="headphones, noise cancelling, sony audio"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seo-canonical">
                      Canonical URL
                    </Label>
                    <Input
                      id="seo-canonical"
                      type="url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://storeframing.com/products/sony-wh-1000xm5"
                      className="font-mono"
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
                  <div className="space-y-1.5">
                    <Label htmlFor="ownership-scope">
                      Ownership Scope
                    </Label>
                    <Select
                      id="ownership-scope"
                      value={ownershipType}
                      onChange={(e) => setOwnershipType(e.target.value)}
                    >
                      <option value="PLATFORM">PLATFORM (Shared Multi-Vendor Master Product)</option>
                      <option value="SELLER_EXCLUSIVE">SELLER_EXCLUSIVE (Private to One Vendor)</option>
                    </Select>
                    <p className="text-[10px] text-white-chalk-100/40">
                      {ownershipType === "PLATFORM"
                        ? "Any verified merchant can list their offer and inventory against this master product."
                        : "Only the designated vendor can manage and sell this product."}
                    </p>
                  </div>

                  {ownershipType === "SELLER_EXCLUSIVE" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="seller-owner">
                        Designated Seller Owner *
                      </Label>
                      <Select
                        id="seller-owner"
                        value={ownerSellerId}
                        onChange={(e) => setOwnerSellerId(e.target.value)}
                      >
                        <option value="">Select a vendor...</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.shopName}
                          </option>
                        ))}
                      </Select>
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
              {/* Product Revisions Timeline with Rich Diff & Snapshots */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl">
                <ProductRevisionTimeline
                  revisions={revisions}
                  currentProduct={{
                    id,
                    name,
                    slug,
                    status,
                    visibility,
                    ownershipType,
                    productType,
                    brandId: selectedBrandId,
                    brandName: brands.find((b) => b.id === selectedBrandId)?.name,
                    shortDescription: shortDesc,
                    description: longDesc,
                    modelNumber,
                    manufacturer,
                    countryOfOrigin,
                    weight,
                    length,
                    width,
                    height,
                    categories: selectedCategoryIds,
                    images,
                    variants,
                  }}
                />
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
