"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Sliders,
  Plus,
  Trash2,
  Palette,
  Tag,
  CheckCircle,
  AlertCircle,
  FolderTree,
  Sparkles,
  Info,
} from "lucide-react";
import { AdminBadge } from "@/components/admin/AdminUI";

interface ValueItem {
  id?: string;
  label: string;
  value: string;
  sortOrder: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

const PRESET_TEMPLATES: Record<string, { label: string; value: string }[]> = {
  colors: [
    { label: "Black", value: "#000000" },
    { label: "White", value: "#FFFFFF" },
    { label: "Silver", value: "#C0C0C0" },
    { label: "Space Gray", value: "#4B4846" },
    { label: "Navy Blue", value: "#001F3F" },
    { label: "Crimson Red", value: "#DC143C" },
    { label: "Gold", value: "#FFD700" },
    { label: "Emerald Green", value: "#2ECC71" },
  ],
  sizes: [
    { label: "XS", value: "xs" },
    { label: "S", value: "s" },
    { label: "M", value: "m" },
    { label: "L", value: "l" },
    { label: "XL", value: "xl" },
    { label: "XXL", value: "xxl" },
  ],
  shoeSizes: [
    { label: "US 7", value: "us-7" },
    { label: "US 8", value: "us-8" },
    { label: "US 9", value: "us-9" },
    { label: "US 10", value: "us-10" },
    { label: "US 11", value: "us-11" },
    { label: "US 12", value: "us-12" },
  ],
  storage: [
    { label: "64 GB", value: "64gb" },
    { label: "128 GB", value: "128gb" },
    { label: "256 GB", value: "256gb" },
    { label: "512 GB", value: "512gb" },
    { label: "1 TB", value: "1tb" },
    { label: "2 TB", value: "2tb" },
  ],
  ram: [
    { label: "4 GB", value: "4gb" },
    { label: "8 GB", value: "8gb" },
    { label: "16 GB", value: "16gb" },
    { label: "32 GB", value: "32gb" },
    { label: "64 GB", value: "64gb" },
  ],
};

export default function NewAttributePage() {
  const router = useRouter();

  // Basic Information
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("TEXT");
  const [scope, setScope] = useState("PRODUCT");

  // Behavior & Settings Flags
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [isSearchable, setIsSearchable] = useState(false);
  const [isVariant, setIsVariant] = useState(false);

  // Predefined Values
  const [values, setValues] = useState<ValueItem[]>([]);

  // Categories
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isGlobal, setIsGlobal] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/categories?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const catList = d.data?.categories || d.data || [];
        if (Array.isArray(catList)) {
          setCategories(catList);
        }
      })
      .catch((e) => console.error("Error loading categories:", e));
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === val.slice(0, -1).toUpperCase().replace(/[^A-Z0-9]+/g, "_")) {
      setCode(
        val
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "_")
          .replace(/(^_|_$)+/g, "")
      );
    }
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "COLOR") {
      setIsVariant(true);
      setIsFilterable(true);
      if (values.length === 0) {
        applyPreset("colors");
      }
    } else if (newType === "SELECT" || newType === "MULTI_SELECT") {
      setIsFilterable(true);
    }
  };

  const applyPreset = (presetKey: keyof typeof PRESET_TEMPLATES) => {
    const preset = PRESET_TEMPLATES[presetKey];
    if (preset) {
      setValues(
        preset.map((p, i) => ({
          label: p.label,
          value: p.value,
          sortOrder: i,
        }))
      );
    }
  };

  const handleAddValue = () => {
    const isColor = type === "COLOR";
    setValues((prev) => [
      ...prev,
      {
        label: isColor ? "New Color" : "New Option",
        value: isColor ? "#3B82F6" : "",
        sortOrder: prev.length,
      },
    ]);
  };

  const handleUpdateValue = (index: number, field: "label" | "value", val: string) => {
    setValues((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: val };
        if (field === "label" && type !== "COLOR" && (!item.value || item.value === item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"))) {
          updated.value = val.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        }
        return updated;
      })
    );
  };

  const handleRemoveValue = (index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!name.trim()) {
        throw new Error("Attribute name is required.");
      }
      if (!code.trim()) {
        throw new Error("Attribute code is required.");
      }

      const hasValues = ["SELECT", "MULTI_SELECT", "COLOR"].includes(type);
      if (hasValues && values.length === 0) {
        throw new Error(`Please add at least one option value for ${type.replace("_", " ")} attributes.`);
      }

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        scope,
        isRequired,
        isFilterable,
        isSearchable,
        isVariant,
        values: hasValues ? values : [],
        categoryIds: isGlobal ? [] : selectedCategoryIds,
      };

      const res = await fetch("/api/admin/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create attribute");
      }

      router.push("/admin/catalogue/attributes");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isColor = type === "COLOR";
  const hasValues = ["SELECT", "MULTI_SELECT", "COLOR"].includes(type);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-6 pb-20">
      {/* Header & Breadcrumbs */}
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
            <Link href="/admin/catalogue/attributes" className="hover:text-sunflower-100 transition-colors">
              Attributes
            </Link>
            <span>/</span>
            <span className="text-white-chalk-100/70">New Attribute</span>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/catalogue/attributes"
              className="p-1.5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/50 text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-matt-black-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold font-sora text-white-chalk-100 tracking-tight">
              Create New Attribute
            </h1>
          </div>
          <p className="text-xs text-white-chalk-100/60 mt-1">
            Define specification dimensions, SKU variation matrix rules, color palettes, and faceted filters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/catalogue/attributes"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-sunflower-100/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {loading ? "Creating..." : "Save Attribute"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-cadmium-red-100/10 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Basic Information */}
        <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sunflower-100" />
            General Attribute Specification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Attribute Display Name <span className="text-cadmium-red-100">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Color, Storage Capacity, RAM, Material"
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none placeholder:text-white-chalk-100/30 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                System Code Identifier <span className="text-cadmium-red-100">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. COLOR, STORAGE_CAPACITY, RAM"
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-sunflower-100 outline-none placeholder:text-white-chalk-100/30 font-mono tracking-wider font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Data Representation Type <span className="text-cadmium-red-100">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              >
                <option value="TEXT" className="bg-matt-black-100">Text (Single Line)</option>
                <option value="SELECT" className="bg-matt-black-100">Select (Single Option Dropdown)</option>
                <option value="COLOR" className="bg-matt-black-100">Color Swatch (Visual Palette + Hex)</option>
                <option value="MULTI_SELECT" className="bg-matt-black-100">Multi Select (Multiple Tag Choices)</option>
                <option value="TEXTAREA" className="bg-matt-black-100">Textarea (Multi-line Description)</option>
                <option value="INTEGER" className="bg-matt-black-100">Integer (Whole Numbers e.g. 512)</option>
                <option value="DECIMAL" className="bg-matt-black-100">Decimal (Precision Number e.g. 6.7)</option>
                <option value="BOOLEAN" className="bg-matt-black-100">Boolean (Yes / No Toggle)</option>
                <option value="DATE" className="bg-matt-black-100">Date (Calendar Timestamp)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Attribute Scope Target <span className="text-cadmium-red-100">*</span>
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl px-3.5 py-2.5 text-xs text-white-chalk-100 outline-none"
              >
                <option value="PRODUCT" className="bg-matt-black-100">Product Scope (Master Platform Specs)</option>
                <option value="VARIANT" className="bg-matt-black-100">Variant Scope (SKU Variations: Color, Size)</option>
                <option value="LISTING" className="bg-matt-black-100">Listing Scope (Seller Offer Specifics)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Behavior & Marketplace Settings */}
        <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 border-b border-white-chalk-100/10 pb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-sunflower-100" />
            Behavior & Marketplace Integration Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* isVariant Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/30 hover:bg-matt-black-200/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={isVariant}
                onChange={(e) => setIsVariant(e.target.checked)}
                className="mt-0.5 rounded border-white-chalk-100/30 text-sunflower-100 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white-chalk-100 block">
                  Product Variant Dimension
                </span>
                <span className="text-[11px] text-white-chalk-100/50 leading-relaxed block">
                  Enables sellers and admins to generate buyable SKU variations (e.g., Color / Storage matrices).
                </span>
              </div>
            </label>

            {/* isFilterable Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/30 hover:bg-matt-black-200/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={isFilterable}
                onChange={(e) => setIsFilterable(e.target.checked)}
                className="mt-0.5 rounded border-white-chalk-100/30 text-sunflower-100 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white-chalk-100 block">
                  Storefront Faceted Filter
                </span>
                <span className="text-[11px] text-white-chalk-100/50 leading-relaxed block">
                  Appears in customer sidebar navigation filters on category and catalog search pages.
                </span>
              </div>
            </label>

            {/* isSearchable Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/30 hover:bg-matt-black-200/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={isSearchable}
                onChange={(e) => setIsSearchable(e.target.checked)}
                className="mt-0.5 rounded border-white-chalk-100/30 text-sunflower-100 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white-chalk-100 block">
                  Catalog Search Engine Index
                </span>
                <span className="text-[11px] text-white-chalk-100/50 leading-relaxed block">
                  Indexed in full-text search so buyers querying &quot;Red&quot; or &quot;512GB&quot; find matches.
                </span>
              </div>
            </label>

            {/* isRequired Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/30 hover:bg-matt-black-200/50 transition cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="mt-0.5 rounded border-white-chalk-100/30 text-sunflower-100 focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white-chalk-100 block">
                  Mandatory Specification
                </span>
                <span className="text-[11px] text-white-chalk-100/50 leading-relaxed block">
                  Requires sellers to provide this specification before submitting products for approval.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 3: Predefined Options & Values (for SELECT, MULTI_SELECT, COLOR) */}
        {hasValues && (
          <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-sunflower-100" />
                  Predefined Options & Values ({values.length})
                </h3>
                <p className="text-xs text-white-chalk-100/50 mt-0.5">
                  {isColor
                    ? "Configure color names, visual swatches, and hex codes."
                    : "Add permissible options available for selection in products and variations."}
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-white-chalk-100/40 uppercase font-bold">Presets:</span>
                {isColor ? (
                  <button
                    type="button"
                    onClick={() => applyPreset("colors")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white-chalk-100/5 hover:bg-white-chalk-100/10 text-sunflower-100 transition cursor-pointer border border-white-chalk-100/10"
                  >
                    Common Colors
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => applyPreset("sizes")}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white-chalk-100/5 hover:bg-white-chalk-100/10 text-sunflower-100 transition cursor-pointer border border-white-chalk-100/10"
                    >
                      Clothing Sizes (XS-XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("storage")}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white-chalk-100/5 hover:bg-white-chalk-100/10 text-sunflower-100 transition cursor-pointer border border-white-chalk-100/10"
                    >
                      Storage (64GB-2TB)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("ram")}
                      className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white-chalk-100/5 hover:bg-white-chalk-100/10 text-sunflower-100 transition cursor-pointer border border-white-chalk-100/10"
                    >
                      RAM (4GB-64GB)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Options Table */}
            {values.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-white-chalk-100/10 rounded-xl space-y-2">
                <p className="text-xs text-white-chalk-100/50">
                  No predefined options configured yet. Click below or choose a template preset.
                </p>
                <button
                  type="button"
                  onClick={handleAddValue}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20 hover:bg-sunflower-100/20 transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Option
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 gap-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/40">
                  {isColor && <div className="col-span-2">Color Swatch</div>}
                  <div className={isColor ? "col-span-5" : "col-span-6"}>Display Label</div>
                  <div className={isColor ? "col-span-4" : "col-span-5"}>
                    {isColor ? "Hex Code" : "Value Slug / Identifier"}
                  </div>
                  <div className="col-span-1 text-right">Delete</div>
                </div>

                {values.map((val, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-3 items-center p-2 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/5 hover:border-white-chalk-100/10 transition"
                  >
                    {isColor && (
                      <div className="col-span-2 flex items-center gap-2">
                        <input
                          type="color"
                          value={val.value.startsWith("#") ? val.value : "#000000"}
                          onChange={(e) => handleUpdateValue(idx, "value", e.target.value)}
                          className="w-8 h-8 rounded-lg border border-white-chalk-100/20 bg-transparent cursor-pointer shrink-0"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white-chalk-100/30 shrink-0"
                          style={{ backgroundColor: val.value }}
                        />
                      </div>
                    )}

                    <div className={isColor ? "col-span-5" : "col-span-6"}>
                      <input
                        type="text"
                        required
                        value={val.label}
                        onChange={(e) => handleUpdateValue(idx, "label", e.target.value)}
                        placeholder={isColor ? "e.g. Midnight Black" : "e.g. Extra Large"}
                        className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-lg px-3 py-1.5 text-xs text-white-chalk-100 outline-none"
                      />
                    </div>

                    <div className={isColor ? "col-span-4" : "col-span-5"}>
                      <input
                        type="text"
                        required
                        value={val.value}
                        onChange={(e) => handleUpdateValue(idx, "value", e.target.value)}
                        placeholder={isColor ? "#000000" : "extra-large"}
                        className="w-full bg-matt-black-200/60 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-lg px-3 py-1.5 text-xs text-white-chalk-100 outline-none font-mono"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(idx)}
                        className="p-1.5 rounded-lg text-white-chalk-100/40 hover:text-cadmium-red-200 hover:bg-cadmium-red-100/10 transition cursor-pointer"
                        title="Remove option"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddValue}
                  className="mt-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white-chalk-100/5 text-white-chalk-100/80 hover:bg-white-chalk-100/10 hover:text-white-chalk-100 transition cursor-pointer inline-flex items-center gap-1.5 border border-white-chalk-100/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option Value
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: Category Association */}
        <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white-chalk-100/70 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-sunflower-100" />
                Category Scoping & Inheritance
              </h3>
              <p className="text-xs text-white-chalk-100/50 mt-0.5">
                Decide whether this attribute is universal or exclusive to specific catalogue categories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGlobal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isGlobal
                    ? "bg-sunflower-100 text-matt-black-100 font-bold"
                    : "bg-matt-black-200 text-white-chalk-100/60 hover:text-white-chalk-100"
                }`}
              >
                Global (All Items)
              </button>
              <button
                type="button"
                onClick={() => setIsGlobal(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  !isGlobal
                    ? "bg-sunflower-100 text-matt-black-100 font-bold"
                    : "bg-matt-black-200 text-white-chalk-100/60 hover:text-white-chalk-100"
                }`}
              >
                Specific Categories
              </button>
            </div>
          </div>

          {!isGlobal && (
            <div className="space-y-3 pt-2">
              <span className="text-xs text-white-chalk-100/60 block">
                Select which categories should expose this attribute during product submission:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
                {categories.map((cat) => {
                  const isChecked = selectedCategoryIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        isChecked
                          ? "bg-sunflower-100/10 border-sunflower-100/30 text-sunflower-100 font-semibold"
                          : "bg-matt-black-200/30 border-white-chalk-100/5 text-white-chalk-100/70 hover:bg-matt-black-200/60 hover:text-white-chalk-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat.id)}
                        className="rounded border-white-chalk-100/20 text-sunflower-100 focus:ring-0"
                      />
                      <span className="truncate">{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
