import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { TrendingUp, Users, UserCheck, Star, RefreshCw } from "lucide-react";
import api    from "../api/axios";
import Navbar from "../components/layout/Navbar";
import toast  from "react-hot-toast";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
);

// ── Shared chart defaults ─────────────────────
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
      labels: { padding: 16, font: { size: 12 }, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: "#1e293b",
      titleColor: "#f1f5f9",
      bodyColor: "#94a3b8",
      padding: 12,
      cornerRadius: 8,
    },
  },
};

const STATUS_COLORS = {
  new:       { bg: "#dbeafe", border: "#3b82f6" },
  contacted: { bg: "#fef3c7", border: "#f59e0b" },
  qualified: { bg: "#ede9fe", border: "#8b5cf6" },
  converted: { bg: "#dcfce7", border: "#22c55e" },
  lost:      { bg: "#fee2e2", border: "#ef4444" },
};

const SOURCE_PALETTE = [
  "#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4",
];

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

// ── Small stat card ───────────────────────────
const MiniStat = ({ label, value, icon: Icon, color }) => {
  const MAP = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    green:  "bg-green-50  text-green-600  border-green-100",
    amber:  "bg-amber-50  text-amber-600  border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };
  return (
    <div className="card p-5 flex items-center gap-4 animate-fadeInUp">
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${MAP[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
};

// ── Chart wrapper card ────────────────────────
const ChartCard = ({ title, subtitle, children, height = 260 }) => (
  <div className="card p-5 animate-fadeInUp">
    <div className="mb-4">
      <h3 className="section-title">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    <div style={{ height }}>{children}</div>
  </div>
);

// ── Main component ────────────────────────────
const Analytics = () => {
  const [data,      setData]      = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const { data: res } = await api.get("/leads/analytics");
      setData(res.data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived chart data ──────────────────────
  const statusChartData = data ? {
    labels: data.statusDistribution.map((d) => d._id),
    datasets: [{
      data:            data.statusDistribution.map((d) => d.count),
      backgroundColor: data.statusDistribution.map((d) => STATUS_COLORS[d._id]?.bg     ?? "#e2e8f0"),
      borderColor:     data.statusDistribution.map((d) => STATUS_COLORS[d._id]?.border  ?? "#94a3b8"),
      borderWidth: 2,
      hoverOffset: 6,
    }],
  } : null;

  const sourceChartData = data ? {
    labels: data.sourceDistribution.map((d) =>
      d._id.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    ),
    datasets: [{
      label: "Leads",
      data:            data.sourceDistribution.map((d) => d.count),
      backgroundColor: SOURCE_PALETTE,
      borderColor:     SOURCE_PALETTE,
      borderWidth: 0,
      borderRadius: 6,
    }],
  } : null;

  const timelineChartData = data ? {
    labels: data.leadsOverTime.map(({ _id }) =>
      `${MONTH_NAMES[_id.month - 1]} ${_id.year}`
    ),
    datasets: [
      {
        label: "Total Leads",
        data: data.leadsOverTime.map((d) => d.count),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#6366f1",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: "Converted",
        data: data.leadsOverTime.map((d) => d.converted),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.06)",
        borderWidth: 2.5,
        pointBackgroundColor: "#22c55e",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
    ],
  } : null;

  const priorityChartData = data ? {
    labels: data.priorityDistribution.map((d) =>
      d._id.replace(/\b\w/g, (c) => c.toUpperCase())
    ),
    datasets: [{
      label: "Leads by Priority",
      data: data.priorityDistribution.map((d) => d.count),
      backgroundColor: ["#86efac","#fcd34d","#fca5a5"],
      borderColor:     ["#22c55e","#f59e0b","#ef4444"],
      borderWidth: 2,
      borderRadius: 6,
    }],
  } : null;

  // ── Loading skeleton ────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Analytics" />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse h-24">
                <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
                <div className="h-7 bg-slate-100 rounded w-12" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-5 animate-pulse h-80">
                <div className="h-4 bg-slate-100 rounded w-32 mb-4" />
                <div className="h-full bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Analytics" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Header Row ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Performance Overview</h2>
            <p className="text-sm text-slate-400">Real-time CRM metrics and trends</p>
          </div>
          <button onClick={fetchAnalytics} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MiniStat
            label="Total Leads"
            value={summary.totalLeads}
            icon={Users}
            color="indigo"
          />
          <MiniStat
            label="New Leads"
            value={summary.newLeads}
            icon={Star}
            color="amber"
          />
          <MiniStat
            label="Converted"
            value={summary.convertedLeads}
            icon={UserCheck}
            color="green"
          />
          <MiniStat
            label="Conversion Rate"
            value={`${summary.conversionRate}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* ── Charts Row 1: Timeline + Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline — wide */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Leads Over Time"
              subtitle="Monthly lead volume vs. conversions (last 6 months)"
              height={280}
            >
              {timelineChartData ? (
                <Line
                  data={timelineChartData}
                  options={{
                    ...CHART_DEFAULTS,
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: "#94a3b8" },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: "#f1f5f9" },
                        ticks: {
                          stepSize: 1,
                          font: { size: 11 },
                          color: "#94a3b8",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-300 text-sm">
                  Not enough data yet
                </div>
              )}
            </ChartCard>
          </div>

          {/* Status Doughnut */}
          <ChartCard
            title="Lead Status"
            subtitle="Current pipeline distribution"
            height={280}
          >
            {statusChartData ? (
              <Doughnut
                data={statusChartData}
                options={{
                  ...CHART_DEFAULTS,
                  cutout: "65%",
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: {
                      ...CHART_DEFAULTS.plugins.legend,
                      position: "bottom",
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">
                No data
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Charts Row 2: Source + Priority ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Bar */}
          <ChartCard
            title="Leads by Source"
            subtitle="Which channels bring the most leads"
            height={260}
          >
            {sourceChartData ? (
              <Bar
                data={sourceChartData}
                options={{
                  ...CHART_DEFAULTS,
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 11 }, color: "#94a3b8" },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: "#f1f5f9" },
                      ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        color: "#94a3b8",
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">
                No data
              </div>
            )}
          </ChartCard>

          {/* Priority Bar */}
          <ChartCard
            title="Leads by Priority"
            subtitle="Distribution of lead urgency levels"
            height={260}
          >
            {priorityChartData ? (
              <Bar
                data={priorityChartData}
                options={{
                  ...CHART_DEFAULTS,
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: { display: false },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 12 }, color: "#94a3b8" },
                    },
                    y: {
                      beginAtZero: true,
                      grid: { color: "#f1f5f9" },
                      ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        color: "#94a3b8",
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300 text-sm">
                No data
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Source Table ── */}
        <div className="card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="section-title">Source Performance Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Detailed view of each lead source</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Source","Lead Count","Share","Bar"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold
                                           text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.sourceDistribution ?? []).map(({ _id: src, count }, i) => {
                  const pct = summary.totalLeads
                    ? Math.round((count / summary.totalLeads) * 100)
                    : 0;
                  return (
                    <tr key={src} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-700 capitalize">
                        {src.replace("_", " ")}
                      </td>
                      <td className="px-6 py-3.5 text-slate-600 font-semibold">{count}</td>
                      <td className="px-6 py-3.5 text-slate-500">{pct}%</td>
                      <td className="px-6 py-3.5 w-48">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: SOURCE_PALETTE[i % SOURCE_PALETTE.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Analytics;