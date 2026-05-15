import React, { useState, useEffect } from "react";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/AuthContext";
import { useTranslation } from "react-i18next";

export default function UserManagement() {
  const { t, i18n } = useTranslation();
  const { profile, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const isAR = i18n.language === "ar";

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch all profiles in the same club (or all if super_admin)
      let query = supabase.from("profiles").select("*, clubs(name)");
      
      if (profile?.role !== "super_admin") {
        query = query.eq("club_id", profile.club_id);
      }

      const { data: userData, error: userError } = await query;
      if (userError) throw userError;

      // Fetch roles for the dropdown
      const { data: roleData, error: roleError } = await supabase
        .from("role_permissions")
        .select("*");
      
      if (roleError) throw roleError;

      setUsers(userData || []);
      setRoles(roleData || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Error updating role: " + err.message);
    } finally {
      setUpdating(null);
    }
  }

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!can("users", "read")) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t("common_access_denied", "Access Denied")}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t("users_title", "User Management")}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t("users_subtitle", "Manage team members and their system permissions")}
          </p>
        </div>
        
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">🔍</span>
          <input
            type="text"
            placeholder={t("common_search", "Search...")}
            className="bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white w-full md:w-64 focus:ring-2 focus:ring-red-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("users_member", "Member")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("users_club", "Club")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("users_role", "Assigned Role")}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("users_permissions", "Effective Permissions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const currentRole = roles.find(r => r.role === u.role);
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-sm font-black text-white border border-gray-600">
                              {u.full_name?.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                                {u.full_name}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {u.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-400">
                            {u.clubs?.name || "Global / N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {can("users", "assign_roles") ? (
                            <select
                              disabled={updating === u.id}
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer hover:border-gray-600 transition-all disabled:opacity-50"
                            >
                              {roles.map(r => (
                                <option key={r.role} value={r.role}>
                                  {isAR ? r.label_ar : r.label_en}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" 
                              style={{ backgroundColor: (currentRole?.color || '#374151') + '20', color: currentRole?.color || '#9CA3AF' }}>
                              {isAR ? currentRole?.label_ar : currentRole?.label_en}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1 flex-wrap max-w-xs">
                             {currentRole?.permissions && Object.entries(currentRole.permissions).slice(0, 4).map(([key, val]) => (
                               val.read && (
                                 <span key={key} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                                   {key}
                                 </span>
                               )
                             ))}
                             {Object.keys(currentRole?.permissions || {}).length > 4 && (
                               <span className="text-[10px] text-gray-600">...</span>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                      {t("common_no_results", "No users found")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Guide (Optional) */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.slice(0, 3).map(r => (
             <div key={r.role} className="p-4 bg-gray-900/30 border border-gray-800 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{r.icon}</span>
                  <h3 className="font-bold text-sm" style={{ color: r.color }}>{isAR ? r.label_ar : r.label_en}</h3>
                </div>
                <p className="text-[10px] text-gray-500">
                  {Object.keys(r.permissions).filter(k => r.permissions[k].write).length} {t("users_write_modules", "Write modules available")}
                </p>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
