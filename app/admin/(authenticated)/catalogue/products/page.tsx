"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  Store,
  Tag,
  Eye,
  CheckCircle,
  XCircle,
  Archive,
  Plus,
  ExternalLink,
  Edit,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminModal,
} from "@/components/admin/AdminUI";

interface Product {
  id: string;
  name: string;
  slug: string;
  ownershipType: "PLATFORM" | "SELLER_EXCLUSIVE";
  productType: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
  visibility: "VISIBLE" | "HIDDEN";
  createdAt: string;
  ownerSeller?: {
    id: string;
    shopName: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  categories?: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  listings?: Array<{
    id: string;
    sellerId: string;
    price: number | string;
    status: string;
    seller: {
      id: string;
      shopName: string;
      slug: string;
    };
  }>;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected product for quick details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);
      if (ownershipFilter) params.set("ownershipType", ownershipFilter);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();

      if (data.data?.products) {
        setProducts(data.data.products);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else if (Array.isArray(data.data)) {
        setProducts(data.data);
        setTotalCount(data.data.length);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, ownershipFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleStatusChange = async (productId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // update local list
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId ? { ...p, status: newStatus as Product["status"] } : p
          )
        );
        if (selectedProduct && selectedProduct.id === productId) {
          setSelectedProduct({
            ...selectedProduct,
            status: newStatus as Product["status"],
          });
        }
      }
    } catch (err) {
      console.error("Error changing product status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const platformCount = products.filter(
    (p) => p.ownershipType === "PLATFORM"
  ).length;

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <AdminPageHeader
        title="Platform Products"
        description="Master product catalogue, ownership governance, and marketplace listings."
        badge={`${totalCount} Total`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Catalogue" },
          { label: "Products" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/catalogue/products/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sunflower-100/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Platform Product
            </Link>
            <Link
              href="/admin/catalogue/product-submissions"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-sunflower-100/20 bg-sunflower-100/10 text-sunflower-100 hover:bg-sunflower-100/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Review Submissions
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Products"
          value={totalCount}
          subtext="Catalogued platform-wide"
          icon={Package}
          variant="gold"
        />
        <AdminStatCard
          label="Active & Live"
          value={activeCount}
          subtext="Visible in storefront search"
          icon={CheckCircle}
          variant="green"
        />
        <AdminStatCard
          label="Platform Owned"
          value={platformCount}
          subtext="Shared catalogue assets"
          icon={Layers}
          variant="blue"
        />
        <AdminStatCard
          label="Seller Exclusive"
          value={Math.max(0, products.length - platformCount)}
          subtext="Vendor-restricted items"
          icon={Store}
          variant="purple"
        />
      </div>

      {/* Filter bar */}
      <AdminFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search product by name or slug..."
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        statusOptions={[
          { label: "Active", value: "ACTIVE" },
          { label: "Draft", value: "DRAFT" },
          { label: "Inactive", value: "INACTIVE" },
          { label: "Archived", value: "ARCHIVED" },
        ]}
        extraFilters={
          <select
            value={ownershipFilter}
            onChange={(e) => {
              setOwnershipFilter(e.target.value);
              setPage(1);
            }}
            className="bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-sunflower-100/50 cursor-pointer"
          >
            <option value="">All Ownership</option>
            <option value="PLATFORM">Platform Shared</option>
            <option value="SELLER_EXCLUSIVE">Seller Exclusive</option>
          </select>
        }
        onRefresh={fetchProducts}
        isRefreshing={loading}
      />

      {/* Products Table */}
      <AdminTable
        headers={[
          "Product",
          "Brand & Category",
          "Ownership",
          "Type",
          "Listings",
          "Status",
          "Actions",
        ]}
        loading={loading}
        isEmpty={products.length === 0}
        emptyMessage="No products found matching the criteria."
        colSpan={7}
      >
        {products.map((product) => {
          const brandName = product.brand?.name || "No Brand";
          const categoryName =
            product.categories?.[0]?.category.name || "Uncategorized";
          const listingsCount = product.listings?.length || 0;

          return (
            <tr
              key={product.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Name & Slug */}
              <td className="px-5 py-3.5 max-w-xs">
                <div className="font-semibold text-white-chalk-100 truncate">
                  {product.name}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 font-mono truncate">
                  /{product.slug}
                </div>
              </td>

              {/* Brand & Category */}
              <td className="px-5 py-3.5">
                <div className="text-white-chalk-100/90 font-medium">
                  {brandName}
                </div>
                <div className="text-[11px] text-sunflower-100/80">
                  {categoryName}
                </div>
              </td>

              {/* Ownership */}
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.ownershipType === "PLATFORM"
                      ? "bg-munsell-blue-100/15 text-munsell-blue-200 border border-munsell-blue-100/30"
                      : "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                    }`}
                >
                  {product.ownershipType === "PLATFORM"
                    ? "Platform"
                    : product.ownerSeller?.shopName || "Exclusive"}
                </span>
              </td>

              {/* Product Type */}
              <td className="px-5 py-3.5 text-white-chalk-100/60 uppercase font-mono text-[10px]">
                {product.productType}
              </td>

              {/* Listings */}
              <td className="px-5 py-3.5">
                <span className="font-semibold text-white-chalk-100">
                  {listingsCount}
                </span>{" "}
                <span className="text-white-chalk-100/40 text-[11px]">
                  seller{listingsCount === 1 ? "" : "s"}
                </span>
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={product.status} />
              </td>

              {/* Actions */}
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/admin/catalogue/products/${product.id}/edit`}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="View Product Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {product.status === "ACTIVE" ? (
                    <button
                      onClick={() => handleStatusChange(product.id, "INACTIVE")}
                      disabled={isUpdatingStatus}
                      className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/60 hover:text-cadmium-red-200 transition cursor-pointer"
                      title="Deactivate Product"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(product.id, "ACTIVE")}
                      disabled={isUpdatingStatus}
                      className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-pablano-100/30 text-white-chalk-100/60 hover:text-pablano-200 transition cursor-pointer"
                      title="Activate Product"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalCount}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Product Details Modal */}
      {selectedProduct && (
        <AdminModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title="Product Governance & Overview"
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white-chalk-100/50">Change Status:</span>
                <button
                  onClick={() => handleStatusChange(selectedProduct.id, "ACTIVE")}
                  disabled={isUpdatingStatus || selectedProduct.status === "ACTIVE"}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pablano-100/20 text-pablano-200 hover:bg-pablano-100/30 transition disabled:opacity-40 cursor-pointer"
                >
                  Active
                </button>
                <button
                  onClick={() => handleStatusChange(selectedProduct.id, "INACTIVE")}
                  disabled={isUpdatingStatus || selectedProduct.status === "INACTIVE"}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white-chalk-100/10 text-white-chalk-100/70 hover:bg-white-chalk-100/20 transition disabled:opacity-40 cursor-pointer"
                >
                  Inactive
                </button>
                <button
                  onClick={() => handleStatusChange(selectedProduct.id, "ARCHIVED")}
                  disabled={isUpdatingStatus || selectedProduct.status === "ARCHIVED"}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cadmium-red-100/20 text-cadmium-red-200 hover:bg-cadmium-red-100/30 transition disabled:opacity-40 cursor-pointer"
                >
                  Archive
                </button>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-white-chalk-100">
                {selectedProduct.name}
              </h4>
              <p className="text-xs text-white-chalk-100/40 font-mono mt-0.5">
                ID: {selectedProduct.id} · Slug: /{selectedProduct.slug}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5">
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Brand
                </p>
                <p className="text-xs font-semibold text-white-chalk-100 mt-0.5">
                  {selectedProduct.brand?.name || "None"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Primary Category
                </p>
                <p className="text-xs font-semibold text-sunflower-100 mt-0.5">
                  {selectedProduct.categories?.[0]?.category.name || "None"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Ownership
                </p>
                <p className="text-xs font-semibold text-white-chalk-100 mt-0.5">
                  {selectedProduct.ownershipType}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Product Type
                </p>
                <p className="text-xs font-semibold text-white-chalk-100 mt-0.5">
                  {selectedProduct.productType}
                </p>
              </div>
            </div>

            {/* Listings Section */}
            <div>
              <h5 className="text-xs font-bold text-white-chalk-100 uppercase tracking-wider mb-2">
                Active Seller Listings ({selectedProduct.listings?.length || 0})
              </h5>
              {!selectedProduct.listings || selectedProduct.listings.length === 0 ? (
                <p className="text-xs text-white-chalk-100/40 bg-matt-black-200/20 p-3 rounded-lg border border-white-chalk-100/5">
                  No active seller listings found for this product.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedProduct.listings.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-matt-black-200/30 rounded-lg border border-white-chalk-100/5 text-xs"
                    >
                      <div className="font-semibold text-white-chalk-100">
                        {item.seller?.shopName || "Unknown Seller"}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sunflower-100 font-bold">
                          Rs {Number(item.price).toLocaleString()}
                        </span>
                        <AdminBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
