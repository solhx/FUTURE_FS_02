const STATUS_STYLES = {
  new:        "bg-blue-100 text-blue-700 border-blue-200",
  contacted:  "bg-amber-100 text-amber-700 border-amber-200",
  qualified:  "bg-purple-100 text-purple-700 border-purple-200",
  converted:  "bg-green-100 text-green-700 border-green-200",
  lost:       "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_STYLES = {
  low:    "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-orange-100 text-orange-700 border-orange-200",
  high:   "bg-red-100 text-red-700 border-red-200",
};

const SOURCE_STYLES = {
  website:        "bg-cyan-100 text-cyan-700 border-cyan-200",
  referral:       "bg-indigo-100 text-indigo-700 border-indigo-200",
  social_media:   "bg-pink-100 text-pink-700 border-pink-200",
  email_campaign: "bg-violet-100 text-violet-700 border-violet-200",
  cold_call:      "bg-teal-100 text-teal-700 border-teal-200",
  other:          "bg-slate-100 text-slate-600 border-slate-200",
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.new}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
    {status}
  </span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium}`}>
    {priority}
  </span>
);

export const SourceBadge = ({ source }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${SOURCE_STYLES[source] || SOURCE_STYLES.other}`}>
    {source?.replace("_", " ")}
  </span>
);