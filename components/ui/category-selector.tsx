"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Folder,
  FolderOpen,
  X,
  Layers,
  Loader2,
  FolderTree,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CategoryParentRef {
  id: string;
  name: string;
  slug?: string;
  parent?: CategoryParentRef | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  parent?: CategoryParentRef | null;
  _count?: {
    children?: number;
  };
  children?: CategoryItem[];
}

export interface CategorySelectorProps {
  selectedIds: string[];
  onChange: (newIds: string[]) => void;
  categories?: CategoryItem[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface NodeData {
  id: string;
  name: string;
  slug?: string;
  parentId: string | null;
  path: string[];
  fullPath: string;
  hasChildren: boolean;
  childrenCount?: number;
}

function extractParentPath(parentObj?: CategoryParentRef | null): string[] {
  if (!parentObj) return [];
  const higher = parentObj.parent ? extractParentPath(parentObj.parent) : [];
  return [...higher, parentObj.name];
}

const ROOT_PAGE_SIZE = 6;

export function CategorySelector({
  selectedIds = [],
  onChange,
  categories: initialCategories = [],
  label = "Taxonomy Categories",
  placeholder = "Search across 1,000+ categories (3+ chars)...",
  disabled = false,
  className,
}: CategorySelectorProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NodeData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Root level categories state (capped at 6 per page)
  const [rootCategories, setRootCategories] = useState<NodeData[]>([]);
  const [rootTotal, setRootTotal] = useState(0);
  const [rootPage, setRootPage] = useState(1);
  const [loadingRoots, setLoadingRoots] = useState(false);
  const [loadingMoreRoots, setLoadingMoreRoots] = useState(false);

  // Nested children map: parentId -> NodeData[]
  const [childrenMap, setChildrenMap] = useState<Map<string, NodeData[]>>(new Map());
  // Track which nodes are currently expanded
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});
  // Track which nodes are currently fetching their children
  const [loadingChildMap, setLoadingChildMap] = useState<Record<string, boolean>>({});

  // Global cache of category metadata for assigned tags & breadcrumbs
  const [categoryRegistry, setCategoryRegistry] = useState<Map<string, NodeData>>(new Map());

  // Helper to register category items in the registry
  const registerNodes = useCallback((items: NodeData[]) => {
    setCategoryRegistry((prev) => {
      const next = new Map(prev);
      items.forEach((item) => next.set(item.id, item));
      return next;
    });
  }, []);

  // Seed registry with initialCategories (from product details)
  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) return;

    const mapped: NodeData[] = initialCategories.map((c) => {
      const path = extractParentPath(c.parent);
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        parentId: c.parentId || c.parent?.id || null,
        path,
        fullPath: [...path, c.name].join(" > "),
        hasChildren: (c._count?.children ?? 0) > 0,
        childrenCount: c._count?.children,
      };
    });

    registerNodes(mapped);
  }, [initialCategories, registerNodes]);

  // Load root level categories (capped at ROOT_PAGE_SIZE = 6)
  useEffect(() => {
    let isMounted = true;
    setLoadingRoots(true);

    fetch(`/api/admin/categories?parentId=null&limit=${ROOT_PAGE_SIZE}&page=1`)
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        const list: CategoryItem[] = json.data?.categories || json.data || [];
        const total = json.data?.pagination?.total ?? list.length;
        setRootTotal(total);

        const mapped: NodeData[] = list.map((item) => {
          const path = extractParentPath(item.parent);
          const childCount = item._count?.children ?? 0;
          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            parentId: null,
            path,
            fullPath: item.name,
            hasChildren: childCount > 0,
            childrenCount: childCount,
          };
        });

        setRootCategories(mapped);
        registerNodes(mapped);
      })
      .catch((err) => {
        console.error("Failed to load root categories:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingRoots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [registerNodes]);

  // "See More" button handler for root categories
  const handleLoadMoreRoots = async () => {
    if (loadingMoreRoots) return;
    setLoadingMoreRoots(true);
    const nextPage = rootPage + 1;

    try {
      const res = await fetch(
        `/api/admin/categories?parentId=null&limit=${ROOT_PAGE_SIZE}&page=${nextPage}`
      );
      const json = await res.json();
      const list: CategoryItem[] = json.data?.categories || json.data || [];

      const mapped: NodeData[] = list.map((item) => {
        const path = extractParentPath(item.parent);
        const childCount = item._count?.children ?? 0;
        return {
          id: item.id,
          name: item.name,
          slug: item.slug,
          parentId: null,
          path,
          fullPath: item.name,
          hasChildren: childCount > 0,
          childrenCount: childCount,
        };
      });

      setRootCategories((prev) => [...prev, ...mapped]);
      registerNodes(mapped);
      setRootPage(nextPage);
    } catch (err) {
      console.error("Failed to load more root categories:", err);
    } finally {
      setLoadingMoreRoots(false);
    }
  };

  // Fetch nested children when user clicks bottom arrow on a category
  const toggleExpand = async (node: NodeData, e: React.MouseEvent) => {
    e.stopPropagation();

    const isCurrentlyExpanded = Boolean(expandedNodeIds[node.id]);

    if (isCurrentlyExpanded) {
      // Simply collapse
      setExpandedNodeIds((prev) => ({ ...prev, [node.id]: false }));
      return;
    }

    // Expanding
    setExpandedNodeIds((prev) => ({ ...prev, [node.id]: true }));

    // If children already fetched, do not re-fetch
    if (childrenMap.has(node.id)) {
      return;
    }

    // Fetch children from API
    setLoadingChildMap((prev) => ({ ...prev, [node.id]: true }));

    try {
      const res = await fetch(`/api/admin/categories?parentId=${node.id}&limit=50`);
      const json = await res.json();
      const list: CategoryItem[] = json.data?.categories || json.data || [];

      const currentPath = [...node.path, node.name];

      const mappedChildren: NodeData[] = list.map((child) => {
        const childCount = child._count?.children ?? 0;
        return {
          id: child.id,
          name: child.name,
          slug: child.slug,
          parentId: node.id,
          path: currentPath,
          fullPath: [...currentPath, child.name].join(" > "),
          hasChildren: childCount > 0,
          childrenCount: childCount,
        };
      });

      setChildrenMap((prev) => new Map(prev).set(node.id, mappedChildren));
      registerNodes(mappedChildren);
    } catch (err) {
      console.error(`Failed to fetch subcategories for ${node.name}:`, err);
    } finally {
      setLoadingChildMap((prev) => ({ ...prev, [node.id]: false }));
    }
  };

  // Debounced search when query >= 3 chars
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/categories?search=${encodeURIComponent(trimmed)}&limit=30`
        );
        const json = await res.json();
        const list: CategoryItem[] = json.data?.categories || json.data || [];

        const mapped: NodeData[] = list.map((item) => {
          const path = extractParentPath(item.parent);
          const childCount = item._count?.children ?? 0;
          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            parentId: item.parentId || item.parent?.id || null,
            path,
            fullPath: [...path, item.name].join(" > "),
            hasChildren: childCount > 0,
            childrenCount: childCount,
          };
        });

        setSearchResults(mapped);
        registerNodes(mapped);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, registerNodes]);

  // Selection toggle
  const toggleSelect = (node: NodeData) => {
    if (disabled) return;
    registerNodes([node]);

    if (selectedIds.includes(node.id)) {
      onChange(selectedIds.filter((id) => id !== node.id));
    } else {
      onChange([...selectedIds, node.id]);
    }
  };

  const removeAssigned = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedIds.filter((item) => item !== id));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  // Compute assigned list
  const assignedList = useMemo(() => {
    return selectedIds.map((id) => {
      const reg = categoryRegistry.get(id);
      return (
        reg || {
          id,
          name: `Category (${id.slice(0, 6)}...)`,
          slug: "",
          parentId: null,
          path: [],
          fullPath: `Category (${id.slice(0, 6)}...)`,
          hasChildren: false,
        }
      );
    });
  }, [selectedIds, categoryRegistry]);

  // Recursive component for a category node in the tree
  const renderCategoryRow = (node: NodeData, depth = 0) => {
    const isSelected = selectedIds.includes(node.id);
    const isExpanded = Boolean(expandedNodeIds[node.id]);
    const isLoadingChildren = Boolean(loadingChildMap[node.id]);
    const children = childrenMap.get(node.id) || [];

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => toggleSelect(node)}
          className={cn(
            "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer",
            isSelected
              ? "bg-sunflower-100/15 border border-sunflower-100/30 text-sunflower-100 font-semibold"
              : "hover:bg-white-chalk-100/5 text-white-chalk-100/80 hover:text-white-chalk-100 border border-transparent"
          )}
          style={{ paddingLeft: `${Math.max(10, depth * 18 + 10)}px` }}
        >
          {/* Left: Checkbox + Icon + Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}} // Handled by row onClick
              className="w-3.5 h-3.5 rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer shrink-0"
            />

            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-sunflower-100 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-white-chalk-100/40 group-hover:text-white-chalk-100/70 shrink-0" />
            )}

            <div className="truncate">
              <span className="font-medium text-white-chalk-100 text-xs">
                {node.name}
              </span>
              {node.childrenCount !== undefined && node.childrenCount > 0 && (
                <span className="text-[10px] text-white-chalk-100/40 ml-1.5 font-normal">
                  ({node.childrenCount} nested)
                </span>
              )}
            </div>
          </div>

          {/* Right: Expand arrow button to fetch/reveal nested subcategories */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {isSelected && (
              <span className="text-[10px] font-bold text-sunflower-100 mr-1 hidden sm:inline">
                Assigned ✓
              </span>
            )}

            {/* Bottom Arrow to Fetch Subcategories */}
            <button
              type="button"
              onClick={(e) => toggleExpand(node, e)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer border shadow-xs",
                isExpanded
                  ? "bg-sunflower-100/15 border-sunflower-100/40 text-sunflower-100"
                  : "bg-white-chalk-100/5 hover:bg-white-chalk-100/10 border-white-chalk-100/15 text-white-chalk-100/70 hover:text-white-chalk-100 hover:border-sunflower-100/30"
              )}
              title={isExpanded ? "Hide subcategories" : "Fetch and show nested subcategories"}
            >
              {isLoadingChildren ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-sunflower-100" />
                  <span className="text-[10px]">Loading...</span>
                </>
              ) : isExpanded ? (
                <>
                  <span className="text-[10px]">Subcategories</span>
                  <ChevronUp className="w-3.5 h-3.5 text-sunflower-100" />
                </>
              ) : (
                <>
                  <span className="text-[10px]">Subcategories</span>
                  <ChevronDown className="w-3.5 h-3.5 text-sunflower-100/80 group-hover:text-sunflower-100 transition-colors" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Indented Children List */}
        {isExpanded && (
          <div className="relative border-l border-white-chalk-100/10 ml-5 pl-1.5 my-0.5 space-y-0.5">
            {isLoadingChildren ? (
              <div className="flex items-center gap-2 py-2 px-3 text-xs text-white-chalk-100/40">
                <Loader2 className="w-3 h-3 animate-spin text-sunflower-100" />
                <span>Fetching nested categories inside {node.name}...</span>
              </div>
            ) : children.length === 0 ? (
              <div className="py-1.5 px-3 text-[11px] text-white-chalk-100/40 italic">
                No nested subcategories inside this branch.
              </div>
            ) : (
              children.map((child) => renderCategoryRow(child, depth + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  const hasMoreRoots = rootCategories.length < rootTotal;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header with Assigned Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-white-chalk-100/70">
          {label} ({selectedIds.length} Assigned)
        </label>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-[11px] text-cadmium-red-200 hover:text-cadmium-red-100 transition underline underline-offset-2 cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Assigned Categories Tags with Breadcrumb Lineage */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-matt-black-200/40 border border-white-chalk-100/10 max-h-32 overflow-y-auto custom-scrollbar">
          {assignedList.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-sunflower-100/10 text-sunflower-100 border border-sunflower-100/25 shadow-sm"
            >
              <div className="flex flex-col text-left">
                {cat.path.length > 0 && (
                  <span className="text-[9px] text-white-chalk-100/45 leading-none">
                    {cat.path.join(" › ")}
                  </span>
                )}
                <span className="font-semibold text-white-chalk-100">
                  {cat.name}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => removeAssigned(cat.id, e)}
                disabled={disabled}
                className="p-0.5 rounded-full hover:bg-sunflower-100/20 text-sunflower-100/60 hover:text-sunflower-100 transition cursor-pointer ml-1"
                title="Remove category"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-white-chalk-100/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9 bg-matt-black-200/60 border-white-chalk-100/15 focus-visible:border-sunflower-100/50"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white-chalk-100/40 hover:text-white-chalk-100 transition cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Container: Live Search OR Root Browser with Nested Expand */}
      <div className="border border-white-chalk-100/10 rounded-xl bg-matt-black-200/30 p-2.5 max-h-72 overflow-y-auto custom-scrollbar shadow-inner">
        {searchQuery.trim().length >= 3 ? (
          /* LIVE SEARCH RESULTS */
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-white-chalk-100/40 flex items-center justify-between border-b border-white-chalk-100/10 pb-1.5 mb-1.5">
              <span>Matching Categories ({searchResults.length})</span>
              <span className="text-[10px] text-sunflower-100/80">
                Click row to select
              </span>
            </div>

            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Loader2 className="w-5 h-5 text-sunflower-100 animate-spin" />
                <p className="text-xs text-white-chalk-100/60">
                  Searching for &ldquo;{searchQuery.trim()}&rdquo;...
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-white-chalk-100/40">
                No categories match &ldquo;{searchQuery.trim()}&rdquo;.
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item)}
                      className={cn(
                        "group flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer",
                        isSelected
                          ? "bg-sunflower-100/15 border border-sunflower-100/30 text-sunflower-100 font-semibold"
                          : "hover:bg-white-chalk-100/5 text-white-chalk-100/80 hover:text-white-chalk-100 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded border-white-chalk-100/20 text-sunflower-100 accent-sunflower-100 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          {item.path.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-white-chalk-100/45 truncate">
                              {item.path.map((segment, i) => (
                                <React.Fragment key={i}>
                                  <span>{segment}</span>
                                  <span>›</span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                          <div className="font-semibold text-xs text-white-chalk-100 truncate">
                            {item.name}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] font-bold text-sunflower-100 shrink-0 ml-2">
                          Assigned ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ROOT CATEGORIES + ON-DEMAND NESTED ARROWS BROWSER */
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-white-chalk-100/40 flex items-center justify-between border-b border-white-chalk-100/10 pb-1.5 mb-1.5">
              <span>Main Root Categories ({rootCategories.length} of {rootTotal})</span>
              <span className="text-[10px] text-white-chalk-100/40">
                Click arrow to view subcategories
              </span>
            </div>

            {loadingRoots ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Loader2 className="w-5 h-5 text-sunflower-100 animate-spin" />
                <p className="text-xs text-white-chalk-100/40">Loading main categories...</p>
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="py-6 text-center text-xs text-white-chalk-100/40">
                No root categories configured.
              </div>
            ) : (
              <div className="space-y-0.5">
                {rootCategories.map((rootNode) => renderCategoryRow(rootNode, 0))}
              </div>
            )}

            {/* "See More" Button Capped at 5-6 */}
            {!loadingRoots && hasMoreRoots && (
              <div className="pt-2 mt-2 border-t border-white-chalk-100/10 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingMoreRoots}
                  onClick={handleLoadMoreRoots}
                  className="w-full text-xs text-white-chalk-100/80 hover:text-sunflower-100 hover:border-sunflower-100/30"
                >
                  {loadingMoreRoots ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-sunflower-100" />
                      Loading more categories...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1 text-sunflower-100" />
                      See more main categories ({rootTotal - rootCategories.length} remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-white-chalk-100/40">
        Browse main departments (capped at 6 with &ldquo;See more&rdquo;) or click the <em>Subcategories</em> arrow to load nested branches on-demand. You can also type 3+ letters above to search across all categories instantly.
      </p>
    </div>
  );
}
