"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Edit3,
  Trash2,
  Sliders,
  CheckCircle,
  Tag,
  Palette,
  Layers,
  Search,
  Check,
  X,
  AlertCircle,
  FolderTree,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminModal,
} from "@/components/admin/AdminUI";

interface AttributeValue {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
}

interface Attribute {
  id: string;
  name: string;
  code: string;
  type:
    | "TEXT"
    | "TEXTAREA"
    | "INTEGER"
    | "DECIMAL"
    | "BOOLEAN"
    | "DATE"
    | "SELECT"
    | "MULTI_SELECT"
    | "COLOR";
  scope: "PRODUCT" | "LISTING" | "VARIANT";
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isVariant: boolean;
  values: AttributeValue[];
  categories?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    productValues: number;
    values: number;
    categories: number;
  };
}

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Delete modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (scopeFilter && scopeFilter !== "ALL") params.set("scope", scopeFilter);
      if (typeFilter && typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/admin/attributes?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setAttributes(data.data);
      }
    } catch (err) {
      console.error("Error loading attributes:", err);
    } finally {
      setLoading(false);
    }
  }, [search, scopeFilter, typeFilter]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/attributes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete attribute.");
      }
      setAttributes((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete attribute.");
    } finally {
      setDeleting(false);
    }
  };

  const variantCount = attributes.filter((a) => a.isVariant || a.scope === "VARIANT").length;
  const filterableCount = attributes.filter((a) => a.isFilterable).length;
  const requiredCount = attributes.filter((a) => a.isRequired).length;

  return (
    <div className="space-y-6 pt-6">
      <AdminPageHeader
        title="Attributes & Specifications"
        description="Configure product specifications, variant dimensions (Color, Size, RAM), storefront faceted filters, and category schemas."
        badge={`${attributes.length} Configured`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Catalogue", href: "/admin/catalogue/products" },
          { label: "Attributes" },
        ]}
        actions={
          <Link
            href="/admin/catalogue/attributes/new"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sunflower-100/20"
          >
            <Plus className="w-4 h-4" />
            Add Attribute
          </Link>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Attributes"
          value={attributes.length}
          subtext="Configured specifications"
          icon={Sliders}
          variant="gold"
        />
        <AdminStatCard
          label="Variant Dimensions"
          value={variantCount}
          subtext="Used for SKU matrix generator"
          icon={Palette}
          variant="purple"
        />
        <AdminStatCard
          label="Storefront Filters"
          value={filterableCount}
          subtext="Appearing in faceted navigation"
          icon={Tag}
          variant="blue"
        />
        <AdminStatCard
          label="Mandatory Specs"
          value={requiredCount}
          subtext="Required for publishing"
          icon={CheckCircle}
          variant="green"
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-matt-black-100/80 p-3 rounded-2xl border border-white-chalk-100/10">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-white-chalk-100/40 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attribute name or code..."
            className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white-chalk-100 outline-none focus:border-sunflower-100/50 placeholder:text-white-chalk-100/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="bg-matt-black-200/50 border border-white-chalk-100/10 rounded-xl px-3 py-2 text-xs text-white-chalk-100 outline-none focus:border-sunflower-100/50"
          >
            <option value="ALL">All Scopes</option>
            <option value="PRODUCT">Product Scope</option>
            <option value="VARIANT">Variant Scope</option>
            <option value="LISTING">Listing Scope</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-matt-black-200/50 border border-white-chalk-100/10 rounded-xl px-3 py-2 text-xs text-white-chalk-100 outline-none focus:border-sunflower-100/50"
          >
            <option value="ALL">All Data Types</option>
            <option value="SELECT">Select Dropdown</option>
            <option value="COLOR">Color Swatch</option>
            <option value="MULTI_SELECT">Multi Select</option>
            <option value="TEXT">Text String</option>
            <option value="TEXTAREA">Textarea (Specs)</option>
            <option value="INTEGER">Integer</option>
            <option value="DECIMAL">Decimal</option>
            <option value="BOOLEAN">Boolean</option>
            <option value="DATE">Date</option>
          </select>

          <button
            onClick={fetchAttributes}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white-chalk-100/5 text-white-chalk-100/70 hover:text-white-chalk-100 hover:bg-white-chalk-100/10 transition cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Attributes Table */}
      <AdminTable
        headers={[
          "Attribute & Code",
          "Data Type & Options",
          "Scope",
          "Behavior & Features",
          "Categories",
          "Usage",
          "Actions",
        ]}
        loading={loading}
        isEmpty={attributes.length === 0}
        emptyMessage="No attributes found matching your criteria."
        colSpan={7}
      >
        {attributes.map((attr) => {
          const isColor = attr.type === "COLOR";
          const hasValues = ["SELECT", "MULTI_SELECT", "COLOR"].includes(attr.type);

          return (
            <tr
              key={attr.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Name & Code */}
              <td className="px-5 py-3.5">
                <Link
                  href={`/admin/catalogue/attributes/${attr.id}/edit`}
                  className="font-semibold text-white-chalk-100 hover:text-sunflower-100 text-xs transition-colors block"
                >
                  {attr.name}
                </Link>
                <span className="font-mono text-[11px] text-sunflower-100/80 tracking-wider">
                  {attr.code}
                </span>
              </td>

              {/* Data Type & Values */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] uppercase font-bold text-white-chalk-100/80 bg-matt-black-200 px-2 py-0.5 rounded border border-white-chalk-100/10">
                    {attr.type.replace("_", " ")}
                  </span>

                  {hasValues && (
                    <span className="text-[11px] text-white-chalk-100/50">
                      ({attr.values?.length || 0} values)
                    </span>
                  )}
                </div>

                {/* Color swatches preview if COLOR */}
                {isColor && attr.values && attr.values.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {attr.values.slice(0, 5).map((val) => {
                      const isHex = val.value.startsWith("#");
                      return (
                        <span
                          key={val.id}
                          className="w-4 h-4 rounded-full border border-white-chalk-100/20 inline-block shrink-0 shadow-sm"
                          style={{ backgroundColor: isHex ? val.value : "#888888" }}
                          title={`${val.label} (${val.value})`}
                        />
                      );
                    })}
                    {attr.values.length > 5 && (
                      <span className="text-[10px] text-white-chalk-100/40">
                        +{attr.values.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Value chips preview if SELECT or MULTI_SELECT */}
                {!isColor && hasValues && attr.values && attr.values.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {attr.values.slice(0, 3).map((val) => (
                      <span
                        key={val.id}
                        className="text-[10px] bg-matt-black-200/80 border border-white-chalk-100/10 text-white-chalk-100/70 px-1.5 py-0.5 rounded"
                      >
                        {val.label}
                      </span>
                    ))}
                    {attr.values.length > 3 && (
                      <span className="text-[10px] text-white-chalk-100/40">
                        +{attr.values.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </td>

              {/* Scope */}
              <td className="px-5 py-3.5">
                <AdminBadge status={attr.scope} variant="info" label={attr.scope} />
              </td>

              {/* Behavior & Features */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {attr.isVariant && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Variant Matrix
                    </span>
                  )}
                  {attr.isFilterable && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-munsell-blue-100/10 text-munsell-blue-100 border border-munsell-blue-100/20">
                      Filterable
                    </span>
                  )}
                  {attr.isSearchable && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pablano-100/10 text-pablano-200 border border-pablano-100/20">
                      Searchable
                    </span>
                  )}
                  {attr.isRequired && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20">
                      Required
                    </span>
                  )}
                  {!attr.isVariant && !attr.isFilterable && !attr.isSearchable && !attr.isRequired && (
                    <span className="text-[10px] text-white-chalk-100/30">Standard Spec</span>
                  )}
                </div>
              </td>

              {/* Linked Categories */}
              <td className="px-5 py-3.5 text-xs text-white-chalk-100/70">
                {attr.categories && attr.categories.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-sunflower-100" />
                    <span>{attr.categories.length} Categories</span>
                  </div>
                ) : (
                  <span className="text-white-chalk-100/40 italic">Global (All)</span>
                )}
              </td>

              {/* Usage Count */}
              <td className="px-5 py-3.5 text-xs text-white-chalk-100/60 font-mono">
                {attr._count?.productValues || 0} products
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/admin/catalogue/attributes/${attr.id}/edit`}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 bg-white-chalk-100/5 text-white-chalk-100/70 hover:text-sunflower-100 hover:border-sunflower-100/30 transition cursor-pointer"
                    title="Edit Attribute"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setDeleteConfirmId(attr.id)}
                    className="p-1.5 rounded-lg border border-cadmium-red-100/20 bg-cadmium-red-100/5 text-cadmium-red-200/70 hover:text-cadmium-red-200 hover:bg-cadmium-red-100/20 transition cursor-pointer"
                    title="Delete Attribute"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <AdminModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Attribute"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
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
              Are you sure you want to delete this attribute and its configured values? Existing product specification values for this attribute will be permanently removed.
            </p>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
