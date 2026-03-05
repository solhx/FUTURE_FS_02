import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive, Search, RefreshCw, RotateCcw,
  Trash2, X, Eye, Calendar, Mail, Building2,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";
import { StatusBadge, PriorityBadge, SourceBadge } from "../components/ui/Badge";
import { format } from "date-fns";
import toast from "react-hot-toast";

const ArchivedLeads = () => {
  const navigate = useNavigate();

  const [leads,      setLeads]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pagination, setPagination] = useState({});
  const [isLoading,  setIsLoading]  = useState(true);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [restoring,  setRestoring]  = useState(null); // id being restored

  // ── Fetch archived leads ───────────────────
  const fetchArchived = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        archived: "true",
        page,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
        ...(search && { search }),
      });
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.data);
      setTotal(data.total);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load archived leads");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchArchived(); }, [fetchArchived]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchArchived();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  // ── Restore lead ───────────────────────────
  const handleRestore = async (id) => {
    try {
      setRestoring(id);
      await api.put(`/leads/${id}`, { isArchived: false });
      toast.success("Lead restored successfully! ✅");
      setLeads((prev) => prev.filter((l) => l._id !== id));
      setTotal((t) => t - 1);
    } catch {
      toast.error("Failed to restore lead");
    } finally {
      setRestoring(null);
    }
  };

  // ── Confirm restore ────────────────────────
  const confirmRestore = (lead) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Restore <span className="text-indigo-400">{lead.name}</span>?
          </p>
          <p className="text-xs text-slate-400">
            This lead will appear back in your active leads list.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { toast.dismiss(t.id); handleRestore(lead._id); }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs
                         font-medium py-1.5 px-3 rounded-lg transition-colors"
            >
              Yes, Restore
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs
                         font-medium py-1.5 px-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  // ── Empty state ────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Archive className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-slate-600 font-semibold text-lg mb-1">
        {search ? "No archived leads match your search" : "No archived leads"}
      </h3>
      <p className="text-slate-400 text-sm max-w-xs">
        {search
          ? "Try a different search term."
          : "When you archive a lead from the Leads page, it will appear here."}
      </p>
      {search && (
        <button
          onClick={() => setSearch("")}
          className="mt-4 btn-secondary text-sm"
        >
          <X className="w-4 h-4" />
          Clear Search
        </button>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Archived Leads" />

      <main className="flex-1 overflow-y-auto p-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Archive className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Archived Leads</h2>
              <p className="text-sm text-slate-400">
                {total} archived lead{total !== 1 ? "s" : ""} — restore any time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchArchived}
              className="btn-secondary"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate("/leads")}
              className="btn-primary"
            >
              ← Active Leads
            </button>
          </div>
        </div>

        {/* ── Info banner ── */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5
                        flex items-start gap-3">
          <Archive className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Archived leads are hidden from your main leads list but are never permanently
            deleted. You can restore them at any time by clicking the{" "}
            <span className="font-semibold">Restore</span> button.
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="relative mb-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search archived leads by name, email or company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                         hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Results count ── */}
        {!isLoading && total > 0 && (
          <p className="text-sm text-slate-500 mb-4">
            Showing{" "}
            <span className="font-semibold text-slate-700">{leads.length}</span>
            {" "}of{" "}
            <span className="font-semibold text-slate-700">{total}</span>
            {" "}archived leads
          </p>
        )}

        {/* ── Table card ── */}
        <div className="card overflow-hidden">
          {isLoading ? (
            // Skeleton
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-slate-100 rounded w-40" />
                    <div className="h-3 bg-slate-100 rounded w-56" />
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full w-16" />
                  <div className="h-8 bg-slate-100 rounded-lg w-20" />
                </div>
              ))}
            </div>
          ) : leads.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Lead", "Status", "Source", "Priority", "Company", "Archived On", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-slate-400
                                     uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map((lead, idx) => (
                      <tr
                        key={lead._id}
                        className="hover:bg-slate-50/80 transition-colors animate-fadeInUp"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        {/* Lead name + email */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center
                                            justify-center text-slate-500 font-semibold text-sm
                                            flex-shrink-0">
                              {lead.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">{lead.name}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={lead.status} />
                        </td>

                        {/* Source */}
                        <td className="px-4 py-3.5">
                          <SourceBadge source={lead.source} />
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3.5">
                          <PriorityBadge priority={lead.priority} />
                        </td>

                        {/* Company */}
                        <td className="px-4 py-3.5">
                          <span className="text-slate-500 flex items-center gap-1">
                            {lead.company
                              ? <><Building2 className="w-3.5 h-3.5" />{lead.company}</>
                              : <span className="text-slate-300">—</span>
                            }
                          </span>
                        </td>

                        {/* Archived on */}
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(lead.updatedAt), "MMM d, yyyy")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {/* View */}
                            <button
                              onClick={() => navigate(`/leads/${lead._id}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600
                                         hover:bg-indigo-50 transition-colors"
                              title="View lead details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Restore */}
                            <button
                              onClick={() => confirmRestore(lead)}
                              disabled={restoring === lead._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                         bg-green-50 hover:bg-green-100 text-green-700
                                         text-xs font-medium transition-colors
                                         disabled:opacity-60 disabled:cursor-not-allowed"
                              title="Restore this lead"
                            >
                              {restoring === lead._id ? (
                                <div className="w-3.5 h-3.5 border-2 border-green-400
                                                border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {leads.map((lead) => (
                  <div key={lead._id} className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center
                                        justify-center text-slate-500 font-semibold text-sm">
                          {lead.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 text-sm">{lead.name}</p>
                          <p className="text-xs text-slate-400">{lead.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <SourceBadge   source={lead.source}     />
                      <PriorityBadge priority={lead.priority} />
                      {lead.company && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {lead.company}
                        </span>
                      )}
                    </div>

                    {/* Archived date */}
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Archived on {format(new Date(lead.updatedAt), "MMM d, yyyy")}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => navigate(`/leads/${lead._id}`)}
                        className="btn-secondary text-xs py-1.5 flex-1 justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => confirmRestore(lead)}
                        disabled={restoring === lead._id}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5
                                   rounded-lg bg-green-50 hover:bg-green-100 text-green-700
                                   text-xs font-medium transition-colors
                                   disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {restoring === lead._id ? (
                          <div className="w-3.5 h-3.5 border-2 border-green-400
                                          border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrevPage}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pg = i + 1;
                if (
                  pg === 1 ||
                  pg === pagination.totalPages ||
                  Math.abs(pg - pagination.currentPage) <= 1
                ) {
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                        ${pg === pagination.currentPage
                          ? "bg-indigo-600 text-white"
                          : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                      {pg}
                    </button>
                  );
                }
                if (Math.abs(pg - pagination.currentPage) === 2) {
                  return <span key={pg} className="text-slate-400 px-1">…</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage}
              className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default ArchivedLeads;