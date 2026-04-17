import { useAuth } from "../context/AuthContext";

export default function Navbar({ page, setPage, theme, toggleTheme }) {
  const { user, logout, isAdmin } = useAuth();
  
  const navItems = [
    { id: "home", label: "Home" },
    { id: "scan", label: "Scan" },
    { id: "history", label: "History" }
  ];

  if (isAdmin) {
    navItems.push({ id: "admin", label: "Admin" });
    navItems.push({ id: "library", label: "Library" });
  }

  return (
    <nav style={{ 
      position: "sticky", 
      top: 0, 
      zIndex: 100, 
      display: "flex", 
      alignItems: "center", 
      gap: "24px", 
      padding: "0 32px", 
      height: "72px", 
      background: "rgba(var(--surface-rgb), 0.8)", 
      backdropFilter: "blur(12px)", 
      borderBottom: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)"
    }}>
      <div 
        onClick={() => setPage("home")}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "10px", 
          fontFamily: "var(--font-display)", 
          fontSize: "22px", 
          fontWeight: 800, 
          color: "var(--text)",
          cursor: "pointer",
          marginRight: "16px"
        }}
      >
        <span style={{ color: "var(--accent)", fontSize: "28px" }}>⬡</span> PlagScan
      </div>

      <div style={{ display: "flex", gap: "8px", flex: 1 }}>
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setPage(item.id)}
            style={{ 
              padding: "8px 20px", 
              borderRadius: "var(--radius-sm)", 
              background: page === item.id ? "var(--accent-light)" : "transparent",
              color: page === item.id ? "var(--accent)" : "var(--text-muted)", 
              fontSize: "14px", 
              fontWeight: 700, 
              border: "none",
              transition: "0.2s"
            }}
            onMouseOver={(e) => {
              if (page !== item.id) e.currentTarget.style.color = "var(--text)";
            }}
            onMouseOut={(e) => {
              if (page !== item.id) e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: "var(--surface-2)", 
            border: "1px solid var(--border)", 
            color: "var(--text-muted)", 
            width: "38px", 
            height: "38px", 
            borderRadius: "12px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "18px" 
          }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px", 
          padding: "6px 16px 6px 6px", 
          background: "var(--surface-2)", 
          border: "1px solid var(--border)", 
          borderRadius: "100px" 
        }}>
          <div style={{ 
            width: "32px", 
            height: "32px", 
            background: "var(--accent)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "13px", 
            fontWeight: 700, 
            color: "#fff" 
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{user?.name}</span>
            <span style={{ fontSize: "10px", color: user?.role === "admin" ? "var(--accent-2)" : "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{user?.role}</span>
          </div>
        </div>

        <button 
          onClick={logout} 
          style={{ 
            background: "transparent", 
            border: "1px solid var(--border)", 
            color: "var(--text-muted)", 
            width: "38px", 
            height: "38px", 
            borderRadius: "12px", 
            fontSize: "16px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}
        >⏻</button>
      </div>
    </nav>
  );
}