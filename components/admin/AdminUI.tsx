"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon, Search, RotateCw, ChevronLeft, ChevronRight, X } from "lucide-react";

// ============================================================
// PAGE HEADER
// ============================================================
export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AdminPageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-white-chalk-100/40 mb-1.5 font-medium">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-sunflower-100 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white-chalk-100/70">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-sora text-white-chalk-100 tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20">
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-white-chalk-100/60 mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

// ============================================================
// STAT CARDS
// ============================================================
export interface AdminStatProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  variant?: "gold" | "blue" | "green" | "red" | "purple";
}

export function AdminStatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "gold",
}: AdminStatProps) {
  const colorMap = {
    gold: {
      border: "border-sunflower-100/20",
      bg: "bg-sunflower-100/10",
      text: "text-sunflower-100",
      glow: "hover:border-sunflower-100/40",
    },
    blue: {
      border: "border-munsell-blue-100/20",
      bg: "bg-munsell-blue-100/10",
      text: "text-munsell-blue-100",
      glow: "hover:border-munsell-blue-100/40",
    },
    green: {
      border: "border-pablano-100/20",
      bg: "bg-pablano-100/10",
      text: "text-pablano-200",
      glow: "hover:border-pablano-100/40",
    },
    red: {
      border: "border-cadmium-red-100/20",
      bg: "bg-cadmium-red-100/10",
      text: "text-cadmium-red-200",
      glow: "hover:border-cadmium-red-100/40",
    },
    purple: {
      border: "border-purple-500/20",
      bg: "bg-purple-500/10",
      text: "text-purple-300",
      glow: "hover:border-purple-500/40",
    },
  };

  const scheme = colorMap[variant] || colorMap.gold;

  return (
    <div
      className={`rounded-2xl border ${scheme.border} ${scheme.glow} bg-matt-black-100/80 backdrop-blur-md p-5 transition-all duration-200 shadow-lg shadow-black/20 flex items-center justify-between gap-4`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white-chalk-100/50">
          {label}
        </p>
        <p className="text-2xl font-bold font-sora text-white-chalk-100 mt-1.5 tracking-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-[11px] text-white-chalk-100/40 mt-1 font-medium">
            {subtext}
          </p>
        )}
      </div>

      {Icon && (
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${scheme.border} ${scheme.bg} ${scheme.text}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// BADGES
// ============================================================
export interface AdminBadgeProps {
  status?: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  label?: string;
  children?: ReactNode;
}

export function AdminBadge({ status, variant, label, children }: AdminBadgeProps) {
  const text = children || label || status || "Unknown";
  const normalized = (typeof children === "string" ? children : status || label || "").toUpperCase();

  let autoVariant = variant;
  if (!autoVariant) {
    if (
      ["ACTIVE", "APPROVED", "VERIFIED", "COMPLETED", "PAID", "DELIVERED", "PUBLISHED"].includes(
        normalized
      )
    ) {
      autoVariant = "success";
    } else if (
      ["PENDING", "PENDING_REVIEW", "SUBMITTED", "UNDER_REVIEW", "PROCESSING"].includes(
        normalized
      )
    ) {
      autoVariant = "warning";
    } else if (
      ["REJECTED", "SUSPENDED", "CANCELLED", "FAILED", "DELETED", "ARCHIVED"].includes(
        normalized
      )
    ) {
      autoVariant = "danger";
    } else if (
      ["DRAFT", "INACTIVE", "UNVERIFIED", "REFURBISHED"].includes(normalized)
    ) {
      autoVariant = "neutral";
    } else {
      autoVariant = "info";
    }
  }

  const styles = {
    success:
      "bg-pablano-100/15 text-pablano-200 border-pablano-100/30",
    warning:
      "bg-sunflower-100/15 text-sunflower-100 border-sunflower-100/30",
    danger:
      "bg-cadmium-red-100/15 text-cadmium-red-200 border-cadmium-red-100/30",
    info:
      "bg-munsell-blue-100/15 text-munsell-blue-200 border-munsell-blue-100/30",
    neutral:
      "bg-white-chalk-100/10 text-white-chalk-100/60 border-white-chalk-100/15",
    purple:
      "bg-purple-500/15 text-purple-300 border-purple-500/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[autoVariant] || styles.neutral
        }`}
    >
      {text}
    </span>
  );
}

// ============================================================
// SEARCH & FILTER BAR
// ============================================================
export interface AdminFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: Array<{ label: string; value: string }>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  extraFilters?: ReactNode;
}

export function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search records...",
  statusFilter,
  onStatusChange,
  statusOptions,
  onRefresh,
  isRefreshing,
  extraFilters,
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-matt-black-100/90 border border-white-chalk-100/10 p-3 rounded-2xl shadow-sm">
      <div className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-white-chalk-100/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-matt-black-200/50 border border-white-chalk-100/10 focus:border-sunflower-100/50 text-white-chalk-100 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition placeholder:text-white-chalk-100/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {statusOptions && onStatusChange && (
          <select
            value={statusFilter || ""}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-sunflower-100/50 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {extraFilters}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-white-chalk-100/10 bg-matt-black-200/40 text-white-chalk-100/60 hover:text-sunflower-100 hover:border-sunflower-100/30 transition cursor-pointer"
            title="Refresh data"
          >
            <RotateCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-sunflower-100" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TABLE WRAPPER
// ============================================================
export interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  colSpan?: number;
}

export function AdminTable({
  headers,
  children,
  loading,
  isEmpty,
  emptyMessage = "No records found matching your filters.",
  colSpan = 5,
}: AdminTableProps) {
  return (
    <div className="bg-matt-black-100 rounded-2xl border border-white-chalk-100/10 overflow-hidden shadow-xl shadow-black/20">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-matt-black-200/80 border-b border-white-chalk-100/10">
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  className="px-5 py-3.5 font-bold uppercase tracking-wider text-[10px] text-white-chalk-100/50"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white-chalk-100/5">
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-sunflower-100/30 border-t-sunflower-100 rounded-full animate-spin" />
                    <span className="text-white-chalk-100/50 font-medium">
                      Loading data...
                    </span>
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-5 py-16 text-center text-white-chalk-100/40"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// PAGINATION
// ============================================================
export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (newPage: number) => void;
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-2 text-xs text-white-chalk-100/60">
      <div>
        {totalItems !== undefined && (
          <span>
            Total: <strong className="text-white-chalk-100">{totalItems}</strong> records
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="mr-2">
          Page <strong className="text-white-chalk-100">{page}</strong> of{" "}
          <strong className="text-white-chalk-100">{Math.max(1, totalPages)}</strong>
        </span>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-white-chalk-100/10 bg-matt-black-200/50 text-white-chalk-100/70 hover:text-white-chalk-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-white-chalk-100/10 bg-matt-black-200/50 text-white-chalk-100/70 hover:text-white-chalk-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MODAL DIALOG
// ============================================================
export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "md",
}: AdminModalProps) {
  if (!isOpen) return null;

  const maxW = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
    "4xl": "max-w-6xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full ${maxW} bg-matt-black-100 border border-sunflower-100/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white-chalk-100/10">
          <h3 className="font-sora text-base font-bold text-white-chalk-100">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white-chalk-100/40 hover:text-white-chalk-100 hover:bg-white-chalk-100/5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-sm text-white-chalk-100/80">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-white-chalk-100/10 bg-matt-black-200/40 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
