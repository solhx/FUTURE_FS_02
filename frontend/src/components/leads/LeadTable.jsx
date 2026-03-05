import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, Edit2, Trash2, ChevronUp, ChevronDown,
  ChevronsUpDown, MoreVertical, Archive,
} from "lucide-react";
import { StatusBadge, PriorityBadge, SourceBadge } from "../ui/Badge";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ── Sort icon ─────────────────────────────────
const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field)
    return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />;
  return sortOrder === "asc"
    ? <ChevronUp   className="w-3.5 h-3.5 text-indigo-500" />
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />;
};

// ── Column definitions ────────────────────────
const COLUMNS = [
  { key: "name",      label: "Lead"      },
  { key: "status",    label: "Status"    },
  { key: "source",    label: "Source"    },
  { key: "priority",  label: "Priority"  },
  { key: "company",   label: "Company"   },
  { key: "createdAt", label: "Created"   },
  { key: "assignedTo",label: "Assigned"  },
];

// ── Status advance cycle ──────────────────────
const STATUS_CYCLE = {
  new:       "contacted",
  contacted: "qualified",
  qualified: "converted",
  converted: "converted",
  lost:      "lost",
};

// ── Main component ────────────────────────────
const LeadTable = ({
  leads,
  onDelete,
  onPermanentDelete,
  onStatusChange,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const navigate   = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const handleSort = (field) => {
    onSort(field, sortBy === field && sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setOpenMenu((prev) => (prev === id ? null : id));
  };

  const closeMenu = () => setOpenMenu(null);

  // ── Confirm permanent delete ───────────────
  const confirmPermanentDelete = (lead, e) => {
    e.stopPropagation();
    closeMenu();

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-white">
            Permanently delete{" "}
            <span className="text-red-400">{lead.name}</span>?
          </p>
          <p className="text-xs text-slate-400">
            This action <span className="text-red-400 font-medium">cannot be undone</span>.
            All notes and data will be lost forever.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onPermanentDelete(lead._id);
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs
                         font-medium py-1.5 px-3 rounded-lg transition-colors"
            >
              Yes, Delete Forever
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200
                         text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  // ── Confirm archive ────────────────────────
  const confirmArchive = (lead, e) => {
    e.stopPropagation();
    closeMenu();
    onDelete(lead._id);
  };

  // ── Empty state ────────────────────────────
  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center
                        justify-center mx-auto mb-4">
          <ChevronsUpDown className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">No leads found</p>
        <p className="text-slate-400 text-sm mt-1">
          Try adjusting your filters or create a new lead
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────
  return (
    <div className="overflow-x-auto" onClick={closeMenu}>
      <table className="w-full text-sm">

        {/* ══ HEAD ══════════════════════════════ */}
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {COLUMNS.map(({ key, label }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="text-left px-4 py-3.5 text-xs font-bold text-slate-500
                           uppercase tracking-wider cursor-pointer hover:text-indigo-600
                           hover:bg-slate-100 transition-colors select-none whitespace-nowrap"
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  <SortIcon
                    field={key}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                  />
                </span>
              </th>
            ))}
            {/* Actions column — not sortable */}
            <th className="px-4 py-3.5 bg-slate-50 text-xs font-bold text-slate-500
                           uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>

        {/* ══ BODY ══════════════════════════════ */}
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead, idx) => (
            <tr
              key={lead._id}
              className="hover:bg-indigo-50/40 transition-colors cursor-pointer
                         group animate-fadeInUp"
              style={{ animationDelay: `${idx * 25}ms` }}
              onClick={() => navigate(`/leads/${lead._id}`)}
            >
              {/* ── Lead name + email ── */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-indigo-100 flex items-center
                               justify-center text-indigo-700 font-bold text-sm flex-shrink-0"
                  >
                    {lead.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 leading-tight">
                      {lead.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{lead.email}</p>
                  </div>
                </div>
              </td>

              {/* ── Status — click to advance ── */}
              <td
                className="px-4 py-3.5 whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = STATUS_CYCLE[lead.status];
                  if (next && next !== lead.status)
                    onStatusChange(lead._id, next);
                }}
                title="Click to advance status"
              >
                <StatusBadge status={lead.status} />
              </td>

              {/* ── Source ── */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <SourceBadge source={lead.source} />
              </td>

              {/* ── Priority ── */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <PriorityBadge priority={lead.priority} />
              </td>

              {/* ── Company ── */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-slate-600 text-sm">
                  {lead.company || <span className="text-slate-300">—</span>}
                </span>
              </td>

              {/* ── Created date ── */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                <span className="text-slate-500 text-xs">
                  {format(new Date(lead.createdAt), "MMM d, yyyy")}
                </span>
              </td>

              {/* ── Assigned to ── */}
              <td className="px-4 py-3.5 whitespace-nowrap">
                {lead.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full bg-slate-200 flex items-center
                                 justify-center text-slate-600 text-xs font-bold"
                    >
                      {lead.assignedTo.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-500 hidden lg:block">
                      {lead.assignedTo.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 text-xs">Unassigned</span>
                )}
              </td>

              {/* ── Actions dropdown ── */}
              <td
                className="px-4 py-3.5 text-right whitespace-nowrap"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative inline-block">
                  {/* Three-dot button */}
                  <button
                    onClick={(e) => toggleMenu(lead._id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700
                               hover:bg-slate-100 transition-colors
                               opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown menu */}
                  {openMenu === lead._id && (
                    <div
                      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl
                                 shadow-xl border border-slate-100 z-30 animate-fadeInUp
                                 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* View Details */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeMenu();
                          navigate(`/leads/${lead._id}`);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                   text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                        View Details
                      </button>

                      {/* Edit Lead */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeMenu();
                          navigate(`/leads/${lead._id}?edit=true`);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                   text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                        Edit Lead
                      </button>

                      <hr className="border-slate-100 my-1" />

                      {/* Archive Lead */}
                      <button
                        onClick={(e) => confirmArchive(lead, e)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                   text-amber-600 hover:bg-amber-50 transition-colors"
                      >
                        <Archive className="w-4 h-4" />
                        Archive Lead
                      </button>

                      {/* Permanent Delete */}
                      <button
                        onClick={(e) => confirmPermanentDelete(lead, e)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                   text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Forever
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;