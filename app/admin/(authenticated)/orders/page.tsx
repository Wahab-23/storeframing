"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
  Eye,
  CreditCard,
  Truck,
  RotateCcw,
  CheckCircle,
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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number | string;
  shippingAmount: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  currency: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  payments?: Array<{
    id: string;
    method: string;
    status: string;
    amount: number | string;
    provider: string;
  }>;
  sellerOrders?: Array<{
    id: string;
    sellerOrderNumber: string;
    status: string;
    subtotal: number | string;
    totalAmount: number | string;
    seller: {
      id: string;
      shopName: string;
      slug: string;
    };
  }>;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Order for drill-down modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();

      if (data.data?.orders) {
        setOrders(data.data.orders);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else if (Array.isArray(data.data)) {
        setOrders(data.data);
        setTotalCount(data.data.length);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalGmv = orders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );
  const completedCount = orders.filter(
    (o) => o.status === "COMPLETED" || o.status === "DELIVERED"
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders & Shipments"
        description="Global order orchestration, multi-seller shipment splits, and payment settlements."
        badge={`${totalCount} Lifetime Orders`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Orders" },
        ]}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Total Orders"
          value={totalCount}
          subtext="Processed platform-wide"
          icon={ShoppingCart}
          variant="gold"
        />
        <AdminStatCard
          label="Delivered / Completed"
          value={completedCount}
          subtext="Successful buyer handovers"
          icon={CheckCircle}
          variant="green"
        />
        <AdminStatCard
          label="Current Page GMV"
          value={`Rs ${totalGmv.toLocaleString()}`}
          subtext="Transaction volume in view"
          icon={DollarSign}
          variant="blue"
        />
      </div>

      {/* Filters */}
      <AdminFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search order number or customer email..."
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        statusOptions={[
          { label: "Pending", value: "PENDING" },
          { label: "Confirmed", value: "CONFIRMED" },
          { label: "Processing", value: "PROCESSING" },
          { label: "Shipped", value: "SHIPPED" },
          { label: "Delivered", value: "DELIVERED" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Cancelled", value: "CANCELLED" },
          { label: "Refunded", value: "REFUNDED" },
        ]}
        onRefresh={fetchOrders}
        isRefreshing={loading}
      />

      {/* Orders Table */}
      <AdminTable
        headers={[
          "Order Number",
          "Customer",
          "Date",
          "Payment",
          "Multi-Vendor Split",
          "Total Amount",
          "Order Status",
          "Action",
        ]}
        loading={loading}
        isEmpty={orders.length === 0}
        emptyMessage="No orders found matching the criteria."
        colSpan={8}
      >
        {orders.map((order) => {
          const payment = order.payments?.[0];
          const sellerOrdersCount = order.sellerOrders?.length || 0;

          return (
            <tr
              key={order.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              {/* Order Number */}
              <td className="px-5 py-3.5">
                <div className="font-mono font-bold text-white-chalk-100">
                  #{order.orderNumber}
                </div>
                <div className="text-[10px] text-white-chalk-100/40 font-mono truncate max-w-28">
                  {order.id}
                </div>
              </td>

              {/* Customer */}
              <td className="px-5 py-3.5">
                <div className="font-medium text-white-chalk-100">
                  {order.user
                    ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() || "Customer"
                    : "Guest"}
                </div>
                <div className="text-[11px] text-white-chalk-100/40 truncate max-w-36">
                  {order.user?.email || "No email"}
                </div>
              </td>

              {/* Date */}
              <td className="px-5 py-3.5 text-white-chalk-100/50 text-xs font-mono">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>

              {/* Payment */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-munsell-blue-100" />
                  <span className="font-mono text-xs font-semibold text-white-chalk-100 uppercase">
                    {payment?.method || "COD"}
                  </span>
                </div>
                <div className="mt-0.5">
                  <AdminBadge status={payment?.status || "PENDING"} />
                </div>
              </td>

              {/* Multi-Vendor Split */}
              <td className="px-5 py-3.5">
                <span className="font-semibold text-white-chalk-100">
                  {sellerOrdersCount}
                </span>{" "}
                <span className="text-white-chalk-100/40 text-[11px]">
                  store{sellerOrdersCount === 1 ? "" : "s"}
                </span>
              </td>

              {/* Total Amount */}
              <td className="px-5 py-3.5 font-mono text-sm font-bold text-sunflower-100">
                Rs {Number(order.totalAmount).toLocaleString()}
              </td>

              {/* Status */}
              <td className="px-5 py-3.5">
                <AdminBadge status={order.status} />
              </td>

              {/* Action */}
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="px-2.5 py-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/70 hover:text-sunflower-100 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </button>
              </td>
            </tr>
          );
        })}
      </AdminTable>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalCount}
        onPageChange={(p) => setPage(p)}
      />

      {/* Order Drilldown Modal */}
      {selectedOrder && (
        <AdminModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Breakdown: #${selectedOrder.orderNumber}`}
          maxWidth="lg"
          footer={
            <button
              onClick={() => setSelectedOrder(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-matt-black-200/40 p-3 rounded-xl border border-white-chalk-100/5 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Subtotal
                </p>
                <p className="font-mono text-xs font-bold text-white-chalk-100 mt-0.5">
                  Rs {Number(selectedOrder.subtotal).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Shipping
                </p>
                <p className="font-mono text-xs font-bold text-white-chalk-100 mt-0.5">
                  Rs {Number(selectedOrder.shippingAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Discount
                </p>
                <p className="font-mono text-xs font-bold text-cadmium-red-200 mt-0.5">
                  -Rs {Number(selectedOrder.discountAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-white-chalk-100/40">
                  Total
                </p>
                <p className="font-mono text-xs font-bold text-sunflower-100 mt-0.5">
                  Rs {Number(selectedOrder.totalAmount).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Seller Shipments Breakdown */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white-chalk-100 mb-2">
                Merchant Fulfillment Packages ({selectedOrder.sellerOrders?.length || 0})
              </h5>
              {!selectedOrder.sellerOrders || selectedOrder.sellerOrders.length === 0 ? (
                <p className="text-xs text-white-chalk-100/40 p-3 bg-matt-black-200/20 rounded-lg">
                  No sub-vendor orders created.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedOrder.sellerOrders.map((so) => (
                    <div
                      key={so.id}
                      className="p-3 bg-matt-black-200/40 rounded-xl border border-white-chalk-100/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white-chalk-100">
                          {so.seller?.shopName || "Vendor"}
                        </div>
                        <div className="text-[11px] text-white-chalk-100/40 font-mono mt-0.5">
                          Sub-order: #{so.sellerOrderNumber}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sunflower-100 font-bold">
                          Rs {Number(so.totalAmount).toLocaleString()}
                        </span>
                        <AdminBadge status={so.status} />
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
