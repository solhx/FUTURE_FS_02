import { useState } from "react";
import { Send, Trash2, User, Clock } from "lucide-react";
import { format } from "date-fns";
import Modal from "../ui/Modal";

const NoteModal = ({ isOpen, onClose, lead, onAddNote, onDeleteNote, isLoading }) => {
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onAddNote(content.trim());
    setContent("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Notes — ${lead?.name}`} size="md">
      {/* Note input */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Add a follow-up note
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Spoke with the client about pricing, they'll get back next week..."
          className="input-field resize-none mb-3"
          maxLength={1000}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{content.length} / 1000</span>
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="btn-primary"
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Saving..." : "Add Note"}
          </button>
        </div>
      </form>

      {/* Notes list */}
      <div>
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          History ({lead?.notes?.length || 0})
        </h4>

        {!lead?.notes || lead.notes.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No notes yet. Add your first note above.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {lead.notes.map((note) => (
              <div
                key={note._id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-100 group animate-fadeInUp"
              >
                <p className="text-slate-700 text-sm leading-relaxed">{note.content}</p>
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{note.createdByName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note._id)}
                    className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50
                               transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default NoteModal;