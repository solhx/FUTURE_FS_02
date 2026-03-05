import { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, Filter, RefreshCw,
  LayoutGrid, LayoutList, X,
} from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";
import LeadTable from "../components/leads/LeadTable";
import LeadCard  from "../components/leads/LeadCard";
import LeadForm  from "../components/leads/LeadForm";
import Modal     from "../components/ui/Modal";
import toast     from "react-hot-toast";

const STATUS_OPTIONS   = ["", "new", "contacted", "qualified", "converted", "lost"];
const SOURCE_OPTIONS   = ["", "website", "referral", "social_media", "email_campaign", "cold_call", "other"];
const PRIORITY_OPTIONS = ["", "low", "medium", "high"];

const Leads = () => {
  // Data state
  const [leads,      setLeads]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pagination, setPagination] = useState({});
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);

  // UI state
  const [view,       setView]       = useState("table"); // "table" | "grid"
  const [showModal,  setShowModal]  = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Query state
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [sortBy,    setSortBy]    = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filters,   setFilters]   = useState({
    status: "", source: "", priority: "",
  });

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page, limit: 10, sortBy, sortOrder,
        ...(search             && { search }),
        ...(filters.status     && { status:   filters.status   }),
        ...(filters.source     && { source:   filters.source   }),
        ...(filters.priority   && { priority: filters.priority }),
      });

      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.data);
      setTotal(data.total);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortOrder, search, filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchLeads(); }, 400);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  const handleCreateLead = async (payload) => {
    try {
      setIsSaving(true);
      await api.post("/leads", payload);
      toast.success("Lead created successfully! 🎉");
      setShowModal(false);
      fetchLeads();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create lead");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/leads/${id}/status`, { status });
      toast.success(`Status updated to "${status}"`);
      setLeads((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status } : l))
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive this lead? It can be restored later.")) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead archived");
      setLeads((prev) => prev.filter((l) => l._id !== id));
      setTotal((t) => t - 1);
    } catch {
      toast.error("Failed to archive lead");
    }
  };

const handlePermanentDelete = async (id) => {
  try {
    await api.delete(`/leads/${id}/permanent`);
    toast.success("Lead permanently deleted 🗑️");
    setLeads((prev) => prev.filter((l) => l._id !== id));
    setTotal((t) => t - 1);
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Failed to delete lead"
    );
  }
};

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ status: "", source: "", priority: "" });
    setSearch("");
    setPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Leads" />

      <main className="flex-1 overflow-y-auto p-6">
        {/* ── Top Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name, email or company..."
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

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilter((p) => !p)}
              className={`btn-secondary relative ${showFilter ? "ring-2 ring-indigo-300" : ""}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white
                                 text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchLeads}
              className="btn-secondary"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* View toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setView("table")}
                className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Add Lead */}
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        {showFilter && (
          <div className="card p-4 mb-5 animate-fadeInUp">
            <div className="flex flex-wrap gap-3 items-end">
              {[
                { label: "Status",   key: "status",   opts: STATUS_OPTIONS   },
                { label: "Source",   key: "source",   opts: SOURCE_OPTIONS   },
                { label: "Priority", key: "priority", opts: PRIORITY_OPTIONS },
              ].map(({ label, key, opts }) => (
                <div key={key} className="min-w-[140px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">
                    {label}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, [key]: e.target.value }));
                      setPage(1);
                    }}
                    className="input-field text-sm py-2"
                  >
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o ? o.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : `All ${label}s`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-secondary text-sm py-2">
                  <X className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Results Info ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{leads.length}</span>
            {" "}of{" "}
            <span className="font-semibold text-slate-700">{total}</span>
            {" "}leads
          </p>
          {pagination.totalPages > 1 && (
            <p className="text-sm text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </p>
          )}
        </div>

        {/* ── Lead List ── */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent
                                rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Loading leads...</p>
              </div>
            </div>
          ) : view === "table" ? (
          <LeadTable
              leads={leads}
              onDelete={handleDelete}
              onPermanentDelete={handlePermanentDelete}
              onStatusChange={handleStatusChange}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {leads.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-400">
                  No leads found. Try adjusting your filters.
                </div>
              ) : (
                leads.map((lead) => (
                  <LeadCard
                    key={lead._id}
                    lead={lead}
                    onStatusChange={handleStatusChange}
                  />
                ))
              )}
            </div>
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
                          : "text-slate-500 hover:bg-slate-100"}`}
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

      {/* ── Create Lead Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Lead"
        size="lg"
      >
        <LeadForm
          onSubmit={handleCreateLead}
          onCancel={() => setShowModal(false)}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
};

export default Leads;