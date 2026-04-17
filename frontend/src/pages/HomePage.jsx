import React from 'react';
import Footer from '../components/Footer';

export default function HomePage({ setPage }) {
  return (
    <div className="fade-in" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero Section */}
      <section className="section" style={{ 
        position: "relative", 
        overflow: "hidden", 
        paddingtop: "120px",
        paddingBottom: "160px",
        background: "linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)"
      }}>
        {/* Abstract Background Element */}
        <div style={{ 
          position: "absolute", 
          top: "-10%", 
          right: "-10%", 
          width: "60%", 
          height: "80%", 
          backgroundImage: "url('/c:/Users/Samrudhi/.gemini/antigravity/brain/c4f6b9e6-b47e-4e12-87a6-9d614bb8b0d8/plagscan_hero_bg_1776304437641.png')",
          backgroundSize: "cover",
          opacity: 0.15,
          filter: "blur(60px)",
          zIndex: 0,
          borderRadius: "50%"
        }}></div>

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "800px" }}>
            <div className="fade-in-up" style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              padding: "6px 16px", 
              background: "var(--accent-light)", 
              color: "var(--accent)", 
              borderRadius: "100px", 
              fontSize: "13px", 
              fontWeight: 700,
              marginBottom: "24px"
            }}>
              <span style={{ fontSize: "16px" }}>✨</span> Powered by Advanced AI
            </div>
            
            <h1 className="fade-in-up delay-100" style={{ fontSize: "clamp(48px, 8vw, 72px)", marginBottom: "32px", color: "var(--text)" }}>
              Ensure Integrity with <span style={{ color: "var(--accent)" }}>Deep Scan</span>
            </h1>
            
            <p className="fade-in-up delay-200" style={{ fontSize: "20px", color: "var(--text-muted)", marginBottom: "48px", lineHeight: "1.6", maxWidth: "600px" }}>
              The most advanced plagiarism detection platform for students, researchers, and professionals. Fast, accurate, and completely private.
            </p>
            
            <div className="fade-in-up delay-300" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <button onClick={() => setPage("scan")} className="btn-primary" style={{ fontSize: "16px", padding: "16px 32px" }}>
                Start Checking Now
              </button>
              <button style={{ 
                background: "var(--surface)", 
                border: "1px solid var(--border)", 
                color: "var(--text)", 
                padding: "16px 32px", 
                borderRadius: "var(--radius)", 
                fontWeight: 700 
              }}>
                View Sample Report
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ marginTop: "-80px", position: "relative", zIndex: 2 }}>
        <div className="container">
          <div style={{ 
            background: "var(--surface)", 
            border: "1px solid var(--border)", 
            borderRadius: "var(--radius)", 
            padding: "48px", 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "32px",
            boxShadow: "var(--shadow-xl)"
          }}>
            {[
              { val: "99.9%", label: "Accuracy Rate" },
              { val: "2s", label: "Average Scan Time" },
              { val: "1B+", label: "Sources Indexed" },
              { val: "50k+", label: "Happy Users" }
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--accent)", marginBottom: "4px" }}>{stat.val}</div>
                <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 style={{ fontSize: "36px", marginBottom: "16px" }}>Powerful Detection Features</h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto" }}>
              Our platform uses the latest machine learning models to identify not just direct copies, but paraphrased content as well.
            </p>
          </div>
          
          <div className="grid-3">
            {[
              { 
                icon: "🚀", 
                title: "Real-time Analysis", 
                desc: "Get instant results as you upload. No more waiting for hours to get your similarity reports."
              },
              { 
                icon: "🧠", 
                title: "AI & ML Powered", 
                desc: "Detects complex paraphrasing and synonym replacement using advanced semantic analysis."
              },
              { 
                icon: "📂", 
                title: "Multi-format Support", 
                desc: "Upload Word documents, PDFs, or raw text. We handle all major formats with ease."
              },
              { 
                icon: "🔒", 
                title: "Privacy First", 
                desc: "Your documents are never shared or stored in public databases. You own your data."
              },
              { 
                icon: "📊", 
                title: "Detailed Reports", 
                desc: "Interactive reports highlighting exact sources with percentage-based similarity scores."
              },
              { 
                icon: "🌍", 
                title: "Global Reach", 
                desc: "Scans across billions of web pages, journals, and institutional libraries worldwide."
              }
            ].map((feat, i) => (
              <div key={i} className="card fade-in-up" style={{ animationDelay: `${(i+1)*100}ms` }}>
                <div style={{ fontSize: "32px", marginBottom: "20px" }}>{feat.icon}</div>
                <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>{feat.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.7" }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section" style={{ background: "var(--surface-2)", textAlign: "center" }}>
        <div className="container">
          <div style={{ 
            maxWidth: "700px", 
            margin: "0 auto", 
            background: "var(--accent)", 
            padding: "64px", 
            borderRadius: "var(--radius)", 
            color: "#fff",
            boxShadow: "var(--shadow-xl)"
          }}>
            <h2 style={{ color: "#fff", fontSize: "32px", marginBottom: "16px" }}>Ready to verify your work?</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "40px", fontSize: "18px" }}>
              Join thousands of students and professionals who trust PlagScan for their original content needs.
            </p>
            <button onClick={() => setPage("scan")} style={{ 
              background: "#fff", 
              color: "var(--accent)", 
              padding: "16px 40px", 
              borderRadius: "var(--radius)", 
              fontWeight: 800, 
              fontSize: "18px" 
            }}>
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
