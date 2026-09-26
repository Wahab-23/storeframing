"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  User,
  ChevronDown,
  ChevronRight,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Tag,
  ImageIcon,
  FileText,
  Boxes,
  Globe,
  Sliders,
  Eye,
  Check,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface RevisionItem {
  id: string;
  revisionNumber: number;
  status: string;
  summary: string | null;
  payload: any;
  createdAt: string;
  publishedAt: string | null;
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface ProductRevisionTimelineProps {
  revisions: RevisionItem[];
  currentProduct?: any;
  className?: string;
}

interface FieldDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  type?: "text" | "badge" | "list" | "images" | "number" | "description";
}

/**
 * Normalizes payload object, extracting snapshot if nested
 */
function getPayloadData(payload: any): any {
  if (!payload || typeof payload !== "object") return {};
  if (payload.snapshot && typeof payload.snapshot === "object") {
    return { ...payload.snapshot, ...payload };
  }
  return payload;
}

/**
 * Computes difference between two revision payloads if not pre-computed
 */
function computeDiff(currentPayload: any, prevPayload: any): FieldDiff[] {
  const current = getPayloadData(currentPayload);
  const prev = getPayloadData(prevPayload);

  // If revision explicitly contains pre-computed changes, use them
  if (Array.isArray(currentPayload?.changes) && currentPayload.changes.length > 0) {
    return currentPayload.changes;
  }

  const diffs: FieldDiff[] = [];

  // Helper comparison
  const check = (
    field: string,
    label: string,
    type: FieldDiff["type"] = "text",
    formatter?: (val: any) => any
  ) => {
    const valCurr = current[field];
    const valPrev = prev[field];

    if (valCurr !== undefined && valPrev !== undefined && valCurr !== valPrev) {
      diffs.push({
        field,
        label,
        oldValue: formatter ? formatter(valPrev) : valPrev,
        newValue: formatter ? formatter(valCurr) : valCurr,
        type,
      });
    } else if (valCurr !== undefined && valPrev === undefined) {
      diffs.push({
        field,
        label,
        oldValue: "None",
        newValue: formatter ? formatter(valCurr) : valCurr,
        type,
      });
    }
  };

  check("name", "Product Name", "text");
  check("slug", "Slug / URL Key", "text");
  check("status", "Catalog Status", "badge");
  check("visibility", "Store Visibility", "badge");
  check("ownershipType", "Ownership Type", "badge");
  check("brandId", "Brand ID", "text");
  check("brandName", "Brand", "text");
  check("modelNumber", "Model Number", "text");
  check("manufacturer", "Manufacturer", "text");
  check("countryOfOrigin", "Country of Origin", "text");
  check("weight", "Weight (kg)", "number");
  check("shortDescription", "Short Description", "text");

  // Descriptions (trimmed preview)
  if (current.description !== undefined && prev.description !== undefined && current.description !== prev.description) {
    diffs.push({
      field: "description",
      label: "Full Description",
      oldValue: prev.description ? `${prev.description.slice(0, 80)}...` : "Empty",
      newValue: current.description ? `${current.description.slice(0, 80)}...` : "Empty",
      type: "description",
    });
  }

  // Categories comparison
  const currCats = Array.isArray(current.categories)
    ? current.categories.map((c: any) => (typeof c === "string" ? c : c.name || c.id))
    : [];
  const prevCats = Array.isArray(prev.categories)
    ? prev.categories.map((c: any) => (typeof c === "string" ? c : c.name || c.id))
    : [];
  if (JSON.stringify(currCats.sort()) !== JSON.stringify(prevCats.sort()) && currCats.length + prevCats.length > 0) {
    diffs.push({
      field: "categories",
      label: "Categories",
      oldValue: prevCats,
      newValue: currCats,
      type: "list",
    });
  }

  // Images comparison
  const currImgs = Array.isArray(current.images) ? current.images : [];
  const prevImgs = Array.isArray(prev.images) ? prev.images : [];
  if (currImgs.length > 0 || prevImgs.length > 0) {
    const currUrls = currImgs.map((i: any) => (typeof i === "string" ? i : i.url)).sort();
    const prevUrls = prevImgs.map((i: any) => (typeof i === "string" ? i : i.url)).sort();
    if (JSON.stringify(currUrls) !== JSON.stringify(prevUrls)) {
      diffs.push({
        field: "images",
        label: "Product Images",
        oldValue: prevImgs,
        newValue: currImgs,
        type: "images",
      });
    }
  }

  return diffs;
}

export function ProductRevisionTimeline({
  revisions = [],
  currentProduct,
  className,
}: ProductRevisionTimelineProps) {
  // Currently expanded revision card
  const [expandedRevId, setExpandedRevId] = useState<string | null>(
    revisions[0]?.id || null
  );



  // Toggle card expansion
  const toggleExpand = (id: string) => {
    setExpandedRevId((prev) => (prev === id ? null : id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            {status}
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white-chalk-100/10 text-white-chalk-100/70 border border-white-chalk-100/20">
            <Clock className="w-2.5 h-2.5" />
            DRAFT
          </span>
        );
      case "PENDING_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            PENDING
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cadmium-red-100/10 text-cadmium-red-200 border border-cadmium-red-100/20">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white-chalk-100/10 text-white-chalk-100/60 border border-white-chalk-100/20">
            {status}
          </span>
        );
    }
  };

  if (revisions.length === 0) {
    return (
      <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-8 text-center space-y-2">
        <History className="w-8 h-8 text-white-chalk-100/20 mx-auto" />
        <h4 className="text-sm font-semibold text-white-chalk-100">No Revisions Recorded</h4>
        <p className="text-xs text-white-chalk-100/40 max-w-sm mx-auto">
          Revision snapshots are created automatically every time product details or catalog settings are updated.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Counter and Quick Compare Tool */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white-chalk-100/10 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sunflower-100" />
          <h3 className="font-sora text-sm font-bold text-white-chalk-100">
            Product Revision Snapshots ({revisions.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white-chalk-100/40 hidden sm:inline">
            Chronological audit of catalog changes
          </span>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="relative border-l-2 border-white-chalk-100/10 ml-4 sm:ml-6 space-y-4 py-2">
        {revisions.map((rev, idx) => {
          const isExpanded = expandedRevId === rev.id;
          const prevRev = revisions[idx + 1] || null;
          const diffs = computeDiff(rev.payload, prevRev?.payload);

          return (
            <div key={rev.id} className="relative pl-6 sm:pl-8 group">
              {/* Timeline dot */}
              <div
                className={cn(
                  "absolute -left-[9px] top-4 w-4 h-4 rounded-full border-2 border-matt-black-100 transition-transform shadow-md",
                  idx === 0
                    ? "bg-sunflower-100 ring-2 ring-sunflower-100/30 scale-110"
                    : "bg-white-chalk-100/40 group-hover:bg-sunflower-100"
                )}
              />

              {/* Card */}
              <div
                className={cn(
                  "bg-matt-black-200/50 border rounded-2xl transition-all overflow-hidden shadow-sm",
                  isExpanded
                    ? "border-sunflower-100/40 shadow-lg shadow-black/40 ring-1 ring-sunflower-100/20"
                    : "border-white-chalk-100/10 hover:border-white-chalk-100/25"
                )}
              >
                {/* Clickable Header */}
                <div
                  onClick={() => toggleExpand(rev.id)}
                  className="p-4 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-matt-black-200/40 hover:bg-matt-black-200/70 transition"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sora text-xs font-bold text-white-chalk-100 flex items-center gap-1.5">
                        Revision #{rev.revisionNumber}
                        {idx === 0 && (
                          <span className="text-[9px] font-mono font-bold bg-sunflower-100 text-matt-black-100 px-1.5 py-0.5 rounded shadow-xs">
                            LATEST
                          </span>
                        )}
                      </span>

                      {getStatusBadge(rev.status)}

                      <span className="text-[11px] font-mono text-white-chalk-100/40">
                        {new Date(rev.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-white-chalk-100/80 font-medium">
                      {rev.summary || (idx === revisions.length - 1 ? "Initial product creation in catalog" : "Product update applied")}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-white-chalk-100/50 pt-0.5">
                      <User className="w-3 h-3 text-sunflower-100/70" />
                      <span>
                        {rev.createdBy
                          ? `${rev.createdBy.firstName || ""} ${rev.createdBy.lastName || ""} (${rev.createdBy.email})`
                          : "Admin Staff"}
                      </span>
                    </div>
                  </div>

                  {/* Right side: Pills count & expand toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {diffs.length > 0 ? (
                      <span className="text-[10px] font-mono font-bold bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/20 px-2 py-0.5 rounded-full">
                        {diffs.length} change{diffs.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-white-chalk-100/40 bg-white-chalk-100/5 px-2 py-0.5 rounded-full">
                        Baseline snapshot
                      </span>
                    )}

                    <div className="p-1 rounded-lg text-white-chalk-100/40 hover:text-white-chalk-100">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-sunflower-100" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-white-chalk-100/10 p-4 space-y-4 bg-matt-black-300/30 animate-in fade-in-50 duration-200">
                      <div className="space-y-3">
                        {diffs.length === 0 ? (
                          <div className="p-4 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/10 text-center space-y-1">
                            <p className="text-xs text-white-chalk-100/70 font-medium">
                              {prevRev
                                ? "No discrete field delta recorded against previous snapshot."
                                : "Initial baseline snapshot for this product."}
                            </p>
                            <p className="text-[11px] text-white-chalk-100/40">
                              Switch to &ldquo;Full Snapshot&rdquo; above to inspect the complete saved state at this revision.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {diffs.map((diff, dIdx) => (
                              <div
                                key={dIdx}
                                className="p-3 rounded-xl bg-matt-black-200/60 border border-white-chalk-100/10 space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sunflower-100 flex items-center gap-1.5">
                                    <Tag className="w-3 h-3 text-sunflower-100/70" />
                                    {diff.label}
                                  </span>
                                  <span className="text-[10px] font-mono text-white-chalk-100/40 uppercase">
                                    {diff.field}
                                  </span>
                                </div>

                                {/* Custom Rendering based on type */}
                                {diff.type === "images" ? (
                                  /* Images Diff */
                                  <div className="space-y-2 pt-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                                      <div className="space-y-1.5 p-2 rounded-lg bg-cadmium-red-100/5 border border-cadmium-red-100/15">
                                        <span className="text-[10px] font-bold text-cadmium-red-200 uppercase tracking-wide">
                                          Previous Gallery ({Array.isArray(diff.oldValue) ? diff.oldValue.length : 0})
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {Array.isArray(diff.oldValue) && diff.oldValue.length > 0 ? (
                                            diff.oldValue.map((img: any, i: number) => (
                                              <div key={i} className="relative w-12 h-12 rounded-md overflow-hidden bg-black/40 border border-white-chalk-100/10">
                                                <img
                                                  src={typeof img === "string" ? img : img.url}
                                                  alt="Old"
                                                  className="w-full h-full object-cover opacity-60"
                                                />
                                              </div>
                                            ))
                                          ) : (
                                            <span className="text-[10px] text-white-chalk-100/40 italic">None</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-1.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                                          Updated Gallery ({Array.isArray(diff.newValue) ? diff.newValue.length : 0})
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                          {Array.isArray(diff.newValue) && diff.newValue.length > 0 ? (
                                            diff.newValue.map((img: any, i: number) => (
                                              <div key={i} className="relative w-12 h-12 rounded-md overflow-hidden bg-black/40 border border-emerald-500/30">
                                                <img
                                                  src={typeof img === "string" ? img : img.url}
                                                  alt="New"
                                                  className="w-full h-full object-cover"
                                                />
                                                {img.isPrimary && (
                                                  <span className="absolute bottom-0 inset-x-0 bg-sunflower-100 text-matt-black-100 text-[8px] font-extrabold text-center">
                                                    COVER
                                                  </span>
                                                )}
                                              </div>
                                            ))
                                          ) : (
                                            <span className="text-[10px] text-white-chalk-100/40 italic">None</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : diff.type === "list" ? (
                                  /* List / Categories Diff */
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                                    <div className="p-2 rounded-lg bg-cadmium-red-100/5 border border-cadmium-red-100/15 space-y-1">
                                      <span className="text-[10px] font-bold text-cadmium-red-200">
                                        Previous:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {Array.isArray(diff.oldValue) && diff.oldValue.length > 0 ? (
                                          diff.oldValue.map((item: any, i: number) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-cadmium-red-100/15 text-cadmium-red-200 text-[10px] line-through">
                                              {String(item)}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-[10px] text-white-chalk-100/40 italic">None</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-1">
                                      <span className="text-[10px] font-bold text-emerald-400">
                                        Updated:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {Array.isArray(diff.newValue) && diff.newValue.length > 0 ? (
                                          diff.newValue.map((item: any, i: number) => (
                                            <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-medium flex items-center gap-1">
                                              <Plus className="w-2.5 h-2.5 text-emerald-400" />
                                              {String(item)}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-[10px] text-white-chalk-100/40 italic">None</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* Text / Badge / Standard Diff */
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                    <div className="p-2 rounded-lg bg-cadmium-red-100/5 border border-cadmium-red-100/15 flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-cadmium-red-200 uppercase tracking-wide">
                                        Before
                                      </span>
                                      <span className="text-white-chalk-100/70 line-through break-words font-mono text-[11px]">
                                        {diff.oldValue !== null && diff.oldValue !== undefined && diff.oldValue !== ""
                                          ? String(diff.oldValue)
                                          : "(empty)"}
                                      </span>
                                    </div>

                                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex flex-col gap-0.5">
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
                                        After
                                      </span>
                                      <span className="text-emerald-300 font-semibold break-words font-mono text-[11px]">
                                        {diff.newValue !== null && diff.newValue !== undefined && diff.newValue !== ""
                                          ? String(diff.newValue)
                                          : "(empty)"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
