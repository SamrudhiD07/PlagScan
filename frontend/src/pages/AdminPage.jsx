import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

export default function AdminPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get("/admin/users", token)
      .then(d => setUsers(d.users || []))
      .catch(e => setError(e.message || "Failed to fetch users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const toggleRole = async (u) => {
    if (u._id === currentUser.id) return alert("You cannot change your own role.");
    const newRole = u.role === "admin" ? "user" : "admin";
    
    setUpdating(u._id);
    try {
      await api.post(`/admin/users/${u._id}/role`, { role: newRole }, token);
      setUsers(users.map(user => user._id === u._id ? { ...user, role: newRole } : user));
    } catch (e) {
      alert(e.message || "Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const deleteUser = async (u) => {
    if (u._id === currentUser.id) return alert("You cannot delete yourself.");
    if (!window.confirm(`Are you sure you want to delete ${u.name}? This will also delete all their scan history.`)) return;

    setUpdating(u._id);
    try {
      await api.delete(`/admin/users/${u._id}`, token);
      setUsers(users.filter(user => user._id !== u._id));
    } catch (e) {
      alert(e.message || "Failed to delete user");
    } finally {
      setUpdating(null);
    }
  };

  if (loading && users.length === 0) return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:60, color:"var(--text-muted)", justifyContent:"center" }}>
      <span className="spinner" style={{width:24,height:24}} /> Loading User Management…
    </div>
  );

  return (
    <div style={{ maxWidth:1000, margin:"0 auto", padding:"40px 32px 80px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>User Management</h1>
          <span style={{ padding:"4px 12px", background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:20, fontSize:12, color:"var(--text-muted)" }}>{users.length} total</span>
        </div>
        <button onClick={fetchUsers} className="btn-secondary" style={{ padding:"8px 16px", fontSize:13 }}>Refresh</button>
      </div>

      {error && (
        <div style={{ padding:16, background:"var(--danger-alpha)", border:"1px solid var(--danger)", borderRadius:8, color:"var(--danger)", marginBottom:24, fontSize:14 }}>
          {error}
        </div>
      )}

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", textAlign:"left" }}>
          <thead>
            <tr style={{ background:"var(--surface-2)", borderBottom:"1px solid var(--border)" }}>
              <th style={{ padding:"16px 20px", fontSize:12, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase" }}>User</th>
              <th style={{ padding:"16px 20px", fontSize:12, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase" }}>Role</th>
              <th style={{ padding:"16px 20px", fontSize:12, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase" }}>Joined</th>
              <th style={{ padding:"16px 20px", fontSize:12, fontWeight:700, color:"var(--text-dim)", textTransform:"uppercase", textAlign:"right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} style={{ borderBottom:"1px solid var(--border)", opacity: updating === u._id ? 0.6 : 1, transition:"opacity 0.2s" }}>
                <td style={{ padding:"16px 20px" }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{u.name}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{u.email}</div>
                  {u._id === currentUser.id && <span style={{ fontSize:10, background:"var(--surface-2)", padding:"2px 6px", borderRadius:4, marginTop:4, display:"inline-block" }}>You</span>}
                </td>
                <td style={{ padding:"16px 20px" }}>
                  <span style={{ 
                    padding:"4px 10px", 
                    borderRadius:20, 
                    fontSize:11, 
                    fontWeight:700, 
                    background: u.role === "admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(59, 130, 246, 0.15)",
                    color: u.role === "admin" ? "#a855f7" : "#3b82f6",
                    border: `1px solid ${u.role === "admin" ? "rgba(168, 85, 247, 0.2)" : "rgba(59, 130, 246, 0.2)"}`
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding:"16px 20px", fontSize:13, color:"var(--text-muted)" }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding:"16px 20px", textAlign:"right" }}>
                  <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                    <button 
                      onClick={() => toggleRole(u)}
                      disabled={updating || u._id === currentUser.id}
                      className="btn-secondary"
                      style={{ padding:"6px 12px", fontSize:11, background: "var(--surface-2)" }}
                    >
                      {u.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button 
                      onClick={() => deleteUser(u)}
                      disabled={updating || u._id === currentUser.id}
                      className="btn-danger"
                      style={{ padding:"6px 12px", fontSize:11, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}