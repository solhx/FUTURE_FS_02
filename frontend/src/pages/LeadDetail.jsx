import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Edit2, MessageSquare, Mail, Phone,
  Building2, Calendar, DollarSign, Tag, Check,
  Clock, User, Archive, Trash2, RotateCcw,
} from "lucide-react";
import api        from "../api/axios";
import Navbar     from "../components/layout/Navbar";
import LeadForm   from "../components/leads/LeadForm";
import NoteModal  from "../components/leads/NoteModal";
import { StatusBadge, PriorityBadge, SourceBadge } from "../components/ui/Badge";
import Modal      from "../components/ui/Modal";
import toast      from "react-hot-toast";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";

// ── Info row ──────────────────────────────────
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

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"];

// ── Main component ────────────────────────────
const LeadDetail = () => {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { user }       = useAuth();

  const isAgent = user?.role === "agent";

  const [lead,        setLead]        = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [showEdit,    setShowEdit]    = useState(searchParams.get("edit") === "true");
  const [showNotes,   setShowNotes]   = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);

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

  // ── Update lead ────────────────────────────
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

  // ── Status change ──────────────────────────
  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.patch(`/leads/${id}/status`, { status });
      setLead(data.data);
      toast.success(`Status updated to "${status}"`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ── Archive lead ───────────────────────────
  const handleArchive = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-white">
            Archive <span className="text-amber-400">{lead.name}</span>?
          </p>
          <p className="text-xs text-slate-400">
            This lead will be moved to the Archived section.
            You can restore it at any time.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.delete(`/leads/${id}`);
                  toast.success("Lead archived successfully");
                  navigate("/leads");
                } catch {
                  toast.error("Failed to archive lead");
                }
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs
                         font-medium py-1.5 px-3 rounded-lg transition-colors"
            >
              Yes, Archive
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

  // ── Permanent delete ───────────────────────
  const handlePermanentDelete = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-white">
            Permanently delete{" "}
            <span className="text-red-400">{lead.name}</span>?
          </p>
          <p className="text-xs text-slate-400">
            This action{" "}
            <span className="text-red-400 font-semibold">cannot be undone</span>.
            All notes and data will be lost forever.
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.delete(`/leads/${id}/permanent`);
                  toast.success("Lead permanently deleted");
                  navigate("/leads");
                } catch {
                  toast.error("Failed to delete lead");
                }
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

  // ── Restore (if viewing from archived) ────
  const handleRestore = async () => {
    try {
      await api.put(`/leads/${id}`, { isArchived: false });
      toast.success("Lead restored successfully! ✅");
      fetchLead();
    } catch {
      toast.error("Failed to restore lead");
    }
  };

  // ── Notes ──────────────────────────────────
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

  // ── Loading ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent
                          rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const isArchived = lead.isArchived;

  // ── Render ─────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Lead Details" />

      <main className="flex-1 overflow-y-auto p-6">

        {/* ── Back button ── */}
        <button
          onClick={() => navigate(isArchived ? "/archived" : "/leads")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800
                     transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {isArchived ? "Archived Leads" : "Leads"}
        </button>

        {/* ── Archived banner ── */}
        {isArchived && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5
                          flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                This lead is archived and hidden from the active leads list.
              </p>
            </div>
            {!isAgent && (
            <button
              onClick={handleRestore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600
                         hover:bg-amber-700 text-white text-xs font-medium
                         rounded-lg transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Lead
            </button>
            )}
          </div>
        )}

        {/* ── Hero card ── */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

            {/* Left — avatar + info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center
                              justify-center text-white text-2xl font-bold flex-shrink-0">
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

            {/* Right — action buttons */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              {/* Notes */}
              <button
                onClick={() => setShowNotes(true)}
                className="btn-secondary relative"
              >
                <MessageSquare className="w-4 h-4" />
                Notes
                {lead.notes?.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600
                                   text-white text-xs rounded-full flex items-center
                                   justify-center font-bold">
                    {lead.notes.length}
                  </span>
                )}
              </button>

              {/* Edit */}
              {!isArchived && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="btn-primary"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Lead
                </button>
              )}

              {/* Archive / Restore */}
              {!isAgent && (isArchived ? (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                             text-sm bg-green-50 hover:bg-green-100 text-green-700
                             border border-green-200 transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              ) : (
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                             text-sm bg-amber-50 hover:bg-amber-100 text-amber-700
                             border border-amber-200 transition-all duration-200"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              ))}

              {/* Permanent delete */}
              {!isAgent && (
              <button
                onClick={handlePermanentDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                           text-sm bg-red-50 hover:bg-red-100 text-red-700
                           border border-red-200 transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Detail grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Contact Info */}
          <div className="card p-5">
            <h3 className="section-title mb-2">Contact Information</h3>
            <InfoRow icon={Mail}      label="Email"   value={lead.email}   />
            <InfoRow icon={Phone}     label="Phone"   value={lead.phone}   />
            <InfoRow icon={Building2} label="Company" value={lead.company} />
            <InfoRow icon={Tag}       label="Service" value={lead.service} />
            {lead.budget && (
              <InfoRow
                icon={DollarSign}
                label="Budget"
                value={`${lead.budget.toLocaleString()}`}
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

          {/* Status pipeline */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Update Status</h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s, i) => {
                const isActive = lead.status === s;
                const isPast   = STATUS_OPTIONS.indexOf(lead.status) > i;
                return (
                  <button
                    key={s}
                    onClick={() => !isActive && !isArchived && handleStatusChange(s)}
                    disabled={isActive || isArchived}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border
                                text-sm font-medium transition-all duration-200 capitalize
                      ${isActive
                        ? "bg-indigo-600 text-white border-indigo-600 cursor-default shadow-md shadow-indigo-100"
                        : isPast
                          ? "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100 cursor-pointer"
                          : isArchived
                            ? "bg-white text-slate-300 border-slate-100 cursor-not-allowed"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 cursor-pointer"
                      }`}
                  >
                    {/* Step circle */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center
                                  justify-center flex-shrink-0
                        ${isActive
                          ? "border-white bg-white/20"
                          : isPast
                            ? "border-slate-300 bg-slate-300"
                            : "border-current"
                        }`}
                    >
                      {(isActive || isPast) && (
                        <Check className="w-3 h-3 text-white" />
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
                <p className="text-lg font-bold text-slate-800">
                  {lead.notes?.length ?? 0}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Notes</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-800">
                  {lead.budget ? `
${lead.budget.toLocaleString()}` : "—"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Budget</p>
              </div>
            </div>

            {/* Danger zone */}
            {!isAgent && (
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Danger Zone
              </p>

              {/* Archive / Restore */}
              {isArchived ? (
                <button
                  onClick={handleRestore}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                             bg-green-50 hover:bg-green-100 text-green-700 text-sm
                             font-medium border border-green-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore this Lead
                </button>
              ) : (
                <button
                  onClick={handleArchive}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                             bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm
                             font-medium border border-amber-200 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  Archive this Lead
                </button>
              )}

              {/* Permanent delete */}
              <button
                onClick={handlePermanentDelete}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
                           bg-red-50 hover:bg-red-100 text-red-700 text-sm
                           font-medium border border-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Forever
              </button>
            </div>
            )}
          </div>
        </div>

        {/* ── Recent Notes Preview ── */}
        {lead.notes?.length > 0 && (
          <div className="card mt-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="section-title">Recent Notes</h3>
              <button
                onClick={() => setShowNotes(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800
                           font-medium transition-colors"
              >
                View all {lead.notes.length} notes →
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {lead.notes.slice(0, 3).map((note) => (
                <div key={note._id} className="px-6 py-4">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {note.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {note.createdByName}
                    </span>
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