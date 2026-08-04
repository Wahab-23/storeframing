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

const overviewMetrics = [
  {
    label: "Total GMV",
    value: "$1.24M",
    change: "+8.3% this month",
    tone: "success",
    icon: TrendingUp,
  },
  {
    label: "Pending Approvals",
    value: "17",
    change: "Neutral",
    tone: "info",
    icon: Store,
  },
  {
    label: "Platform Uptime",
    value: "99.97%",
    change: "30-day average",
    tone: "warning",
    icon: Zap,
  },
  {
    label: "Open Disputes",
    value: "3",
    change: "2 fewer than yesterday",
    tone: "danger",
    icon: ShoppingBag,
  },
];

const chartData = [
  40, 65, 48, 72, 55, 80, 68, 90, 74, 95, 82, 78, 85, 92, 70, 88,
  76, 98, 84, 96, 79, 91, 87, 100, 83, 94, 88, 96, 90, 98,
];

const pendingApprovals = [
  {
    name: "TechGadgets Inc.",
    type: "Seller",
    submitted: "2 hours ago",
    status: "PENDING",
  },
  {
    name: "Wireless Earbuds Pro",
    type: "Product",
    submitted: "4 hours ago",
    status: "REVIEW",
  },
  {
    name: "Fashion Nova PK",
    type: "Seller",
    submitted: "6 hours ago",
    status: "PENDING",
  },
  {
    name: "Organic Cotton Tee",
    type: "Product",
    submitted: "1 day ago",
    status: "REVIEW",
  },
  {
    name: "HomeDecor Studio",
    type: "Seller",
    submitted: "2 days ago",
    status: "PENDING",
  },
];


export default function AdminDashboard() {
  const [Period, setPeriod] = useState("week");
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
                    PLATFORM LIVE
                  </span>
                </div>

                <h1 className="font-sora text-2xl font-bold tracking-tight text-white-chalk-100 sm:text-3xl">
                  iShopping Marketplace
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white-chalk-100/55">
                  You have{" "}
                  <span className="font-semibold text-sunflower-100">
                    {pendingApprovals.filter((approval) => approval.status === "PENDING").length} seller applications
                  </span>{" "}
                  and{" "}
                  <span className="font-semibold text-munsell-blue-200">
                    {pendingApprovals.filter((approval) => approval.status === "REVIEW").length} products
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
            {overviewMetrics.map((metric, index) => (
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
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none ${item === Period
                    ? "bg-sunflower-100 text-matt-black-100 shadow-sm"
                    : "text-matt-black-300 hover:bg-matt-black-100 hover:text-white-chalk-100"
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
            <div className="flex h-56 items-end gap-1 rounded-2xl border border-matt-black-500/20 bg-white-chalk-300 px-3 pb-3 pt-8 sm:gap-1.5">
              {chartData.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className={`group relative flex-1 rounded-t-md transition-all duration-200 hover:opacity-100 ${index === chartData.length - 1
                    ? "bg-sunflower-100"
                    : index >= chartData.length - 4
                      ? "bg-sunflower-200"
                      : "bg-munsell-blue-100/20 hover:bg-munsell-blue-100/50"
                    }`}
                  style={{ height: `${height}%` }}
                  title={`Day ${index + 1}: ${height}%`}
                />
              ))}
            </div>

            <div className="mt-3 flex justify-between px-1 text-[10px] font-medium uppercase tracking-wider text-matt-black-400">
              <span>Jul 01</span>
              <span>Jul 08</span>
              <span>Jul 15</span>
              <span>Jul 22</span>
              <span>Today</span>
            </div>
          </div>

          {/* Revenue summary */}
          <div className="mt-6 grid grid-cols-1 divide-y divide-matt-black-500/20 border-t border-matt-black-500/20 pt-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <SummaryMetric
              label="Total Revenue"
              value="$24,500"
              valueClass="text-sunflower-100"
            />

            <SummaryMetric
              label="Average Order Value"
              value="$71.60"
              valueClass="text-munsell-blue-100"
            />

            <SummaryMetric
              label="Conversion Rate"
              value="3.4%"
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
            <FeedItem
              icon={CheckCircle2}
              variant="success"
              title="Seller Approved"
              description="TechGadgets Inc. was verified and onboarded."
              time="10m"
            />

            <FeedItem
              icon={Package}
              variant="info"
              title="New Product Submission"
              description="Wireless Earbuds Pro is awaiting review."
              time="1h"
            />

            <FeedItem
              icon={ShoppingBag}
              variant="warning"
              title="High-Value Order"
              description="Order #4920 generated $1,200 in GMV."
              time="2h"
            />

            <FeedItem
              icon={AlertTriangle}
              variant="danger"
              title="Dispute Raised"
              description="A refund dispute was opened for order #4891."
              time="3h"
            />

            <FeedItem
              icon={Users}
              variant="info"
              title="Customer Milestone"
              description="50 new customers joined the marketplace."
              time="5h"
            />

            <FeedItem
              icon={Zap}
              variant="success"
              title="Commission Updated"
              description="Electronics commission was updated to 8%."
              time="6h"
            />
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
        <div className="overflow-hidden rounded-2xl border border-matt-black-500/30 bg-white-chalk-500 shadow-sm 2xl:col-span-2">
          <div className="flex flex-col gap-4 border-b border-matt-black-500/20 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sunflower-100">
                Action Required
              </p>

              <h2 className="mt-1 font-sora text-lg font-bold text-matt-black-100">
                Pending Approvals
              </h2>

              <p className="mt-1 text-xs text-matt-black-300">
                Seller applications and product submissions
              </p>
            </div>

            <button className="rounded-xl bg-matt-black-100 px-4 py-2.5 text-xs font-bold text-white-chalk-100 transition hover:bg-matt-black-200">
              Review All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full">
              <thead className="bg-white-chalk-300">
                <tr>
                  <TableHeader>Entity</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Submitted</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader className="text-right">Action</TableHeader>
                </tr>
              </thead>

              <tbody>
                {pendingApprovals.map((row) => (
                  <tr
                    key={row.name}
                    className="border-t border-matt-black-500/15 transition hover:bg-sunflower-100/5"
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-matt-black-100 sm:px-6">
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
                      {row.submitted}
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
                      <button className="text-xs font-bold text-munsell-blue-100 transition hover:text-munsell-blue-200">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform health */}
        <div className="flex flex-col rounded-2xl border border-matt-black-500/30 bg-white-chalk-500 p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-pablano-100">
              System Status
            </p>

            <h2 className="mt-1 font-sora text-lg font-bold text-matt-black-100">
              Platform Health
            </h2>

            <p className="mt-1 text-xs text-matt-black-300">
              System and business performance signals
            </p>
          </div>

          <div className="mt-7 space-y-5">
            <HealthMetric
              label="API Response Time"
              value="142ms"
              percentage={85}
              variant="success"
            />

            <HealthMetric
              label="Seller Fill Rate"
              value="94.2%"
              percentage={94}
              variant="info"
            />

            <HealthMetric
              label="Order Fulfillment"
              value="98.6%"
              percentage={99}
              variant="warning"
            />

            <HealthMetric
              label="Return Rate"
              value="2.1%"
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
    <div className="group flex gap-3 rounded-xl p-3 transition hover:bg-white-chalk-200">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[variant]}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-matt-black-100">
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
