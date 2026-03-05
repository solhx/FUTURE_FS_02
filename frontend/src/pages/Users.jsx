
import { useState, useEffect } from "react";
import { Users as UsersIcon, Shield, ShieldCheck, UserCheck, Search, Plus, Edit2, Check, X } from "lucide-react";
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
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
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
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
                      {editingId !== user._id && (
                        <button
                          onClick={() => { setEditingId(user._id); setNewRole(user.role); }}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
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
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Users;

