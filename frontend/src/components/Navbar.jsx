import { useAuth } from "../context/AuthContext";

export default function Navbar({ page, setPage, theme, toggleTheme }) {
  const { user, logout, isAdmin } = useAuth();
  return (
    <nav style={{ position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", gap:24, padding:"0 32px", height:64, background:"var(--surface)", backdropFilter:"blur(12px)", borderBottom:"1px solid var(--border)", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, marginRight:8, color:"var(--text)" }}>
        <span style={{ color:"var(--accent)", fontSize:24 }}>⬡</span> PlagScan
      </div>
      <div style={{ display:"flex", gap:6, flex:1 }}>
        {["scan","history"].map(p => (
          <button key={p} onClick={() => setPage(p)}
            style={{ padding:"8px 16px", borderRadius:8, background: page===p ? "var(--bg)" : "transparent",
              color: page===p ? "var(--accent)" : "var(--text-muted)", fontSize:14, fontWeight:600, textTransform:"capitalize", border: page===p ? "1px solid var(--border)" : "1px solid transparent" }}>
            {p}
          </button>
        ))}
        {isAdmin && (
          <>
            <button onClick={() => setPage("admin")}
              style={{ padding:"8px 16px", borderRadius:8, background: page==="admin" ? "var(--bg)" : "transparent",
                color: page==="admin" ? "var(--accent)" : "var(--text-muted)", fontSize:14, fontWeight:600, border: page==="admin" ? "1px solid var(--border)" : "1px solid transparent" }}>
              Admin
            </button>
            <button onClick={() => setPage("library")}
              style={{ padding:"8px 16px", borderRadius:8, background: page==="library" ? "var(--bg)" : "transparent",
                color: page==="library" ? "var(--accent)" : "var(--text-muted)", fontSize:14, fontWeight:600, border: page==="library" ? "1px solid var(--border)" : "1px solid transparent" }}>
              Library
            </button>
          </>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={toggleTheme} 
          style={{ background:"var(--surface-2)", border:"1px solid var(--border)", color:"var(--text-muted)", width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 14px 6px 6px", background:"var(--bg)", border:"1px solid var(--border)", borderRadius:24 }}>
          <div style={{ width:30, height:30, background:"var(--accent)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text)", lineHeight:1.2 }}>{user?.name}</span>
            <span style={{ fontSize:10, color: user?.role==="admin" ? "var(--accent-2)" : "var(--text-muted)", fontWeight:600, textTransform:"uppercase" }}>{user?.role}</span>
          </div>
        </div>
        <button onClick={logout} style={{ background:"transparent", border:"1px solid var(--border)", color:"var(--text-muted)", width:36, height:36, borderRadius:10, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>⏻</button>
      </div>
    </nav>
  );
}