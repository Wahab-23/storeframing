"use client";

import type { ElementType } from "react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalRevenue: number;
    activeSellers: number;
    totalCustomers: number;
    ordersToday: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
  };
  hero: {
    pendingSellers: number;
    pendingProducts: number;
  };
  metrics: {
    totalGmv: number;
    pendingApprovals: number;
    uptime: string;
    openDisputes: number;
  };
  chart: Array<{ date: string; amount: number; ordersCount?: number; averageOrderValue?: number }>;
  activities: Array<{
    type: string;
    title: string;
    desc: string;
    time: string;
  }>;
  pendingApprovalsList: Array<{
    name: string;
    type: string;
    submitted: string;
    status: string;
  }>;
  health: {
    apiResponseTime: string;
    sellerFillRate: string;
    orderFulfillment: string;
    returnRate: string;
  };
}

function formatTimeAgo(dateString: string) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  if (isNaN(diffMs)) return dateString;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

const getFeedItemProps = (activity: { type?: string; title?: string; desc?: string; time?: string }) => {
  let icon = Activity;
  let variant: "success" | "info" | "warning" | "danger" = "info";

  const type = activity.type || "";
  const title = activity.title?.toLowerCase() || "";

  if (type === "seller_approved" || title.includes("approved") || title.includes("success")) {
    icon = CheckCircle2;
    variant = "success";
  } else if (type === "submission" || title.includes("submission") || title.includes("product")) {
    icon = Package;
    variant = "info";
  } else if (type === "order" || title.includes("order")) {
    icon = ShoppingBag;
    variant = "warning";
  } else if (title.includes("dispute") || title.includes("rejected") || title.includes("danger") || title.includes("fail")) {
    icon = AlertTriangle;
    variant = "danger";
  } else if (title.includes("user") || title.includes("customer")) {
    icon = Users;
    variant = "info";
  } else if (type === "commission" || title.includes("commission") || title.includes("setting") || title.includes("update")) {
    icon = Zap;
    variant = "success";
  }

  return { icon, variant };
};

const STORAGE_KEY_PERIOD = "admin_dashboard_period";
const STORAGE_KEY_DATES = "admin_dashboard_selected_dates";

export default function AdminDashboard() {
  const [Period, setPeriod] = useState("week");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Restore cached values from localStorage after hydration (client-only)
  useEffect(() => {
    const savedPeriod = localStorage.getItem(STORAGE_KEY_PERIOD);
    if (savedPeriod && ["week", "month", "quarter", "year"].includes(savedPeriod)) {
      setPeriod(savedPeriod);
    }
    const savedDates = localStorage.getItem(STORAGE_KEY_DATES);
    if (savedDates) {
      try {
        setSelectedDates(new Set<string>(JSON.parse(savedDates)));
      } catch { /* ignore bad data */ }
    }
    setHydrated(true);
  }, []);

  // Persist period to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY_PERIOD, Period);
    }
  }, [Period, hydrated]);

  // Persist selected dates to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify([...selectedDates]));
    }
  }, [selectedDates, hydrated]);

  // Fetch data when period changes (skip until hydrated to avoid double-fetch)
  useEffect(() => {
    if (!hydrated) return;
    setLoading(true);
    const currentPeriod = Period;
    fetch(`/api/admin/overview?period=${currentPeriod}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.data) {
          setData(resData.data);
          const chartDates: string[] = resData.data.chart.map((c: { date: string }) => c.date);
          // If we have a cached selection, keep only dates that exist in the chart
          setSelectedDates((prev) => {
            if (prev.size > 0) {
              const valid = new Set<string>([...prev].filter((d) => chartDates.includes(d)));
              if (valid.size > 0) return valid;
            }
            // No valid cached dates — select all
            return new Set<string>(chartDates);
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching overview data:", err);
        setLoading(false);
      });
  }, [Period, hydrated]);

  const maxAmount = data?.chart && data.chart.length > 0
    ? Math.max(...data.chart.map((c) => c.amount), 1)
    : 1;

  const dynamicChartData = data?.chart ?? [];

  // Multi-selection aggregation
  const selectedItems = dynamicChartData.filter((item) => selectedDates.has(item.date));
  const selectionRevenue = selectedItems.reduce((sum, item) => sum + item.amount, 0);
  const selectionOrders = selectedItems.reduce((sum, item) => sum + (item.ordersCount ?? 0), 0);
  const selectionAov = selectionOrders > 0 ? selectionRevenue / selectionOrders : 0;
  const hasSelection = selectedDates.size > 0;

  const dynamicOverviewMetrics = [
    {
      label: "Total GMV",
      value: hasSelection
        ? `Rs ${selectionRevenue.toLocaleString()}`
        : data
          ? `Rs ${data.metrics.totalGmv.toLocaleString()}`
          : "Rs 0",
      change: hasSelection
        ? selectedDates.size === dynamicChartData.length
          ? `Full ${Period} revenue`
          : `${selectedDates.size} day${selectedDates.size > 1 ? "s" : ""} selected`
        : `Total revenue in ${Period}`,
      tone: "success",
      icon: TrendingUp,
    },
    {
      label: "Pending Approvals",
      value: data ? String(data.metrics.pendingApprovals) : "0",
      change: "Sellers & Products",
      tone: "info",
      icon: Store,
    },
    {
      label: "Platform Uptime",
      value: data?.metrics.uptime ?? "99.98%",
      change: "30-day average",
      tone: "warning",
      icon: Zap,
    },
    {
      label: "Open Disputes",
      value: data ? String(data.metrics.openDisputes) : "0",
      change: "Return requests",
      tone: "danger",
      icon: ShoppingBag,
    },
  ];

  function toggleBar(item: typeof dynamicChartData[number]) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(item.date)) {
        next.delete(item.date);
      } else {
        next.add(item.date);
      }
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-screen-2xl space-y-6">
      {/* Dashboard Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-sunflower-100/20 bg-matt-black-100 px-5 py-6 shadow-2xl shadow-matt-black-100/20 sm:px-7 sm:py-8">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(252,192,20,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(252,192,20,0.05)_1px,transparent_1px)] bg-size-[36px_36px]" />

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sunflower-100/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-munsell-blue-100/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
            <div className="flex items-start gap-4 sm:items-center sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-sunflower-100/25 bg-sunflower-100/10 shadow-lg shadow-sunflower-100/5">
                <Image
                  src="/company-identity/Insignia.svg"
                  alt="iShopping"
                  width={34}
                  height={24}
                  priority
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-pablano-100/25 bg-pablano-100/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-pablano-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-pablano-100" />
                    PLATFORM DEVELOPMENT MODE
                  </span>
                </div>

                <h1 className="font-sora text-2xl font-bold tracking-tight text-white-chalk-100 sm:text-3xl">
                  iShopping Marketplace
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white-chalk-100/55">
                  You have{" "}
                  <span className="font-semibold text-sunflower-100">
                    {data?.hero.pendingSellers ?? 0} seller applications
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold text-munsell-blue-200">
                    {data?.hero.pendingProducts ?? 0} products
                  </span>{" "}
                  awaiting your review.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/admin/approval">
                <button className="inline-flex cursor-pointer min-h-11 items-center justify-center rounded-xl bg-sunflower-100 px-5 text-sm font-bold text-matt-black-100 transition hover:-translate-y-0.5 hover:bg-sunflower-200 hover:shadow-lg hover:shadow-sunflower-100/20 focus:outline-none focus:ring-2 focus:ring-sunflower-100/50">
                  Review Applications
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              </Link>

              {/* Analytics will implemented with cloudflare analytics */}
              <Link href="/admin/reports/analytics">
                <button className="inline-flex cursor-pointer min-h-11 items-center justify-center rounded-xl border border-white-chalk-100/10 bg-white-chalk-100/5 px-5 text-sm font-semibold text-white-chalk-100/75 transition hover:border-munsell-blue-100/30 hover:bg-munsell-blue-100/10 hover:text-white-chalk-100">
                  View Analytics
                </button>
              </Link>

            </div>
          </div>

          {/* Overview metrics */}
          <div className="mt-7 grid overflow-hidden rounded-2xl border border-white-chalk-100/8 bg-matt-black-200/50 sm:grid-cols-2 lg:grid-cols-4">
            {dynamicOverviewMetrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`relative px-5 py-4 ${index !== 0
                  ? "border-t border-white-chalk-100/8 border-l md:border-t lg:border-t-0"
                  : ""
                  }`}
              >
                <p className="text-xs font-medium text-white-chalk-100/40">
                  {metric.label}
                </p>

                <p className="mt-1 text-2xl font-bold tracking-tight text-white-chalk-100">
                  {metric.value}
                </p>

                <p
                  className={`mt-1 text-xs font-semibold ${metric.tone === "success"
                    ? "text-pablano-200"
                    : metric.tone === "warning"
                      ? "text-sunflower-100"
                      : metric.tone === "danger"
                        ? "text-red-500"
                        : "text-munsell-blue-200"
                    }`}
                >
                  {metric.change}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue and Activity */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue */}
        <div className="rounded-2xl border border-white-chalk-100/10 bg-matt-black-100 p-5 shadow-lg shadow-black/20 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-munsell-blue-100">
                Performance
              </p>

              <h2 className="mt-1 font-sora text-lg font-bold text-white-chalk-100">
                Revenue Overview
              </h2>

              <p className="mt-1 text-xs text-matt-black-300">
                Platform GMV performance over the last 30 days
              </p>
            </div>

            <div className="flex w-full rounded-xl bg-matt-black-200 p-1 sm:w-auto">
              {["week", "month", "quarter", "year"].map((item) => (
                <button
                  key={item}
                  className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none ${item === Period
                    ? "bg-sunflower-100 text-matt-black-100 shadow-sm"
                    : "text-matt-black-300 hover:bg-matt-black-100/20 hover:text-white-chalk-100"
                    }`}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="mt-7">
            <div className="flex h-56 items-end gap-1 rounded-2xl border border-matt-black-500/20 bg-matt-black-200/20 px-3 pb-3 pt-8 sm:gap-1.5">
              {dynamicChartData.map((item, index) => {
                const heightPercent = Math.max(Math.min((item.amount / maxAmount) * 100, 100), 2);
                const formattedAmount = `$${item.amount.toLocaleString()}`;
                const isSelected = selectedDates.has(item.date);
                const allSelected = selectedDates.size === dynamicChartData.length;
                const noneSelected = selectedDates.size === 0;

                const tooltipTitle = `${isSelected ? "✓ " : ""}${item.date}: ${formattedAmount} · ${item.ordersCount ?? 0} orders`;

                return (
                  <div
                    key={`${item.date}-${index}`}
                    onClick={() => toggleBar(item)}
                    className={`group relative flex-1 rounded-t-md transition-all duration-300 cursor-pointer ${isSelected
                      ? allSelected
                        ? "bg-sunflower-100 opacity-90 hover:opacity-100"
                        : "bg-sunflower-100 opacity-100 scale-[1.03]"
                      : noneSelected
                        ? "bg-munsell-blue-100/20 opacity-85 hover:opacity-100 hover:bg-munsell-blue-100/40"
                        : "bg-munsell-blue-100/15 opacity-35 hover:opacity-60 hover:bg-munsell-blue-100/30"
                      }`}
                    style={{ height: `${heightPercent}%` }}
                    title={tooltipTitle}
                  />
                );
              })}
            </div>

            <div className="mt-3 flex justify-between px-1 text-[10px] font-medium uppercase tracking-wider text-matt-black-400">
              <span>{dynamicChartData[0]?.date || ""}</span>
              <span>{dynamicChartData[Math.floor(dynamicChartData.length / 4)]?.date || ""}</span>
              <span>{dynamicChartData[Math.floor(dynamicChartData.length / 2)]?.date || ""}</span>
              <span>{dynamicChartData[Math.floor(dynamicChartData.length * 3 / 4)]?.date || ""}</span>
              <span>{dynamicChartData[dynamicChartData.length - 1]?.date || "Today"}</span>
            </div>
          </div>

          {/* Selection indicator */}
          <div className="mt-6 flex items-center justify-between border-t border-matt-black-500/20 pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-matt-black-300">
              {selectedDates.size === dynamicChartData.length
                ? `Full ${Period} selected`
                : selectedDates.size === 0
                  ? `No selection — click bars to filter`
                  : selectedDates.size === 1
                    ? `Showing: ${[...selectedDates][0]}`
                    : `${selectedDates.size} of ${dynamicChartData.length} days selected`}
            </span>
            <div className="flex gap-3">
              {selectedDates.size > 0 && selectedDates.size < dynamicChartData.length && (
                <button
                  onClick={() => setSelectedDates(new Set(dynamicChartData.map(d => d.date)))}
                  className="cursor-pointer text-[10px] font-bold text-munsell-blue-100 hover:text-munsell-blue-200 transition-colors uppercase tracking-wider"
                >
                  Select All
                </button>
              )}
              {selectedDates.size > 0 && (
                <button
                  onClick={() => setSelectedDates(new Set())}
                  className="cursor-pointer text-[10px] font-bold text-sunflower-100 hover:text-sunflower-200 transition-colors uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Revenue summary */}
          <div className="mt-4 grid grid-cols-1 divide-y divide-matt-black-500/20 border-t border-matt-black-500/20 pt-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <SummaryMetric
              label={hasSelection ? (selectedDates.size === 1 ? "Day's Revenue" : "Selected Revenue") : "Total Revenue"}
              value={hasSelection ? `Rs ${selectionRevenue.toLocaleString()}` : (data ? `Rs ${data.stats.totalRevenue.toLocaleString()}` : "Rs 0")}
              valueClass="text-sunflower-100"
            />

            <SummaryMetric
              label={hasSelection ? (selectedDates.size === 1 ? "Day's AOV" : "Selection AOV") : "Average Order Value"}
              value={hasSelection ? `Rs ${selectionAov.toFixed(2)}` : (data ? `Rs ${data.stats.averageOrderValue.toFixed(2)}` : "Rs 0.00")}
              valueClass="text-munsell-blue-100"
            />

            <SummaryMetric
              label={hasSelection ? (selectedDates.size === 1 ? "Day's Orders" : "Total Orders") : "Conversion Rate"}
              value={hasSelection ? `${selectionOrders} orders` : (data ? `${data.stats.conversionRate.toFixed(1)}%` : "0.0%")}
              valueClass="text-pablano-100"
            />
          </div>
        </div>

        {/* Live activity */}
        <div className="rounded-2xl border border-matt-black-500/30 bg-matt-black-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-pablano-100">
                Real Time
              </p>

              <h2 className="mt-1 font-sora text-lg font-bold text-white-chalk-100">
                Live Activity
              </h2>

              <p className="mt-1 text-xs text-matt-black-300">
                Recent platform events
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pablano-100/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pablano-100 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pablano-100" />
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-1">
            {loading ? (
              <div className="text-center py-12 text-xs text-matt-black-300">
                Loading activities...
              </div>
            ) : !data?.activities || data.activities.length === 0 ? (
              <div className="text-center py-12 text-xs text-matt-black-300">
                No recent activity.
              </div>
            ) : (
              data.activities.map((activity, index) => {
                const { icon, variant } = getFeedItemProps(activity);
                return (
                  <FeedItem
                    key={index}
                    icon={icon}
                    variant={variant}
                    title={activity.title}
                    description={activity.desc}
                    time={formatTimeAgo(activity.time)}
                  />
                );
              })
            )}
          </div>

          <button className="mt-5 flex w-full items-center justify-center rounded-xl border border-munsell-blue-100/20 bg-munsell-blue-100/5 py-2.5 text-xs font-bold text-munsell-blue-100 transition hover:bg-munsell-blue-100 hover:text-white-chalk-100">
            View All Events
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Pending approvals and platform health */}
      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-3">
        {/* Approvals */}
        <div className="overflow-hidden rounded-2xl border border-matt-black-500/30 bg-matt-black-100 shadow-sm 2xl:col-span-2">
          <div className="flex flex-col gap-4 border-b border-matt-black-500/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sunflower-100">
                Action Required
              </p>

              <h2 className="mt-1 font-sora text-lg font-bold text-white-chalk-100">
                Pending Approvals
              </h2>

              <p className="mt-1 text-xs text-matt-black-300">
                Seller applications and product submissions
              </p>
            </div>

            <button className="rounded-xl cursor-pointer bg-matt-black-200 px-4 py-2.5 text-xs font-bold text-white-chalk-100 transition hover:bg-matt-black-300/50">
              Review All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-170 w-full">
              <thead className="bg-matt-black-200">
                <tr>
                  <TableHeader>Entity</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Submitted</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right">Action</TableHeader>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-matt-black-300 sm:px-6">
                      Loading approvals...
                    </td>
                  </tr>
                ) : !data?.pendingApprovalsList || data.pendingApprovalsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-xs text-matt-black-300 sm:px-6">
                      No pending approvals.
                    </td>
                  </tr>
                ) : (
                  data.pendingApprovalsList.map((row, index) => (
                    <tr
                      key={`${row.name}-${index}`}
                      className="border-t border-matt-black-500/15 transition hover:bg-sunflower-100/5"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-white-chalk-100 sm:px-6">
                        {row.name}
                      </td>

                      <td className="px-5 py-4 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${row.type === "Seller"
                            ? "bg-munsell-blue-100/10 text-munsell-blue-100"
                            : "bg-pablano-100/10 text-pablano-100"
                            }`}
                        >
                          {row.type}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs font-medium text-matt-black-300 sm:px-6">
                        {formatTimeAgo(row.submitted)} ago
                      </td>

                      <td className="px-5 py-4 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${row.status === "PENDING"
                            ? "bg-sunflower-100/15 text-sunflower-100"
                            : "bg-cadmium-red-100/10 text-cadmium-red-100"
                            }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right sm:px-6">
                        <button className="cursor-pointer text-xs font-bold text-munsell-blue-100 transition hover:text-munsell-blue-200">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform health */}
        <div className="flex flex-col rounded-2xl border border-matt-black-500/30 bg-matt-black-100 p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pablano-100">
              System Status
            </p>

            <h2 className="mt-1 font-sora text-lg font-bold text-white-chalk-100">
              Platform Health
            </h2>

            <p className="mt-1 text-xs text-matt-black-300">
              System and business performance signals
            </p>
          </div>

          <div className="mt-7 space-y-5">
            <HealthMetric
              label="API Response Time"
              value={data?.health.apiResponseTime ?? "128ms"}
              percentage={85}
              variant="success"
            />

            <HealthMetric
              label="Seller Fill Rate"
              value={data?.health.sellerFillRate ?? "96.4%"}
              percentage={94}
              variant="info"
            />

            <HealthMetric
              label="Order Fulfillment"
              value={data?.health.orderFulfillment ?? "99.1%"}
              percentage={99}
              variant="warning"
            />

            <HealthMetric
              label="Return Rate"
              value={data?.health.returnRate ?? "1.8%"}
              percentage={20}
              variant="danger"
            />
          </div>

          <div className="mt-auto pt-7">
            <div className="rounded-2xl border border-pablano-100/15 bg-pablano-100/5 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pablano-100/10">
                  <Activity className="h-4 w-4 text-pablano-100" />
                </div>

                <div>
                  <p className="text-xs font-bold text-pablano-100">
                    All Services Operational
                  </p>

                  <p className="mt-0.5 text-[11px] text-pablano-200">
                    Last checked 30 seconds ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="px-4 py-4 text-center first:pl-0 last:pr-0">
      <p className="text-[11px] font-medium text-matt-black-300">
        {label}
      </p>

      <p className={`mt-1 text-xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function FeedItem({
  icon: Icon,
  variant,
  title,
  description,
  time,
}: {
  icon: ElementType;
  variant: "success" | "info" | "warning" | "danger";
  title: string;
  description: string;
  time: string;
}) {
  const styles = {
    success: "bg-pablano-100/10 text-pablano-100",
    info: "bg-munsell-blue-100/10 text-munsell-blue-100",
    warning: "bg-sunflower-100/15 text-sunflower-100",
    danger: "bg-cadmium-red-100/10 text-cadmium-red-100",
  };

  return (
    <div className="group flex gap-3 rounded-xl p-3 transition hover:bg-matt-black-200">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[variant]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white-chalk-100">
          {title}
        </p>

        <p className="mt-1 truncate text-[11px] leading-4 text-matt-black-300">
          {description}
        </p>
      </div>

      <span className="pt-0.5 text-[10px] font-medium text-matt-black-400">
        {time}
      </span>
    </div>
  );
}

function TableHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-matt-black-400 sm:px-6 ${className}`}
    >
      {children}
    </th>
  );
}

function HealthMetric({
  label,
  value,
  percentage,
  variant,
}: {
  label: string;
  value: string;
  percentage: number;
  variant: "success" | "info" | "warning" | "danger";
}) {
  const styles = {
    success: {
      text: "text-pablano-100",
      bar: "bg-pablano-100",
    },
    info: {
      text: "text-munsell-blue-100",
      bar: "bg-munsell-blue-100",
    },
    warning: {
      text: "text-sunflower-100",
      bar: "bg-sunflower-100",
    },
    danger: {
      text: "text-cadmium-red-100",
      bar: "bg-cadmium-red-100",
    },
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-medium text-matt-black-300">
          {label}
        </span>

        <span className={`text-xs font-bold ${styles[variant].text}`}>
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white-chalk-200">
        <div
          className={`h-full rounded-full ${styles[variant].bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
