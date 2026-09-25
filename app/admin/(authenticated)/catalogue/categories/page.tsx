"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  CheckCircle,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Boxes,
  ExternalLink,
  Eye,
  Sliders,
  Tag,
  List,
  GitBranch,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminBadge,
  AdminFilterBar,
  AdminTable,
  AdminModal,
} from "@/components/admin/AdminUI";

interface CategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl?: string | null;
  iconUrl?: string | null;
  displayMode?: string | null;
  includeInMenu?: boolean;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    children: number;
    products: number;
  };
  children: CategoryNode[];
}

interface FlatCategoryRow {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  depth: number;
  path: string;
  isActive: boolean;
  includeInMenu: boolean;
  displayMode: string;
  bannerUrl: string | null;
  iconUrl: string | null;
  childrenCount: number;
  productsCount: number;
}

function flattenTreeForTable(
  nodes: CategoryNode[],
  depth = 0,
  parentPath = ""
): FlatCategoryRow[] {
  let rows: FlatCategoryRow[] = [];
  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    rows.push({
      id: node.id,
      parentId: node.parentId,
      name: node.name,
      slug: node.slug,
      depth,
      path: currentPath,
      isActive: node.isActive,
      includeInMenu: node.includeInMenu ?? true,
      displayMode: node.displayMode || "BOTH",
      bannerUrl: node.bannerUrl || null,
      iconUrl: node.iconUrl || node.imageUrl || null,
      childrenCount: node.children ? node.children.length : (node._count?.children || 0),
      productsCount: node._count?.products || 0,
    });
    if (node.children && node.children.length > 0) {
      rows = rows.concat(flattenTreeForTable(node.children, depth + 1, currentPath));
    }
  }
  return rows;
}

export default function CategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [flatRows, setFlatRows] = useState<FlatCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");

  // Expanded nodes state for tree view
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({});

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<FlatCategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/admin/categories/tree?includeInactive=true")
      .then((res) => res.json())
      .then((data) => {
        const rawTree: CategoryNode[] = data.data?.categories || data.data || [];
        if (Array.isArray(rawTree)) {
          setTree(rawTree);
          const flattened = flattenTreeForTable(rawTree);
          setFlatRows(flattened);

          // By default expand top 2 levels
          const defaultExpanded: Record<string, boolean> = {};
          flattened.forEach((r) => {
            if (r.depth < 2) defaultExpanded[r.id] = true;
          });
          setExpandedNodeIds(defaultExpanded);
        }
      })
      .catch((err) => console.error("Error loading category tree:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    flatRows.forEach((r) => (all[r.id] = true));
    setExpandedNodeIds(all);
  };

  const collapseAll = () => {
    setExpandedNodeIds({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete category");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || "Error deleting category");
    } finally {
      setDeleting(false);
    }
  };

  const filteredRows = flatRows.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.path.toLowerCase().includes(search.toLowerCase())
  );

  const totalCount = flatRows.length;
  const rootCount = flatRows.filter((r) => r.depth === 0).length;
  const subCount = flatRows.filter((r) => r.depth > 0).length;
  const activeCount = flatRows.filter((r) => r.isActive).length;

  // Render a recursive node for Tree View
  const renderTreeNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodeIds[node.id];

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition group ${isExpanded && hasChildren
            ? "bg-matt-black-200/70 border-white-chalk-100/15"
            : "bg-matt-black-200/40 border-white-chalk-100/5 hover:border-white-chalk-100/20"
            }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-2.5">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="p-1 rounded text-white-chalk-100/50 hover:text-sunflower-100 transition cursor-pointer"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <div className="w-7 h-7 rounded-lg bg-matt-black-300 border border-white-chalk-100/10 flex items-center justify-center shrink-0 overflow-hidden">
              {node.iconUrl || node.imageUrl ? (
                <img
                  src={node.iconUrl || node.imageUrl || ""}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-sunflower-100" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-white-chalk-100/50" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white-chalk-100">
                  {node.name}
                </span>
                <AdminBadge status={node.isActive ? "ACTIVE" : "INACTIVE"} />
                {node.displayMode && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white-chalk-100/10 text-white-chalk-100/60">
                    {node.displayMode}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono text-white-chalk-100/40">
                /{node.slug} {hasChildren && `• ${node.children.length} subcategories`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
            <Link
              href={`/admin/catalogue/categories/new?parentId=${node.id}`}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sunflower-100/15 hover:bg-sunflower-100/25 text-sunflower-100 border border-sunflower-100/30 transition flex items-center gap-1 cursor-pointer"
              title="Add child category beneath this"
            >
              <Plus className="w-3 h-3" />
              Subcategory
            </Link>

            <Link
              href={`/admin/catalogue/categories/${node.id}/edit`}
              className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
              title="Edit category"
            >
              <Edit className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                const targetRow = flatRows.find((r) => r.id === node.id);
                if (targetRow) setDeleteTarget(targetRow);
              }}
              className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/60 hover:text-cadmium-red-200 transition cursor-pointer"
              title="Delete category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pt-6">
      <AdminPageHeader
        title="Category Hierarchy & Landing Pages"
        description="Magento-style nested category architecture, landing page CMS blocks, hero banners, and SEO metadata."
        badge={`${totalCount} Total Categories`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Catalogue", href: "/admin/catalogue/products" },
          { label: "Categories" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/catalogue/categories/new"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sunflower-100 text-matt-black-100 hover:bg-sunflower-200 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-sunflower-100/20"
            >
              <Plus className="w-4 h-4" />
              Add Root Category
            </Link>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Categories"
          value={totalCount}
          subtext="Full catalogue taxonomy"
          icon={FolderTree}
          variant="gold"
        />
        <AdminStatCard
          label="Root Categories"
          value={rootCount}
          subtext="Top-level menu architectures"
          icon={Layers}
          variant="blue"
        />
        <AdminStatCard
          label="Nested Subcategories"
          value={subCount}
          subtext="Sub-branches & leaf nodes"
          icon={GitBranch}
          variant="purple"
        />
        <AdminStatCard
          label="Active in Navigation"
          value={activeCount}
          subtext="Rendered on storefront"
          icon={CheckCircle}
          variant="green"
        />
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search category name, slug, or nested path..."
            onRefresh={fetchCategories}
            isRefreshing={loading}
          />
        </div>

        {/* View Switcher: Table vs Tree */}
        <div className="flex items-center gap-1 bg-matt-black-200/60 border border-white-chalk-100/10 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${viewMode === "table"
              ? "bg-sunflower-100 text-matt-black-100 font-bold shadow"
              : "text-white-chalk-100/60 hover:text-white-chalk-100"
              }`}
          >
            <List className="w-3.5 h-3.5" />
            Hierarchical Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${viewMode === "tree"
              ? "bg-sunflower-100 text-matt-black-100 font-bold shadow"
              : "text-white-chalk-100/60 hover:text-white-chalk-100"
              }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Tree Architecture
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: HIERARCHICAL TABLE VIEW */}
      {viewMode === "table" && (
        <AdminTable
          headers={[
            "Category Hierarchy & Path",
            "URL Slug",
            "Display Mode",
            "Menu",
            "Products",
            "Status",
            "Actions",
          ]}
          loading={loading}
          isEmpty={filteredRows.length === 0}
          emptyMessage="No categories found matching your query."
          colSpan={7}
        >
          {filteredRows.map((cat) => (
            <tr
              key={cat.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5">
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: `${cat.depth * 20}px` }}
                >
                  {cat.depth > 0 && (
                    <span className="text-white-chalk-100/30 font-mono text-xs select-none">
                      └─
                    </span>
                  )}

                  <div className="w-7 h-7 rounded-lg bg-matt-black-300 border border-white-chalk-100/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {cat.iconUrl ? (
                      <img
                        src={cat.iconUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-sunflower-100/60" />
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-xs text-white-chalk-100">
                      {cat.name}
                    </div>
                    {cat.depth > 0 && (
                      <div className="text-[10px] text-white-chalk-100/40">
                        {cat.path}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-5 py-3.5 text-white-chalk-100/60 font-mono text-xs">
                /{cat.slug}
              </td>

              <td className="px-5 py-3.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white-chalk-100/10 text-white-chalk-100/70 border border-white-chalk-100/10">
                  {cat.displayMode}
                </span>
              </td>

              <td className="px-5 py-3.5 text-xs">
                {cat.includeInMenu ? (
                  <span className="text-pablano-200 flex items-center gap-1 text-[11px]">
                    <CheckCircle className="w-3 h-3" /> In Menu
                  </span>
                ) : (
                  <span className="text-white-chalk-100/40 text-[11px]">Hidden</span>
                )}
              </td>

              <td className="px-5 py-3.5 font-mono text-xs text-white-chalk-100/80">
                {cat.productsCount} items
              </td>

              <td className="px-5 py-3.5">
                <AdminBadge status={cat.isActive ? "ACTIVE" : "INACTIVE"} />
              </td>

              <td className="px-5 py-3.5 text-right">
                <div className="flex justify-end items-center gap-1.5">
                  <Link
                    href={`/admin/catalogue/categories/new?parentId=${cat.id}`}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sunflower-100/10 hover:bg-sunflower-100/20 text-sunflower-100 border border-sunflower-100/25 transition flex items-center gap-1 cursor-pointer"
                    title="Add subcategory"
                  >
                    <Plus className="w-3 h-3" />
                    Sub
                  </Link>

                  <Link
                    href={`/admin/catalogue/categories/${cat.id}/edit`}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/60 hover:text-sunflower-100 transition cursor-pointer"
                    title="Edit category"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(cat)}
                    className="p-1.5 rounded-lg border border-white-chalk-100/10 hover:border-cadmium-red-100/30 text-white-chalk-100/60 hover:text-cadmium-red-200 transition cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* VIEW MODE 2: RECURSIVE TREE VIEW */}
      {viewMode === "tree" && (
        <div className="bg-[#161b22] border border-white-chalk-100/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white-chalk-100/10 pb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-sunflower-100" />
              <h3 className="font-sora text-sm font-bold text-white-chalk-100">
                Interactive Category Tree
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="text-[11px] font-semibold text-sunflower-100 hover:underline cursor-pointer"
              >
                Expand All
              </button>
              <span className="text-white-chalk-100/20">•</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-[11px] font-semibold text-white-chalk-100/60 hover:text-white-chalk-100 hover:underline cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-white-chalk-100/40">
              Loading tree hierarchy...
            </div>
          ) : tree.length === 0 ? (
            <div className="py-10 text-center text-xs text-white-chalk-100/40">
              No categories configured.
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {tree.map((rootNode) => renderTreeNode(rootNode, 0))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Category"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-white-chalk-100/70">
              Are you sure you want to delete <strong className="text-white-chalk-100">{deleteTarget.name}</strong>?
            </p>
            {deleteTarget.childrenCount > 0 && (
              <p className="text-[11px] text-sunflower-100 bg-sunflower-100/10 p-2.5 rounded-lg border border-sunflower-100/20">
                ⚠️ Notice: This category contains {deleteTarget.childrenCount} subcategories. Deleting this category will promote its children to root or parent level.
              </p>
            )}
            <p className="text-[11px] text-white-chalk-100/40">
              Assigned products will remain safe in the master catalogue.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white-chalk-100/10">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cadmium-red-100 text-white-chalk-100 hover:bg-cadmium-red-200 transition disabled:opacity-40 cursor-pointer shadow-lg"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
