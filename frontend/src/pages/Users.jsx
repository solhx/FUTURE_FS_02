import { useState, useEffect } from "react";
import { Users as UsersIcon, Shield, ShieldCheck, UserCheck, Search, Edit2, Check, X, ToggleLeft, ToggleRight, Clock, Trash2, Plus } from "lucide-react";
import api from "../api/axios";
import Navbar from "../components/layout/Navbar";
import toast from "react-hot-toast";
import { format } from "date-fns";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, approved

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/auth/users");
      setUsers(data.data);
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId) => {
    if (!newRole) return;
    try {
      const { data } = await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(data.message);
      setEditingId(null);
      setNewRole("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleApprove = async (userId) => {
    try {
      const { data } = await api.put(`/auth/users/${userId}/approve`);
      setUsers(users.map(u => u._id === userId ? { ...u, isApproved: true, approvedAt: new Date() } : u));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve user");
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this registration? This will permanently delete the user.")) {
      return;
    }
    try {
      const { data } = await api.delete(`/auth/users/${userId}/reject`);
      setUsers(users.filter(u => u._id !== userId));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject user");
    }
  };

  const handleActivate = async (userId, currentStatus) => {
    try {
      const { data } = await api.put(`/auth/users/${userId}/activate`, { isActive: !currentStatus });
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "pending") return matchesSearch && !u.isApproved;
    if (filter === "approved") return matchesSearch && u.isApproved;
    return matchesSearch;
  });

  const pendingCount = users.filter(u => !u.isApproved).length;

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin": return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case "manager": return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <UserCheck className="w-4 h-4 text-green-500" />;
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: "bg-purple-100 text-purple-700 border-purple-200",
      manager: "bg-blue-100 text-blue-700 border-blue-200",
      agent: "bg-green-100 text-green-700 border-green-200",
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[role] || styles.agent} capitalize`}>
        {role}
      </span>
    );
  };

  const getApprovalBadge = (user) => {
    if (user.isApproved) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
          <Check className="w-3 h-3" />
          Approved
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar title="User Management" />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Users</h1>
            <p className="text-slate-500 mt-1">Manage team members and their roles</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {pendingCount} pending approval{pendingCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === "all" 
                  ? "bg-indigo-600 text-white" 
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${
                filter === "pending" 
                  ? "bg-amber-600 text-white" 
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 ${
                filter === "approved" 
                  ? "bg-green-600 text-white" 
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Approved
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className={`hover:bg-slate-50/50 transition-colors ${!user.isActive ? "opacity-60" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-indigo-600 font-semibold ${
                          !user.isApproved ? "bg-amber-100" : "bg-indigo-100"
                        }`}>
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {getApprovalBadge(user)}
                        {!user.isActive && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 w-fit">
                            <X className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {editingId === user._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="input-field py-1.5 px-2 text-sm"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="agent">Agent</option>
                          </select>
                          <button
                            onClick={() => handleRoleChange(user._id)}
                            className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setNewRole(""); }}
                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          {getRoleBadge(user.role)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy 'at' h:mm a") : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Approve Button - Only show for pending users */}
                        {!user.isApproved && (
                          <button
                            onClick={() => handleApprove(user._id)}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                            title="Approve user"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Reject Button - Only show for pending users */}
                        {!user.isApproved && (
                          <button
                            onClick={() => handleReject(user._id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Reject user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Activate/Deactivate Button */}
                        <button
                          onClick={() => handleActivate(user._id, user.isActive)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.isActive 
                              ? "text-amber-600 hover:bg-amber-50" 
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={user.isActive ? "Deactivate user" : "Activate user"}
                        >
                          {user.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit Role Button */}
                        {editingId !== user._id && (
                          <button
                            onClick={() => { setEditingId(user._id); setNewRole(user.role); }}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit role"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <UsersIcon className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No users found</p>
              <p className="text-sm text-slate-400 mt-1">
                {filter === "pending" 
                  ? "No pending registrations" 
                  : filter === "approved"
                  ? "No approved users"
                  : "Try adjusting your search"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Users;

