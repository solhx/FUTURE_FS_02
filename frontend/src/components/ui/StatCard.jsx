const StatCard = ({ title, value, icon: Icon, color = "indigo", subtitle, trend }) => {
  const colors = {
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-100" },
    green:  { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100"  },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  border: "border-amber-100"  },
    red:    { bg: "bg-red-50",    icon: "text-red-600",    border: "border-red-100"    },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className="card p-5 animate-fadeInUp hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-medium mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% this month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.bg} border ${c.border}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;