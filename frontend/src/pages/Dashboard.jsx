import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, TrendingUp, UserCheck, Star,
  ArrowRight, Clock, Plus,
} from "lucide-react";
import api from "../api/axios";
import StatCard from "../components/ui/StatCard";
import { StatusBadge, PriorityBadge } from "../components/ui/Badge";
import Navbar from "../components/layout/Navbar";
import { format } from "date-fns";
import toast from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, leadsRes] = await Promise.all([
        api.get("/leads/analytics"),
        api.get("/leads?limit=5&sortBy=createdAt&sortOrder=desc"),
      ]);
      setAnalytics(analyticsRes.data.data);
      setRecentLeads(leadsRes.data.data);
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const stats = analytics?.summary;

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
          <div className="h-8 bg-slate-100 rounded w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="Dashboard" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* ── Stats ── */}
        {isLoading ? <StatsSkeleton /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Leads"
              value={stats?.totalLeads ?? 0}
              icon={Users}
              color="indigo"
              subtitle="All time"
            />
            <StatCard
              title="New Leads"
              value={stats?.newLeads ?? 0}
              icon={Star}
              color="amber"
              subtitle="Awaiting contact"
            />
            <StatCard
              title="Converted"
              value={stats?.convertedLeads ?? 0}
              icon={UserCheck}
              color="green"
              subtitle="Successful conversions"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats?.conversionRate ?? 0}%`}
              icon={TrendingUp}
              color="purple"
              subtitle={`${stats?.recentLeads ?? 0} new this week`}
            />
          </div>
        )}

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leads */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="section-title">Recent Leads</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/leads?modal=new")}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Lead
                </button>
                <button
                  onClick={() => navigate("/leads")}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-100" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-slate-100 rounded w-32 mb-2" />
                      <div className="h-3 bg-slate-100 rounded w-48" />
                    </div>
                    <div className="h-5 bg-slate-100 rounded-full w-16" />
                  </div>
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium">No leads yet</p>
                <p className="text-slate-300 text-sm">Create your first lead to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentLeads.map((lead) => (
                  <div
                    key={lead._id}
                    onClick={() => navigate(`/leads/${lead._id}`)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70
                               cursor-pointer transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center
                                    text-indigo-700 font-semibold text-sm flex-shrink-0">
                      {lead.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-slate-400 truncate">{lead.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge   status={lead.status}     />
                      <PriorityBadge priority={lead.priority} />
                    </div>
                    <span className="text-xs text-slate-400 hidden md:block flex-shrink-0">
                      {format(new Date(lead.createdAt), "MMM d")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="section-title">Status Breakdown</h2>
            </div>
            <div className="p-6 space-y-4">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex justify-between mb-1.5">
                      <div className="h-3 bg-slate-100 rounded w-20" />
                      <div className="h-3 bg-slate-100 rounded w-8" />
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full" />
                  </div>
                ))
              ) : (
                <>
                  {(analytics?.statusDistribution || []).map(({ _id: status, count }) => {
                    const total = stats?.totalLeads || 1;
                    const pct   = Math.round((count / total) * 100);
                    const COLORS = {
                      new:       "bg-blue-500",
                      contacted: "bg-amber-500",
                      qualified: "bg-purple-500",
                      converted: "bg-green-500",
                      lost:      "bg-red-400",
                    };
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 capitalize">{status}</span>
                          <span className="text-sm font-semibold text-slate-800">
                            {count} <span className="text-slate-400 font-normal text-xs">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${COLORS[status] || "bg-slate-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Follow-ups due */}
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {stats?.recentLeads ?? 0} new leads this week
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;