import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ScanPage from "./pages/ScanPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import AdminLibrary from "./pages/AdminLibrary";
import Navbar from "./components/Navbar";
import "./index.css";

function AppInner({ theme, toggleTheme }) {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("home");

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", gap:12, color:"var(--text-muted)" }}>
      Loading…
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <>
      <Navbar page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme} />
      <main style={{ position:"relative", zIndex:1 }}>
        {page === "home"    && <HomePage setPage={setPage} />}
        {page === "scan"    && <ScanPage theme={theme} />}
        {page === "history" && <HistoryPage />}
        {page === "admin"   && <AdminPage />}
        {page === "library" && <AdminLibrary />}
      </main>
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  return (
    <AuthProvider>
      <AppInner theme={theme} toggleTheme={toggleTheme} />
    </AuthProvider>
  );
}