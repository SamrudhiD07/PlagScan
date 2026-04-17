import React from 'react';

export default function Footer() {
  return (
    <footer style={{ 
      background: "var(--surface)", 
      borderTop: "1px solid var(--border)", 
      padding: "64px 0 32px 0",
      marginTop: "auto"
    }}>
      <div className="container">
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "48px",
          marginBottom: "48px"
        }}>
          <div style={{ gridColumn: "span 2" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "10px", 
              fontFamily: "var(--font-display)", 
              fontSize: "24px", 
              fontWeight: 800, 
              color: "var(--text)",
              marginBottom: "16px"
            }}>
              <span style={{ color: "var(--accent)" }}>⬡</span> PlagScan
            </div>
            <p style={{ color: "var(--text-muted)", maxWidth: "320px", fontSize: "14px" }}>
              Advanced plagiarism detection power by AI and deep search technology. 
              Ensuring academic integrity and content originality for everyone.
            </p>
          </div>
          
          <div>
            <h4 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Product</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>Scan Engine</a></li>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>API Access</a></li>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>Features</a></li>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Company</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>About Us</a></li>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>Careers</a></li>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>Privacy Policy</a></li>
              <li><a href="#" style={{ color: "var(--text-muted)", fontSize: "14px" }}>Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>Connect</h4>
            <div style={{ display: "flex", gap: "16px" }}>
              <a href="#" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>𝕏</a>
              <a href="#" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>in</a>
              <a href="#" style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>gh</a>
            </div>
          </div>
        </div>
        
        <div style={{ 
          borderTop: "1px solid var(--border)", 
          paddingTop: "32px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>
            © {new Date().getFullYear()} PlagScan AI. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            <span style={{ color: "var(--text-dim)", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></span> Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
