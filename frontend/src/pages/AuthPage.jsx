import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../utils/api";

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const data = await api.post(endpoint, payload);
      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, background:"var(--bg)", transition:"background 0.3s" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:24, padding:"56px 48px", width:"100%", maxWidth:460, boxShadow:"var(--shadow)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
          <span style={{ fontSize:32, color:"var(--accent)", filter:"drop-shadow(var(--glow))" }}>⬡</span>
          <span style={{ fontFamily:"var(--font-display)", fontSize:30, fontWeight:800, color:"var(--text)", letterSpacing:-1 }}>PlagScan</span>
        </div>
        <p style={{ color:"var(--text-muted)", fontSize:14, marginBottom:36, fontWeight:500 }}>Semantic plagiarism detection powered by NLP</p>

        <div style={{ display:"flex", background:"var(--bg)", borderRadius:10, padding:4, gap:4, marginBottom:32, border:"1px solid var(--border)" }}>
          {["login","register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex:1, padding:"10px", borderRadius:7, background: mode===m ? "var(--accent)" : "transparent",
                color: mode===m ? "#fff" : "var(--text-muted)", fontSize:14, fontWeight:600, transition:"all 0.2s" }}>
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {mode === "register" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <label style={{ fontSize:12, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Full Name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Jane Doe" required />
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <label style={{ fontSize:12, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@university.edu" required />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <label style={{ fontSize:12, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
          </div>
          {mode === "register" && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <label style={{ fontSize:12, color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Select Role</label>
              <select name="role" value={form.role} onChange={handle}>
                <option value="user">Student / Researcher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          )}
          {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid var(--danger)", color:"var(--danger)", padding:"12px 14px", borderRadius:8, fontSize:13, fontWeight:500 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ background:"var(--accent)", color:"#fff", padding:"14px", borderRadius:10, fontSize:16, fontWeight:700, marginTop:8, boxShadow:"var(--glow)", display:"flex", alignItems:"center", justifyContent:"center", gap:10, transition:"all 0.2s" }}>
            {loading ? <span className="spinner" /> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}