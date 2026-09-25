"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  ShoppingBag,
  Store,
  DollarSign,
  Edit,
  ExternalLink,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
} from "@/components/admin/AdminUI";

interface SellerPerformance {
  id: string;
  shopName: string;
  slug: string;
  logoUrl?: string | null;
  completedOrderCount: number;
  totalSales: number | string;
  totalOrders: number;
  averageRating: number | string;
  reviewCount: number;
  trustBadge: string;
  status: string;
  verificationStatus: string;
}

export default function SellerPerformancePage() {
  const [data, setData] = useState<SellerPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sellers/performance");
      const resData = await res.json();
      if (Array.isArray(resData.data)) {
        setData(resData.data);
      }
    } catch (err) {
      console.error("Error fetching performance:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = data.filter((s) =>
    s.shopName.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalCompleted = data.reduce(
    (sum, item) => sum + (item.completedOrderCount || 0),
    0
  );

  const totalMarketplaceSales = data.reduce(
    (sum, item) => sum + Number(item.totalSales || 0),
    0
  );

  const verifiedBadgesCount = data.filter(
    (item) => item.trustBadge === "VERIFIED_SELLER"
  ).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Seller Performance & Leaderboard"
        description="Fulfillment track records, sales volumes, customer ratings, and trust badge eligibility across all marketplace merchants."
        badge={`${data.length} Tracked Merchants`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sellers", href: "/admin/sellers" },
          { label: "Performance" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Completed Orders"
          value={totalCompleted.toLocaleString()}
          subtext="Successfully delivered orders"
          icon={ShoppingBag}
          variant="gold"
        />
        <AdminStatCard
          label="Total Platform Sales"
          value={`Rs ${totalMarketplaceSales.toLocaleString()}`}
          subtext="Cumulative merchant revenue"
          icon={DollarSign}
          variant="green"
        />
        <AdminStatCard
          label="Top Performing Store"
          value={data[0]?.shopName || "None"}
          subtext={`${data[0]?.completedOrderCount || 0} completed orders`}
          icon={Award}
          variant="blue"
        />
        <AdminStatCard
          label="Verified Trust Badges"
          value={`${verifiedBadgesCount} / ${data.length}`}
          subtext="Awarded VERIFIED_SELLER badge"
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search store name or slug..."
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      <AdminTable
        headers={[
          "Rank",
          "Merchant Store",
          "Sales Volume",
          "Completed Orders",
          "Rating & Reviews",
          "Trust Badge",
          "Actions",
        ]}
        loading={loading}
        isEmpty={filtered.length === 0}
        emptyMessage="No seller performance records found."
        colSpan={7}
      >
        {filtered.map((item, index) => {
          const isTopTier = item.completedOrderCount >= 50;
          const isMidTier = item.completedOrderCount >= 10;
          const ratingNum = Number(item.averageRating || 0);

          return (
            <tr
              key={item.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5 font-mono text-xs font-bold text-sunflower-100">
                #{index + 1}
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl border border-white-chalk-100/10 bg-matt-black-300/60 flex items-center justify-center overflow-hidden shrink-0">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-4 h-4 text-sunflower-100" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white-chalk-100 flex items-center gap-2">
                      <span>{item.shopName}</span>
                      <AdminBadge
                        variant={item.status === "ACTIVE" ? "success" : "warning"}
                      >
                        {item.status}
                      </AdminBadge>
                    </div>
                    <div className="text-[11px] text-white-chalk-100/40 font-mono mt-0.5">
                      /{item.slug}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-5 py-3.5 font-mono text-xs font-bold text-pablano-200">
                Rs {Number(item.totalSales || 0).toLocaleString()}
              </td>

              <td className="px-5 py-3.5">
                <div className="font-mono text-xs font-bold text-white-chalk-100">
                  {item.completedOrderCount.toLocaleString()}{" "}
                  <span className="text-[10px] text-white-chalk-100/40 font-normal">
                    / {item.totalOrders || item.completedOrderCount} total
                  </span>
                </div>
                <div className="mt-1">
                  <AdminBadge
                    variant={isTopTier ? "success" : isMidTier ? "info" : "neutral"}
                  >
                    {isTopTier ? "Tier 1 High Volume" : isMidTier ? "Tier 2 Growth" : "Tier 3 Starter"}
                  </AdminBadge>
                </div>
              </td>

              <td className="px-5 py-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sunflower-100">
                  <Star className="w-3.5 h-3.5 fill-sunflower-100 text-sunflower-100" />
                  <span>{ratingNum > 0 ? ratingNum.toFixed(1) : "0.0"}</span>
                  <span className="text-[10px] text-white-chalk-100/40 font-normal">
                    ({item.reviewCount || 0} reviews)
                  </span>
                </div>
              </td>

              <td className="px-5 py-3.5">
                {item.trustBadge === "VERIFIED_SELLER" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sunflower-100 bg-sunflower-100/10 border border-sunflower-100/20 px-2.5 py-0.5 rounded-full">
                    <Award className="w-3.5 h-3.5" />
                    VERIFIED_SELLER
                  </span>
                ) : (
                  <span className="text-white-chalk-100/30 text-xs">None</span>
                )}
              </td>

              <td className="px-5 py-3.5">
                <Link
                  href={`/admin/sellers/${item.id}/edit`}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-matt-black-200 hover:bg-matt-black-300 text-white-chalk-100 border border-white-chalk-100/10 transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-sunflower-100" />
                  Edit Vendor
                </Link>
              </td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
