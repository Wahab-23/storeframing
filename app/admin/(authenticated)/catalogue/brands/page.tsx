"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  CheckCircle,
  Star,
  Package,
  ExternalLink,
  Globe,
  AlertTriangle,
  Layers,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminModal,
} from "@/components/admin/AdminUI";

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  websiteUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "FEATURED">("ALL");

  // Delete modal state
  const [deletingBrand, setDeletingBrand] = useState<BrandItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchBrands = () => {
    setLoading(true);
    fetch("/api/admin/brands")
      .then((res) => res.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          setBrands(data.data);
        }
      })
      .catch((err) => {
        console.error("Error loading brands:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleDelete = async () => {
    if (!deletingBrand) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/brands/${deletingBrand.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete brand");
      }

      setBrands((prev) => prev.filter((b) => b.id !== deletingBrand.id));
      setDeletingBrand(null);
    } catch (err: any) {
      setDeleteError(err.message || "An unexpected error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    return brands.filter((brand) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        brand.name.toLowerCase().includes(query) ||
        brand.slug.toLowerCase().includes(query) ||
        (brand.websiteUrl && brand.websiteUrl.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (statusFilter === "ACTIVE") return brand.isActive;
      if (statusFilter === "INACTIVE") return !brand.isActive;
      if (statusFilter === "FEATURED") return brand.isFeatured;
      return true;
    });
  }, [brands, search, statusFilter]);

  const activeCount = brands.filter((b) => b.isActive).length;
  const featuredCount = brands.filter((b) => b.isFeatured).length;
  const totalTaggedProducts = brands.reduce(
    (sum, b) => sum + (b._count?.products || 0),
    0
  );

  return (
    <div className="space-y-6 pt-6">
      <AdminPageHeader
        title="Brands Directory"
        description="Curate verified manufacturer brands, manage official landing pages, product tag mappings, and search engine optimization."
        badge={`${brands.length} Total Brands`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Catalogue", href: "/admin/catalogue/products" },
          { label: "Brands" },
        ]}
        actions={
          <Link
            href="/admin/catalogue/brands/new"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sunflower-100/20"
          >
            <Plus className="w-4 h-4" />
            Add New Brand
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Brands"
          value={brands.length}
          subtext="Catalogued platform brands"
          icon={Tag}
          variant="gold"
        />
        <AdminStatCard
          label="Active Brands"
          value={activeCount}
          subtext="Available for seller listings"
          icon={CheckCircle}
          variant="green"
        />
        <AdminStatCard
          label="Featured Brands"
          value={featuredCount}
          subtext="Spotlighted on storefront"
          icon={Star}
          variant="gold"
        />
        <AdminStatCard
          label="Tagged Products"
          value={totalTaggedProducts}
          subtext="Items mapped to brands"
          icon={Package}
          variant="blue"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search brand name, slug, or website..."
            onRefresh={fetchBrands}
            isRefreshing={loading}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-[#161b22] border border-white-chalk-100/10 p-1 rounded-xl self-start sm:self-auto">
          {(["ALL", "ACTIVE", "INACTIVE", "FEATURED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === filter
                  ? "bg-sunflower-100 text-matt-black-100 shadow"
                  : "text-white-chalk-100/60 hover:text-white-chalk-100 hover:bg-white-chalk-100/5"
                }`}
            >
              {filter === "ALL"
                ? "All"
                : filter === "ACTIVE"
                  ? "Active"
                  : filter === "INACTIVE"
                    ? "Inactive"
                    : "Featured ⭐"}
            </button>
          ))}
        </div>
      </div>

      <AdminTable
        headers={[
          "Brand",
          "URL Slug",
          "Tagged Products",
          "Featured",
          "Status",
          "Actions",
        ]}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No brands found matching your filter criteria."
        colSpan={6}
      >
        {filtered.map((brand) => {
          const productCount = brand._count?.products || 0;
          return (
            <tr
              key={brand.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Brand info with logo */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-matt-black-200/60 border border-white-chalk-100/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="font-bold text-xs text-sunflower-100">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/admin/catalogue/brands/${brand.id}/edit`}
                      className="font-semibold text-white-chalk-100 hover:text-sunflower-100 transition line-clamp-1 text-xs sm:text-sm"
                    >
                      {brand.name}
                    </Link>
                    {brand.websiteUrl ? (
                      <a
                        href={brand.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-white-chalk-100/40 hover:text-munsell-blue-100 flex items-center gap-1 mt-0.5"
                      >
                        <Globe className="w-3 h-3" />
                        <span className="truncate max-w-[160px]">
                          {brand.websiteUrl.replace(/^https?:\/\//, "")}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-white-chalk-100/30">
                        No website linked
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Slug */}
              <td className="px-5 py-3.5 text-white-chalk-100/60 font-mono text-xs">
                <span className="bg-matt-black-200/50 px-2 py-1 rounded-md border border-white-chalk-100/5">
                  /brand/{brand.slug}
                </span>
              </td>

              {/* Tagged Products */}
              <td className="px-5 py-3.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-munsell-blue-100/10 text-munsell-blue-100 border border-munsell-blue-100/20">
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    {productCount} {productCount === 1 ? "Product" : "Products"}
                  </span>
                </div>
              </td>

              {/* Featured */}
              <td className="px-5 py-3.5">
                {brand.isFeatured ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sunflower-100/15 text-sunflower-100 border border-sunflower-100/30">
                    <Star className="w-3 h-3 fill-sunflower-100" />
                    Featured
                  </span>
                ) : (
                  <span className="text-[11px] text-white-chalk-100/40">
                    Standard
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={brand.isActive ? "ACTIVE" : "INACTIVE"} />
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end gap-1.5">
                  <Link
                    href={`/admin/catalogue/brands/${brand.id}/edit`}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="Edit Brand"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => {
                      setDeletingBrand(brand);
                      setDeleteError(null);
                    }}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/60 hover:text-cadmium-red-200 transition cursor-pointer"
                    title="Delete Brand"
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
      {deletingBrand && (
        <AdminModal
          isOpen={Boolean(deletingBrand)}
          onClose={() => {
            if (!isDeleting) setDeletingBrand(null);
          }}
          title="Delete Brand"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cadmium-red-100/10 border border-cadmium-red-100/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-cadmium-red-200 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white-chalk-100/80 space-y-1">
                <p className="font-bold text-white-chalk-100">
                  Are you sure you want to delete &ldquo;{deletingBrand.name}&rdquo;?
                </p>
                <p>
                  This will permanently delete this brand record and its SEO metadata.
                </p>
                {Boolean(deletingBrand._count?.products) && (
                  <p className="text-sunflower-100 font-semibold">
                    Note: {deletingBrand._count?.products} catalog products currently
                    assigned to this brand will be safely unlinked (their master products will
                    remain intact in your catalogue).
                  </p>
                )}
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-cadmium-red-100/20 text-cadmium-red-200 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBrand(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white-chalk-100/5 text-white-chalk-100/70 hover:bg-white-chalk-100/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition cursor-pointer shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting..." : "Confirm & Delete"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
