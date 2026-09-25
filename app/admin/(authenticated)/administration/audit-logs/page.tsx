"use client";

import { useEffect, useState, useCallback } from "react";
import {
  History,
  Eye,
  Activity,
  Search,
} from "lucide-react";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminModal,
} from "@/components/admin/AdminUI";

interface AuditLogItem {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (actionFilter) params.set("action", actionFilter);
      if (search.trim()) params.set("search", search.trim());
      if (entityTypeFilter) params.set("entityType", entityTypeFilter);
      if (fromDate) params.set("from", new Date(`${fromDate}T00:00:00.000`).toISOString());
      if (toDate) params.set("to", new Date(`${toDate}T23:59:59.999`).toISOString());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to load audit events.");

      if (data.data?.logs) {
        setRequestError(null);
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalCount(data.data.pagination?.total || 0);
      } else if (Array.isArray(data.data)) {
        setRequestError(null);
        setLogs(data.data);
        setTotalCount(data.data.length);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setRequestError(err instanceof Error ? err.message : "Unable to load audit events.");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, search, entityTypeFilter, fromDate, toDate]);

  useEffect(() => {
    const timer = window.setTimeout(fetchLogs, search.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs, search]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Security & System Audit Logs"
        description="Review recorded administrative changes. Search and filters apply across all matching events."
        badge={`${totalCount} Total Entries`}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Administration" },
          { label: "Audit Logs" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Matching Events"
          value={totalCount}
          subtext="Matches the current filters"
          icon={History}
          variant="gold"
        />
        <AdminStatCard
          label="Audit Coverage"
          value="Partial"
          subtext="Some admin actions do not yet write events"
          icon={Activity}
          variant="blue"
        />
        <AdminStatCard
          label="Search Scope"
          value="All pages"
          subtext="Search is applied before pagination"
          icon={Search}
          variant="green"
        />
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search actor name, email, entity, or ID..."
        statusFilter={actionFilter}
        statusPlaceholder="All actions"
        onStatusChange={(v) => {
          setActionFilter(v);
          setPage(1);
        }}
        statusOptions={[
          { label: "CREATE", value: "CREATE" },
          { label: "UPDATE", value: "UPDATE" },
          { label: "DELETE", value: "DELETE" },
          { label: "APPROVE", value: "APPROVE" },
          { label: "REJECT", value: "REJECT" },
          { label: "SUSPEND", value: "SUSPEND" },
          { label: "RESTORE", value: "RESTORE" },
          { label: "LOGIN", value: "LOGIN" },
        ]}
        extraFilters={
          <>
            <select
              value={entityTypeFilter}
              onChange={(event) => {
                setEntityTypeFilter(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by entity type"
              className="bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-sunflower-100/50 cursor-pointer"
            >
              <option value="">All entities</option>
              {["PRODUCT", "SELLER", "SELLER_LISTING", "ORDER", "USER", "CATEGORY", "BRAND", "COUPON", "RETURN", "REFUND"].map((entityType) => (
                <option key={entityType} value={entityType}>{entityType.replaceAll("_", " ")}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="audit-from-date">From date</label>
            <input
              id="audit-from-date"
              type="date"
              value={fromDate}
              onChange={(event) => { setFromDate(event.target.value); setPage(1); }}
              aria-label="From date"
              className="bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-2 py-2 outline-none focus:border-sunflower-100/50"
            />
            <label className="sr-only" htmlFor="audit-to-date">To date</label>
            <input
              id="audit-to-date"
              type="date"
              value={toDate}
              onChange={(event) => { setToDate(event.target.value); setPage(1); }}
              aria-label="To date"
              className="bg-matt-black-200/60 border border-white-chalk-100/10 text-white-chalk-100 text-xs rounded-xl px-2 py-2 outline-none focus:border-sunflower-100/50"
            />
          </>
        }
        onRefresh={fetchLogs}
        isRefreshing={loading}
      />

      {requestError && (
        <div role="alert" className="p-4 rounded-xl bg-cadmium-red-100/15 border border-cadmium-red-100/30 text-cadmium-red-200 text-xs">
          {requestError}
        </div>
      )}

      <AdminTable
        headers={[
          "Timestamp",
          "Actor / Administrator",
          "Action Type",
          "Target Entity",
          "IP Address",
          "Diff Inspection",
        ]}
        loading={loading}
        isEmpty={logs.length === 0}
        emptyMessage="No audit logs recorded for this criteria."
        colSpan={6}
      >
        {logs.map((log) => {
          const actor = log.user
            ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email
            : "System Background";

          return (
            <tr
              key={log.id}
              className="hover:bg-white-chalk-100/5 transition-colors border-t border-white-chalk-100/5"
            >
              <td className="px-5 py-3.5 text-white-chalk-100/60 font-mono text-xs whitespace-nowrap">
                {new Date(log.createdAt).toLocaleString()}
              </td>

              <td className="px-5 py-3.5">
                <div className="font-semibold text-white-chalk-100">
                  {actor}
                </div>
                {log.user?.email && (
                  <div className="text-[11px] text-white-chalk-100/40 truncate">
                    {log.user.email}
                  </div>
                )}
              </td>

              <td className="px-5 py-3.5">
                <span className="font-mono text-xs font-bold text-sunflower-100 bg-sunflower-100/10 px-2.5 py-0.5 rounded border border-sunflower-100/20 uppercase">
                  {log.action}
                </span>
              </td>

              <td className="px-5 py-3.5">
                <span className="font-mono text-xs text-white-chalk-100 font-semibold uppercase">
                  {log.entityType}
                </span>
                <span className="text-white-chalk-100/40 text-[11px] font-mono ml-1.5">
                  ({log.entityId.slice(0, 10)}...)
                </span>
              </td>

              <td className="px-5 py-3.5 text-white-chalk-100/50 font-mono text-xs">
                {log.ipAddress || "Not recorded"}
              </td>

              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => setSelectedLog(log)}
                  className="px-2.5 py-1.5 rounded-lg border border-white-chalk-100/10 hover:border-sunflower-100/30 text-white-chalk-100/70 hover:text-sunflower-100 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect
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

      {/* Inspect Log Modal */}
      {selectedLog && (
        <AdminModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action} on ${selectedLog.entityType}`}
          maxWidth="lg"
          footer={
            <button
              onClick={() => setSelectedLog(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-matt-black-200 text-white-chalk-100 hover:bg-matt-black-300 transition cursor-pointer"
            >
              Close
            </button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-matt-black-200/40 p-4 rounded-xl border border-white-chalk-100/5 text-xs">
              <div>
                <span className="text-white-chalk-100/40 font-bold uppercase">
                  Action
                </span>
                <p className="font-mono text-sunflower-100 font-bold mt-0.5">
                  {selectedLog.action}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 font-bold uppercase">
                  Entity
                </span>
                <p className="font-mono text-white-chalk-100 font-semibold mt-0.5">
                  {selectedLog.entityType}: {selectedLog.entityId}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 font-bold uppercase">
                  Actor ID
                </span>
                <p className="font-mono text-white-chalk-100/70 mt-0.5">
                  {selectedLog.userId || "System"}
                </p>
              </div>
              <div>
                <span className="text-white-chalk-100/40 font-bold uppercase">
                  IP / Network
                </span>
                <p className="font-mono text-white-chalk-100/70 mt-0.5">
                  {selectedLog.ipAddress || "Internal"}
                </p>
              </div>
            </div>

            {/* Old vs New Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h6 className="text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/50 mb-1">
                  Previous State (oldData)
                </h6>
                <div className="bg-matt-black-200/60 p-3 rounded-xl border border-white-chalk-100/10 font-mono text-[11px] text-cadmium-red-200/80 max-h-48 overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.oldData ?? null, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <h6 className="text-[10px] font-bold uppercase tracking-wider text-white-chalk-100/50 mb-1">
                  New State (newData)
                </h6>
                <div className="bg-matt-black-200/60 p-3 rounded-xl border border-white-chalk-100/10 font-mono text-[11px] text-pablano-200/80 max-h-48 overflow-y-auto custom-scrollbar">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.newData ?? null, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
