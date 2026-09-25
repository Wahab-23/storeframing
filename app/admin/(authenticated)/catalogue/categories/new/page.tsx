"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  FolderTree,
  Save,
  ArrowLeft,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Plus,
  Layers,
  Globe,
  CheckCircle,
  AlertCircle,
  FileText,
  Boxes,
  Eye,
  Check,
  Layout,
  Tag,
  Search,
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

interface CategoryFlatOption {
  id: string;
  name: string;
  slug: string;
  depth: number;
  path: string;
}

interface CmsBlockItem {
  id: string;
  title: string;
  identifier: string;
  content: string | null;
  position: string;
  isActive: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  images?: Array<{ url: string }>;
  brand?: { name: string } | null;
}

const TABS = [
  { id: "general", label: "General Settings", icon: FolderTree },
  { id: "content", label: "Content & Display Blocks", icon: FileText },
  { id: "media", label: "Banners & Media Icons", icon: ImageIcon },
  { id: "seo", label: "Search Engine Optimization", icon: Globe },
  { id: "products", label: "Products in Category", icon: Boxes },
];

function flattenCategoryTree(
  nodes: any[],
  depth = 0,
  parentPath = ""
): CategoryFlatOption[] {
  let list: CategoryFlatOption[] = [];
  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    list.push({
      id: node.id,
      name: node.name,
      slug: node.slug,
      depth,
      path: currentPath,
    });
    if (node.children && node.children.length > 0) {
      list = list.concat(flattenCategoryTree(node.children, depth + 1, currentPath));
    }
  }
  return list;
}

export default function NewCategoryPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reference for BlockNote editor
  const descEditorRef = useRef<BlockNoteEditorRef>(null);

  // Tab 1: General Info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [includeInMenu, setIncludeInMenu] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [customLayout, setCustomLayout] = useState("DEFAULT");

  // Tab 2: Content & Blocks
  const [description, setDescription] = useState("");
  const [displayMode, setDisplayMode] = useState("BOTH");
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<CmsBlockItem[]>([]);
  const [newBlockModalOpen, setNewBlockModalOpen] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockIdentifier, setNewBlockIdentifier] = useState("");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockPosition, setNewBlockPosition] = useState("TOP");
  const [creatingBlock, setCreatingBlock] = useState(false);

  // Tab 3: Banners & Icons
  const [bannerUrl, setBannerUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Tab 4: SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Tab 5: Products in Category
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Category Tree options
  const [flatCategories, setFlatCategories] = useState<CategoryFlatOption[]>([]);

  // Load Tree, CMS Blocks, and Products
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pId = params.get("parentId");
      if (pId) setParentId(pId);
    }

    // 1. Fetch categories tree for nested selection
    fetch("/api/admin/categories/tree?includeInactive=true")
      .then((r) => r.json())
      .then((data) => {
        const rawTree = data.data?.categories || data.data || [];
        if (Array.isArray(rawTree)) {
          setFlatCategories(flattenCategoryTree(rawTree));
        }
      })
      .catch((err) => console.error("Error loading category tree:", err));

    // 2. Fetch CMS Blocks
    fetch("/api/admin/cms/blocks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setAvailableBlocks(data.data);
        }
      })
      .catch((err) => console.error("Error loading CMS blocks:", err));

    // 3. Fetch Products
    setLoadingProducts(true);
    fetch("/api/admin/products?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const list = data.data?.products || data.data?.items || data.data || [];
        if (Array.isArray(list)) {
          setAvailableProducts(list);
        }
      })
      .catch((err) => console.error("Error loading products:", err))
      .finally(() => setLoadingProducts(false));
  }, []);

  // Handle auto slug from Name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  };

  // Upload Handlers
  const handleFileUpload = async (file: File, target: "banner" | "icon") => {
    if (target === "banner") setUploadingBanner(true);
    else setUploadingIcon(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload image.");

      if (target === "banner") {
        setBannerUrl(data.data.url);
      } else {
        setIconUrl(data.data.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Upload failed.");
    } finally {
      if (target === "banner") setUploadingBanner(false);
      else setUploadingIcon(false);
    }
  };

  const toggleBlockSelection = (blockId: string) => {
    setSelectedBlockIds((prev) =>
      prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]
    );
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Quick create block
  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim() || !newBlockIdentifier.trim()) return;

    setCreatingBlock(true);
    try {
      const res = await fetch("/api/admin/cms/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBlockTitle.trim(),
          identifier: newBlockIdentifier.trim(),
          content: newBlockContent.trim() || null,
          position: newBlockPosition,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create block.");

      setAvailableBlocks((prev) => [...prev, data.data]);
      setSelectedBlockIds((prev) => [...prev, data.data.id]);
      setNewBlockModalOpen(false);
      setNewBlockTitle("");
      setNewBlockIdentifier("");
      setNewBlockContent("");
    } catch (err: any) {
      alert(err.message || "Failed to create block.");
    } finally {
      setCreatingBlock(false);
    }
  };

  // Save Category
  const handleSave = async (stayOnPage = false) => {
    if (!name.trim()) {
      setErrorMsg("Category name is required.");
      setActiveTab("general");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let descContent = description;
    if (descEditorRef.current) {
      try {
        descContent = await descEditorRef.current.getContent();
      } catch (err) {
        console.error("Error reading description:", err);
      }
    }

    const payload = {
      name: name.trim(),
      slug: (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, ""),
      parentId: parentId || null,
      isActive,
      includeInMenu,
      sortOrder: Number(sortOrder) || 0,
      customLayout,
      description: descContent || null,
      displayMode,
      bannerUrl: bannerUrl || null,
      iconUrl: iconUrl || null,
      imageUrl: iconUrl || null, // fallback for legacy compatibility
      blockIds: selectedBlockIds,
      productIds: selectedProductIds,
      seo: {
        metaTitle: metaTitle.trim() || null,
        metaDescription: metaDescription.trim() || null,
        metaKeywords: metaKeywords.trim() || null,
        canonicalUrl: canonicalUrl.trim() || null,
      },
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create category");
      }

      setSuccessMsg("Category created successfully with landing page settings.");

      if (stayOnPage && data.data?.category?.id) {
        router.push(`/admin/catalogue/categories/${data.data.category.id}/edit`);
      } else {
        setTimeout(() => router.push("/admin/catalogue/categories"), 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-white-chalk-100/10 -mx-6 -mt-6 px-6 py-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/catalogue/categories"
              className="p-2 rounded-xl text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-matt-black-200 transition cursor-pointer"
              title="Back to categories"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sora text-base font-bold text-white-chalk-100 truncate max-w-md">
                  {name || "New Category"}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20">
                  NEW RECORD
                </span>
                <AdminBadge status={isActive ? "ACTIVE" : "INACTIVE"} />
              </div>
              <p className="text-[11px] text-white-chalk-100/40 font-mono">
                /{slug || "category-url-key"} • Magento-Style Landing Page Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/catalogue/categories"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 border border-white-chalk-100/10 transition cursor-pointer"
            >
              Cancel
            </Link>

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
              {saving ? "Saving..." : "Save Category"}
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

      {/* Hidden File Inputs */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "banner");
          e.target.value = "";
        }}
      />
      <input
        ref={iconInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, "icon");
          e.target.value = "";
        }}
      />

      {/* Studio Layout: Sidebar Tabs + Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Vertical Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-2.5 shadow-xl space-y-1 sticky top-24">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/40 border-b border-white-chalk-100/10 mb-1">
              Category Page Setup
            </div>

            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActiveTab = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${isActiveTab
                    ? "bg-sunflower-100 text-matt-black-100 font-bold shadow-md shadow-sunflower-100/10"
                    : "text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.id === "content" && selectedBlockIds.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActiveTab
                        ? "bg-matt-black-100 text-white-chalk-100"
                        : "bg-white-chalk-100/10 text-white-chalk-100/60"
                        }`}
                    >
                      {selectedBlockIds.length}
                    </span>
                  )}
                  {tab.id === "products" && selectedProductIds.length > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActiveTab
                        ? "bg-matt-black-100 text-white-chalk-100"
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
        </div>

        {/* Right Column: Tab Panels */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                  <FolderTree className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Category Identity & Nested Hierarchy
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Wireless Audio"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
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
                      placeholder="e.g. wireless-audio"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Nested Category Parent Selector (Magento style) */}
                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Parent Category (Nesting Tree)
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                  >
                    <option value="">[Root Category - Top Level Architecture]</option>
                    {flatCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {"— ".repeat(c.depth)}
                        {c.name} (/{c.slug})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white-chalk-100/40 mt-1">
                    Select a parent to nest this category under an existing taxonomy branch (e.g., Electronics &gt; Audio &gt; Headphones).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Sort Order / Position
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      placeholder="0"
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Storefront Status
                    </label>
                    <select
                      value={isActive ? "true" : "false"}
                      onChange={(e) => setIsActive(e.target.value === "true")}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="true">Enable Category (Active)</option>
                      <option value="false">Disabled (Under Draft / Hidden)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                      Include in Navigation Menu
                    </label>
                    <select
                      value={includeInMenu ? "true" : "false"}
                      onChange={(e) => setIncludeInMenu(e.target.value === "true")}
                      className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                    >
                      <option value="true">Yes (Show in Mega Menu)</option>
                      <option value="false">No (Direct Link Landing Only)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                    Landing Page Layout Template
                  </label>
                  <select
                    value={customLayout}
                    onChange={(e) => setCustomLayout(e.target.value)}
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-sunflower-100/50 cursor-pointer"
                  >
                    <option value="DEFAULT">Default Category Layout (Hero Banner + Filters + Product Grid)</option>
                    <option value="SHOWCASE_GRID">Full Width Showcase Grid (Marketing Blocks + Featured Products)</option>
                    <option value="CATALOG_LIST">Catalog Directory Layout with Sticky Sidebar Filters</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT & DISPLAY BLOCKS */}
          {activeTab === "content" && (
            <div className="space-y-6">
              {/* Display Mode Card */}
              <div className="bg-[#161b22] border mt-6 border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                  <Layout className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Category Page Display Mode (Magento Standard)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "BOTH",
                      title: "Both Products and CMS Blocks",
                      desc: "Renders top marketing banners, promotional highlights, followed by the filtered product catalogue.",
                    },
                    {
                      id: "PRODUCTS_ONLY",
                      title: "Products Only",
                      desc: "Clean eCommerce product grid with facet filters, sorting, and pagination without custom content blocks.",
                    },
                    {
                      id: "BLOCKS_ONLY",
                      title: "Static CMS Blocks Only",
                      desc: "Turns this category into a dedicated brand landing page, microsite, or portal showcase.",
                    },
                  ].map((mode) => (
                    <label
                      key={mode.id}
                      onClick={() => setDisplayMode(mode.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${displayMode === mode.id
                        ? "bg-sunflower-100/10 border-sunflower-100 text-white-chalk-100 shadow-md shadow-sunflower-100/5"
                        : "bg-matt-black-200/40 border-white-chalk-100/10 text-white-chalk-100/70 hover:border-white-chalk-100/25"
                        }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white-chalk-100">
                            {mode.title}
                          </span>
                          <input
                            type="radio"
                            name="displayMode"
                            checked={displayMode === mode.id}
                            onChange={() => setDisplayMode(mode.id)}
                            className="accent-sunflower-100"
                          />
                        </div>
                        <p className="text-[11px] text-white-chalk-100/50 leading-relaxed">
                          {mode.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description with BlockNote Black */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sunflower-100" />
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      Category Description (BlockNote Black Theme)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-sunflower-100/80 bg-sunflower-100/10 px-2.5 py-0.5 rounded border border-sunflower-100/20">
                    Rich Landing Content
                  </span>
                </div>

                <div>
                  <p className="text-[11px] text-white-chalk-100/40 mb-2">
                    Featured at the top or bottom of the category landing page. Supports formatted headings, lists, quotes, and links.
                  </p>
                  <BlockNoteEditor
                    ref={descEditorRef}
                    initialContent={description}
                    placeholder="Write introductory category story, buying guide, brand overview, or promotional guidelines..."
                    theme="dark"
                    minHeight="180px"
                    onChange={(html) => setDescription(html)}
                  />
                </div>
              </div>

              {/* Assign CMS Blocks */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sunflower-100" />
                    <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                      Assign Marketing & CMS Blocks ({selectedBlockIds.length} Selected)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewBlockModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sunflower-100/15 hover:bg-sunflower-100/25 text-sunflower-100 border border-sunflower-100/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create New CMS Block
                  </button>
                </div>

                {availableBlocks.length === 0 ? (
                  <p className="text-xs text-white-chalk-100/40 py-4 text-center">
                    No CMS blocks found. Click &quot;Create New CMS Block&quot; to add one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableBlocks.map((b) => {
                      const isSelected = selectedBlockIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => toggleBlockSelection(b.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start gap-3 ${isSelected
                            ? "bg-sunflower-100/10 border-sunflower-100 text-white-chalk-100"
                            : "bg-matt-black-200/40 border-white-chalk-100/10 text-white-chalk-100/70 hover:border-white-chalk-100/20"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBlockSelection(b.id)}
                            className="mt-0.5 rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer"
                          />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white-chalk-100">
                                {b.title}
                              </span>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white-chalk-100/10 text-white-chalk-100/60">
                                {b.position}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-white-chalk-100/40">
                              #{b.identifier}
                            </p>
                            {b.content && (
                              <p className="text-[11px] text-white-chalk-100/60 line-clamp-2">
                                {b.content}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BANNERS & MEDIA ICONS */}
          {activeTab === "media" && (
            <div className="space-y-6">
              {/* Category Hero Banner */}
              <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sunflower-100" />
                    <div>
                      <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                        Category Landing Page Hero Banner
                      </h3>
                      <p className="text-[10px] text-white-chalk-100/40">
                        Wide banner rendered across the top of the category landing page (Recommended 1920×450 or 1200×400 px)
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
                  <div className="relative rounded-xl overflow-hidden border border-white-chalk-100/15 group aspect-[21/6] bg-matt-black-300">
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
                      Upload Category Hero Banner
                    </p>
                    <p className="text-[10px] text-white-chalk-100/40">
                      PNG, JPG, WEBP formats up to 10MB • 1920×450 px aspect ratio
                    </p>
                  </div>
                )}
              </div>

              {/* Category Icon / Thumbnail */}
              <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-munsell-blue-100" />
                    <div>
                      <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                        Category Navigation Icon &amp; Thumbnail
                      </h3>
                      <p className="text-[10px] text-white-chalk-100/40">
                        Square 1:1 icon for Mega Menu dropdowns, category navigation cards, and mobile app grids (Recommended 200×200 px)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={uploadingIcon}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-munsell-blue-100/20 text-munsell-blue-100 hover:bg-munsell-blue-100/30 border border-munsell-blue-100/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    {uploadingIcon ? "Uploading..." : "Upload Icon"}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {iconUrl ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white-chalk-100/20 bg-matt-black-300 group">
                      <img
                        src={iconUrl}
                        alt={`${name} Icon`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIconUrl("")}
                          className="p-1.5 rounded bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 cursor-pointer"
                          title="Remove icon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => iconInputRef.current?.click()}
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-white-chalk-100/15 hover:border-sunflower-100/50 bg-matt-black-200/30 flex flex-col items-center justify-center gap-1 text-center cursor-pointer transition group"
                    >
                      <ImageIcon className="w-5 h-5 text-white-chalk-100/30 group-hover:text-sunflower-100 transition" />
                      <span className="text-[10px] text-white-chalk-100/40">1:1 Icon</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs text-white-chalk-100/60">
                    <p className="font-semibold text-white-chalk-100">Square SVG or PNG</p>
                    <p className="text-[11px] text-white-chalk-100/40">
                      Transparent backgrounds render beautifully in dark and light storefront navigation menus.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEO */}
          {activeTab === "seo" && (
            <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-white-chalk-100/10 pb-3">
                <Globe className="w-4 h-4 text-sunflower-100" />
                <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                  Search Engine Optimization (Category Page SEO)
                </h3>
              </div>

              {/* Live Google Search Preview Card */}
              <div className="p-4 rounded-xl bg-matt-black-300 border border-white-chalk-100/10 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] text-white-chalk-100/40">
                  <span className="w-4 h-4 rounded-full bg-sunflower-100/20 text-sunflower-100 flex items-center justify-center text-[10px] font-bold">
                    S
                  </span>
                  <span>storeframing.com &gt; catalogue &gt; {slug || "category-slug"}</span>
                </div>
                <div className="text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer truncate">
                  {metaTitle || `${name || "Category"} - Storeframing Marketplace`}
                </div>
                <div className="text-xs text-[#bdc1c6] line-clamp-2">
                  {metaDescription ||
                    description?.replace(/<[^>]*>?/gm, "").slice(0, 160) ||
                    `Explore our verified ${name || "products"} catalogue with verified merchant offers, buyer protection, and fast delivery in Pakistan.`}
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
                    placeholder={`Buy ${name || "Category"} Online - Best Prices & Warranty in Pakistan`}
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
                    placeholder={`Browse genuine ${name || "category items"} on Storeframing. Compare prices across trusted multi-vendor stores with official warranty and instant shipping.`}
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
                      placeholder="electronics, audio, headphones, pakistan online shopping"
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
                      placeholder={`https://storeframing.com/category/${slug || "category-slug"}`}
                      className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRODUCTS IN CATEGORY */}
          {activeTab === "products" && (
            <div className="bg-[#161b22] mt-6 border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-sunflower-100" />
                  <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                    Products in Category ({selectedProductIds.length} Selected)
                  </h3>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white-chalk-100/40" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products to attach..."
                    className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white-chalk-100 outline-none focus:border-sunflower-100/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white-chalk-100/60 py-1">
                <p>
                  Check items to assign platform products to this category catalogue page.
                </p>
                {selectedProductIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds([])}
                    className="text-[11px] text-cadmium-red-200 hover:underline cursor-pointer"
                  >
                    Clear All ({selectedProductIds.length})
                  </button>
                )}
              </div>

              {loadingProducts ? (
                <div className="py-12 text-center text-xs text-white-chalk-100/40">
                  Loading catalogue products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-matt-black-200/30 border border-white-chalk-100/5 text-xs text-white-chalk-100/40">
                  No products found.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-[#161b22]">
                      <tr className="border-b border-white-chalk-100/10 text-white-chalk-100/40 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 w-10">Assign</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Slug</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white-chalk-100/5">
                      {filteredProducts.map((p) => {
                        const isSelected = selectedProductIds.includes(p.id);
                        return (
                          <tr
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id)}
                            className={`cursor-pointer transition ${isSelected
                              ? "bg-sunflower-100/5"
                              : "hover:bg-white-chalk-100/5"
                              }`}
                          >
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(p.id)}
                                className="rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-white-chalk-100 flex items-center gap-2">
                              {p.images?.[0]?.url && (
                                <img
                                  src={p.images[0].url}
                                  alt=""
                                  className="w-6 h-6 rounded object-cover border border-white-chalk-100/10"
                                />
                              )}
                              <span>{p.name}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-white-chalk-100/50">
                              /{p.slug}
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

      {/* Modal: Quick Create CMS Block */}
      {newBlockModalOpen && (
        <AdminModal
          isOpen={newBlockModalOpen}
          onClose={() => setNewBlockModalOpen(false)}
          title="Create New CMS Block"
          maxWidth="md"
        >
          <form onSubmit={handleCreateBlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1">
                Block Title *
              </label>
              <input
                type="text"
                required
                value={newBlockTitle}
                onChange={(e) => {
                  setNewBlockTitle(e.target.value);
                  if (!newBlockIdentifier) {
                    setNewBlockIdentifier(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                    );
                  }
                }}
                placeholder="e.g. Premium Audio Promo Banner"
                className="w-full bg-matt-black-200/80 border border-white-chalk-100/10 rounded-xl px-3.5 py-2 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1">
                Block Identifier (Code) *
              </label>
              <input
                type="text"
                required
                value={newBlockIdentifier}
                onChange={(e) => setNewBlockIdentifier(e.target.value)}
                placeholder="e.g. premium-audio-promo"
                className="w-full bg-matt-black-200/80 border border-white-chalk-100/10 rounded-xl px-3.5 py-2 text-xs text-white-chalk-100 font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1">
                Render Position
              </label>
              <select
                value={newBlockPosition}
                onChange={(e) => setNewBlockPosition(e.target.value)}
                className="w-full bg-matt-black-200/80 border border-white-chalk-100/10 rounded-xl px-3.5 py-2 text-xs text-white-chalk-100 outline-none cursor-pointer"
              >
                <option value="TOP">TOP (Above Products Grid)</option>
                <option value="BOTTOM">BOTTOM (Below Products Grid)</option>
                <option value="SIDEBAR">SIDEBAR (Filter Column)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1">
                Block Content / Message
              </label>
              <textarea
                rows={3}
                value={newBlockContent}
                onChange={(e) => setNewBlockContent(e.target.value)}
                placeholder="Enter promotional text or marketing notice..."
                className="w-full bg-matt-black-200/80 border border-white-chalk-100/10 rounded-xl px-3.5 py-2 text-xs text-white-chalk-100 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white-chalk-100/10">
              <button
                type="button"
                onClick={() => setNewBlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingBlock}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow"
              >
                {creatingBlock ? "Creating..." : "Save Block"}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
