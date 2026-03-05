import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import { StatusBadge, PriorityBadge, SourceBadge } from "../ui/Badge";
import { format } from "date-fns";

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
  onStatusChange,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const navigate = useNavigate();

  const handleSort = (field) => {
    onSort(field, sortBy === field && sortOrder === "asc" ? "desc" : "asc");
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
    <div className="overflow-x-auto">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadTable;

