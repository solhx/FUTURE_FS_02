import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Edit2, MessageSquare, Mail, Phone,
  Building2, Calendar, DollarSign, Tag, Check, X,
  Clock, User,
} from "lucide-react";
import api from "../api/axios";
import Navbar     from "../components/layout/Navbar";
import LeadForm   from "../components/leads/LeadForm";
import NoteModal  from "../components/leads/NoteModal";
import { StatusBadge, PriorityBadge, SourceBadge } from "../components/ui/Badge";
import Modal      from "../components/ui/Modal";
import toast      from "react-hot-toast";
import { format } from "date-fns";

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-700 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const LeadDetail = () => {
  const { id }              = useParams();
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();

  const [lead,       setLead]       = useState(null);
  const [isLoading,  setIsLoading]  = useState(true);
  const [showEdit,   setShowEdit]   = useState(searchParams.get("edit") === "true");
  const [showNotes,  setShowNotes]  = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [noteLoading,setNoteLoading]= useState(false);

  useEffect(() => { fetchLead(); }, [id]); // eslint-disable-line

  const fetchLead = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/leads/${id}`);
      setLead(data.data);
    } catch {
      toast.error("Lead not found");
      navigate("/leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (payload) => {
    try {
      setIsSaving(true);
      const { data } = await api.put(`/leads/${id}`, payload);
      setLead(data.data);
      setShowEdit(false);
      toast.success("Lead updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update lead");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.patch(`/leads/${id}/status`, { status });
      setLead(data.data);
      toast.success(`Status updated to "${status}"`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAddNote = async (content) => {
    try {
      setNoteLoading(true);
      const { data } = await api.post(`/leads/${id}/notes`, { content });
      setLead(data.data);
      toast.success("Note added!");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const { data } = await api.delete(`/leads/${id}/notes/${noteId}`);
      setLead(data.data);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Lead Details" />

      <main className="flex-1 overflow-y-auto p-6">
        {/* ── Breadcrumb / Back ── */}
        <button
          onClick={() => navigate("/leads")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
                     transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>

        {/* ── Hero Card ── */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Left — avatar + info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center
                              text-white text-2xl font-bold flex-shrink-0">
                {lead.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{lead.name}</h2>
                <p className="text-slate-500 mt-0.5">{lead.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge   status={lead.status}     />
                  <PriorityBadge priority={lead.priority} />
                  <SourceBadge   source={lead.source}     />
                </div>
              </div>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowNotes(true)}
                className="btn-secondary relative"
              >
                <MessageSquare className="w-4 h-4" />
                Notes
                {lead.notes?.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white
                                   text-xs rounded-full flex items-center justify-center font-bold">
                    {lead.notes.length}
                  </span>
                )}
              </button>
              <button onClick={() => setShowEdit(true)} className="btn-primary">
                <Edit2 className="w-4 h-4" />
                Edit Lead
              </button>
            </div>
          </div>
        </div>

        {/* ── Detail Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <div className="card p-5">
            <h3 className="section-title mb-2">Contact Information</h3>
            <InfoRow icon={Mail}      label="Email"   value={lead.email}          />
            <InfoRow icon={Phone}     label="Phone"   value={lead.phone}          />
            <InfoRow icon={Building2} label="Company" value={lead.company}        />
            <InfoRow icon={Tag}       label="Service" value={lead.service}        />
            {lead.budget && (
              <InfoRow
                icon={DollarSign}
                label="Budget"
                value={`$${lead.budget.toLocaleString()}`}
              />
            )}
          </div>

          {/* Lead Info */}
          <div className="card p-5">
            <h3 className="section-title mb-2">Lead Information</h3>
            <InfoRow
              icon={Calendar}
              label="Created"
              value={format(new Date(lead.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            />
            {lead.lastContactedAt && (
              <InfoRow
                icon={Clock}
                label="Last Contacted"
                value={format(new Date(lead.lastContactedAt), "MMMM d, yyyy")}
              />
            )}
            {lead.followUpDate && (
              <InfoRow
                icon={Calendar}
                label="Follow-up Date"
                value={format(new Date(lead.followUpDate), "MMMM d, yyyy")}
              />
            )}
            {lead.assignedTo && (
              <InfoRow
                icon={User}
                label="Assigned To"
                value={lead.assignedTo.name}
              />
            )}
            {lead.message && (
              <div className="py-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Original Message
                </p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
                  {lead.message}
                </p>
              </div>
            )}
          </div>

                   {/* Status Pipeline */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Update Status</h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s, i) => {
                const isActive = lead.status === s;
                const isPast   = STATUS_OPTIONS.indexOf(lead.status) > i;
                return (
                  <button
                    key={s}
                    onClick={() => !isActive && handleStatusChange(s)}
                    disabled={isActive}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border
                                text-sm font-medium transition-all duration-200 capitalize
                      ${isActive
                        ? "bg-indigo-600 text-white border-indigo-600 cursor-default shadow-md shadow-indigo-100"
                        : isPast
                          ? "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 cursor-pointer"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer"
                      }`}
                  >
                    {/* Step indicator */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isActive
                          ? "border-white bg-white/20"
                          : isPast
                            ? "border-slate-300 bg-slate-300"
                            : "border-current"
                        }`}
                    >
                      {(isActive || isPast) && (
                        <Check className={`w-3 h-3 ${isActive ? "text-white" : "text-white"}`} />
                      )}
                    </div>

                    <span className="flex-1 text-left">{s}</span>

                    {isActive && (
                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick stats */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{lead.notes?.length ?? 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">Notes</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-800">
                  {lead.budget ? `$${lead.budget.toLocaleString()}` : "—"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Budget</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Notes Preview ── */}
        {lead.notes?.length > 0 && (
          <div className="card mt-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="section-title">Recent Notes</h3>
              <button
                onClick={() => setShowNotes(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                View all {lead.notes.length} notes →
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {lead.notes.slice(0, 3).map((note) => (
                <div key={note._id} className="px-6 py-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{note.createdByName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Edit Modal ── */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Lead"
        size="lg"
      >
        <LeadForm
          initialData={lead}
          onSubmit={handleUpdate}
          onCancel={() => setShowEdit(false)}
          isLoading={isSaving}
        />
      </Modal>

      {/* ── Notes Modal ── */}
      <NoteModal
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        lead={lead}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        isLoading={noteLoading}
      />
    </div>
  );
};

export default LeadDetail;