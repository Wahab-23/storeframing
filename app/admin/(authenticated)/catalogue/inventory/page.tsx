"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  Store,
  Layers,
  Edit2,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminModal,
} from "@/components/admin/AdminUI";

interface InventoryItem {
  id: string;
  listingId: string;
  listingVariantId?: string | null;
  quantity: number;
  reservedQuantity?: number;
  lowStockThreshold: number;
  updatedAt: string;
  listing?: {
    product?: {
      name: string;
    };
    seller?: {
      shopName: string;
    };
  } | null;
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Adjust quantity modal
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newThreshold, setNewThreshold] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (Array.isArray(data.data)) {
        setInventory(data.data);
      } else if (data.data?.inventory) {
        setInventory(data.data.inventory);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAdjustInventory = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerListingId: selectedItem.listingId,
          sellerListingVariantId: selectedItem.listingVariantId,
          quantity: Number(newQuantity),
          lowStockThreshold: Number(newThreshold),
        }),
      });
      if (res.ok) {
        setInventory((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? {
                ...item,
                quantity: Number(newQuantity),
                lowStockThreshold: Number(newThreshold),
              }
              : item
          )
        );
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Failed to adjust inventory:", err);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = inventory.filter((item) => {
    const productName = item.listing?.product?.name?.toLowerCase() || "";
    const sellerName = item.listing?.seller?.shopName?.toLowerCase() || "";
    const matchesSearch =
      productName.includes(search.toLowerCase()) ||
      sellerName.includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "LOW_STOCK") {
      return item.quantity > 0 && item.quantity <= item.lowStockThreshold;
    }
    if (filterType === "OUT_OF_STOCK") {
      return item.quantity === 0;
    }
    return true;
  });

  const totalStock = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = inventory.filter(
    (item) => item.quantity > 0 && item.quantity <= item.lowStockThreshold
  ).length;
  const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;

  return (
    <div className="space-y-6 pt-6">
      <AdminPageHeader
        title="Inventory Governance"
        description="Monitor multi-seller stock allocations, low-stock threshold triggers, and inventory adjustments."
        badge={`${inventory.length} Listing Stock Records`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Catalogue", href: "/admin/catalogue/products" },
          { label: "Inventory" },
        ]}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total Units Stocked"
          value={totalStock.toLocaleString()}
          subtext="Across all vendor listings"
          icon={Boxes}
          variant="gold"
        />
        <AdminStatCard
          label="Low Stock Warning"
          value={lowStockCount}
          subtext="At or below safety threshold"
          icon={AlertTriangle}
          variant="red"
        />
        <AdminStatCard
          label="Out of Stock"
          value={outOfStockCount}
          subtext="Depleted listings requiring restock"
          icon={CheckCircle}
          variant="blue"
        />
      </div>

      {/* Filters */}
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product or seller..."
        extraFilters={
          <div className="flex items-center gap-1 bg-matt-black-200/60 p-1 rounded-xl border border-white-chalk-100/10">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === "ALL"
                  ? "bg-sunflower-100 text-matt-black-100 shadow-sm"
                  : "text-white-chalk-100/60 hover:text-white-chalk-100"
                }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterType("LOW_STOCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === "LOW_STOCK"
                  ? "bg-sunflower-100 text-matt-black-100 shadow-sm"
                  : "text-white-chalk-100/60 hover:text-white-chalk-100"
                }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setFilterType("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterType === "OUT_OF_STOCK"
                  ? "bg-sunflower-100 text-matt-black-100 shadow-sm"
                  : "text-white-chalk-100/60 hover:text-white-chalk-100"
                }`}
            >
              Depleted
            </button>
          </div>
        }
        onRefresh={fetchInventory}
        isRefreshing={loading}
      />

      {/* Inventory Table */}
      <AdminTable
        headers={[
          "Product",
          "Seller Store",
          "Available Qty",
          "Safety Threshold",
          "Stock Status",
          "Action",
        ]}
        loading={loading}
        isEmpty={filteredItems.length === 0}
        emptyMessage="No inventory records found matching your filters."
        colSpan={6}
      >
        {filteredItems.map((item) => {
          const isOutOfStock = item.quantity === 0;
          const isLowStock =
            !isOutOfStock && item.quantity <= item.lowStockThreshold;

          return (
            <tr
              key={item.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5 max-w-xs font-semibold text-white-chalk-100 truncate">
                {item.listing?.product?.name || "Unnamed Product"}
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 text-white-chalk-100/80 font-medium">
                  <Store className="w-3.5 h-3.5 text-munsell-blue-100" />
                  <span>{item.listing?.seller?.shopName || "Unknown Seller"}</span>
                </div>
              </td>

              <td className="px-5 py-3.5 font-mono text-sm font-bold text-white-chalk-100">
                {item.quantity.toLocaleString()}
              </td>

              <td className="px-5 py-3.5 font-mono text-xs text-white-chalk-100/60">
                {item.lowStockThreshold} units
              </td>

              <td className="px-5 py-3.5">
                {isOutOfStock ? (
                  <AdminBadge status="OUT_OF_STOCK" variant="danger" label="Out of Stock" />
                ) : isLowStock ? (
                  <AdminBadge status="LOW_STOCK" variant="warning" label="Low Stock" />
                ) : (
                  <AdminBadge status="OPTIMAL" variant="success" label="Optimal Stock" />
                )}
              </td>

              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => {
                    setSelectedItem(item);
                    setNewQuantity(item.quantity);
                    setNewThreshold(item.lowStockThreshold);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/40 text-white-chalk-100/70 hover:text-sunflower-100 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Adjust
                </button>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      {/* Adjust Inventory Modal */}
      {selectedItem && (
        <AdminModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Adjust Stock Level"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustInventory}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition disabled:opacity-40 cursor-pointer shadow-md shadow-sunflower-100/20"
              >
                {saving ? "Saving..." : "Update Stock"}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5">
              <h5 className="font-semibold text-white-chalk-100 text-sm">
                {selectedItem.listing?.product?.name || "Product"}
              </h5>
              <p className="text-xs text-sunflower-100 mt-1">
                Seller: {selectedItem.listing?.seller?.shopName || "Unknown"}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Available Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/60 mb-1.5">
                Low Stock Warning Threshold
              </label>
              <input
                type="number"
                min="1"
                value={newThreshold}
                onChange={(e) => setNewThreshold(Number(e.target.value))}
                className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 rounded-xl p-3 text-xs text-white-chalk-100 outline-none"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
