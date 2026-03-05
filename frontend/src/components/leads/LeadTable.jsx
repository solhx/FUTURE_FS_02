import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, Edit2, Trash2, ChevronUp, ChevronDown,
  ChevronsUpDown, MoreVertical,
} from "lucide-react";
import { StatusBadge, PriorityBadge, SourceBadge } from "../ui/Badge";
import { format } from "date-fns";

const SortIcon = ({ field, sortBy, sortOrder }) => {
  if (sortBy !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />;
  return sortOrder === "asc"
    ? <ChevronUp   className="w-3.5 h-3.5 text-indigo-500" />
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />;
};

const LeadTable = ({ leads, onDelete, onStatusChange, sortBy, sortOrder, onSort }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const handleSort = (field) => {
    onSort(field, sortBy === field && sortOrder === "asc" ? "desc" : "asc");
  };

  const toggleMenu = (id, e) => {
    e.stopPropagation();
    setOpenMenu(openMenu === id ? null : id);
  };

  const closeMenu = () => setOpenMenu(null);

  const STATUS_CYCLE = {
    new: "contacted",
    contacted: "qualified",
    qualified: "converted",
    converted: "converted",
    lost: "lost",
  };

  const columns = [
    { key: "name",      label: "Lead"       },
    { key: "status",    label: "Status"     },
    { key: "source",    label: "Source"     },
    { key: "priority",  label: "Priority"   },
    { key: "company",   label: "Company"    },
    { key: "createdAt", label: "Created"    },
  ];

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <ChevronsUpDown className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-500 font-medium">No leads found</p>
        <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or create a new lead</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" onClick={closeMenu}>
      <table className="w-full text-sm">
        {/* ── Head ── */}
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(({ key, label }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase
                           tracking-wider cursor-pointer hover:text-slate-700 select-none group"
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  <SortIcon field={key} sortBy={sortBy} sortOrder={sortOrder} />
                </span>
              </th>
            ))}
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody className="divide-y divide-slate-50">
          {leads.map((lead, idx) => (
            <tr
              key={lead._id}
              className="hover:bg-slate-50/80 transition-colors cursor-pointer group animate-fadeInUp"
              style={{ animationDelay: `${idx * 30}ms` }}
              onClick={() => navigate(`/leads/${lead._id}`)}
            >
              {/* Lead name + email */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center
                                  text-indigo-700 font-semibold text-sm flex-shrink-0">
                    {lead.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 leading-tight">{lead.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{lead.email}</p>
                  </div>
                </div>
              </td>

              {/* Status — click to advance */}
              <td
                className="px-4 py-3.5"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = STATUS_CYCLE[lead.status];
                  if (next !== lead.status) onStatusChange(lead._id, next);
                }}
                title="Click to advance status"
              >
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
                <span className="text-slate-600">{lead.company || "—"}</span>
              </td>

              {/* Created date */}
              <td className="px-4 py-3.5">
                <span className="text-slate-500 text-xs">
                  {format(new Date(lead.createdAt), "MMM d, yyyy")}
                </span>
              </td>

              {/* Assigned to */}
              <td className="px-4 py-3.5">
                {lead.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center
                                    text-slate-600 text-xs font-semibold">
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

              {/* Actions menu */}
              <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="relative inline-block">
                  <button
                    onClick={(e) => toggleMenu(lead._id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                               hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {openMenu === lead._id && (
                    <div
                      className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg
                                 border border-slate-100 z-20 animate-fadeInUp overflow-hidden"
                    >
                      <button
                        onClick={() => { navigate(`/leads/${lead._id}`); closeMenu(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-4 h-4 text-slate-400" />
                        View Details
                      </button>
                      <button
                        onClick={() => { navigate(`/leads/${lead._id}?edit=true`); closeMenu(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600
                                   hover:bg-slate-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                        Edit Lead
                      </button>
                      <hr className="border-slate-100" />
                      <button
                        onClick={() => { onDelete(lead._id); closeMenu(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600
                                   hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Archive Lead
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