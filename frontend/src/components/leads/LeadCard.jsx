import { useNavigate } from "react-router-dom";
import { Mail, Phone, Building2, Calendar, MessageSquare } from "lucide-react";
import { StatusBadge, PriorityBadge } from "../ui/Badge";
import { format } from "date-fns";

const LeadCard = ({ lead, onStatusChange }) => {
  const navigate = useNavigate();

  const STATUS_NEXT = {
    new: "contacted",
    contacted: "qualified",
    qualified: "converted",
  };

  return (
    <div
      className="card p-5 hover:shadow-md transition-all duration-200 cursor-pointer
                 animate-fadeInUp group"
      onClick={() => navigate(`/leads/${lead._id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center
                          text-indigo-700 font-bold text-base flex-shrink-0">
            {lead.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800 leading-tight">{lead.name}</p>
            {lead.company && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />
                {lead.company}
              </p>
            )}
          </div>
        </div>
        <PriorityBadge priority={lead.priority} />
      </div>

      {/* Contact */}
      <div className="space-y-1.5 mb-3">
        <a
          href={`mailto:${lead.email}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          {lead.email}
        </a>
        {lead.phone && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Phone className="w-3.5 h-3.5" />
            {lead.phone}
          </p>
        )}
      </div>

      {/* Status + Notes count */}
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={lead.status} />
        {lead.notes?.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare className="w-3.5 h-3.5" />
            {lead.notes.length} note{lead.notes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(lead.createdAt), "MMM d, yyyy")}
        </span>

        {STATUS_NEXT[lead.status] && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(lead._id, STATUS_NEXT[lead.status]);
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800
                       hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
          >
            Mark {STATUS_NEXT[lead.status]} →
          </button>
        )}
      </div>
    </div>
  );
};

export default LeadCard;