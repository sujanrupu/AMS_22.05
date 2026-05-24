import StatusBadge from "./StatusBadge";
import FieldLabel from "./FieldLabel";
import { useState } from "react";
import { apiRequest } from "../api/apiClient";

export default function ChildModal({ parentKey, children, onClose, onDetach, updateStatus, completeSingle }) {
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [creatingChild, setCreatingChild] = useState(null);
  const [showRationaleFor, setShowRationaleFor] = useState(null);

  async function completeAllChildren(issueKey) {
    try {
      console.log("calling complete children:", issueKey);
      const res = await apiRequest(`/tickets/${issueKey}/complete-children`, "PUT");
      console.log("response:", res);
      if (res?.type === "success") {
        setShowCompletePopup(false);
        setSelectedChild(null);
        window.location.reload();
      }
    } catch (e) {
      console.error("completeAllChildren failed:", e);
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(6,6,14,0.82)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .child-scroll::-webkit-scrollbar { width: 5px; }
        .child-scroll::-webkit-scrollbar-track { background: transparent; }
        .child-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 8px; }
        .child-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.45); }
        .rationale-scroll::-webkit-scrollbar { width: 4px; }
        .rationale-scroll::-webkit-scrollbar-track { background: transparent; }
        .rationale-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 6px; }
      `}</style>

      <div
        className="child-scroll"
        style={{
          background: "linear-gradient(160deg, #13111e 0%, #0f0d1a 100%)",
          border: "1px solid rgba(139,92,246,0.18)",
          borderRadius: "20px",
          width: "640px",
          maxHeight: "82vh",
          overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
          animation: "slideUp 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}
      >

        {/* ── Header ── */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 28px 18px",
            background: "linear-gradient(90deg, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.04) 100%)",
            borderBottom: "1px solid rgba(139,92,246,0.14)",
            position: "sticky", top: 0, zIndex: 10,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", flexShrink: 0,
            }}>🧩</div>
            <div>
              <h2 style={{
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
                fontSize: "15px", letterSpacing: "0.01em", color: "#c4b5fd", margin: 0,
              }}>Child Tickets</h2>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px",
                color: "rgba(148,163,184,0.65)", margin: "2px 0 0", letterSpacing: "0.04em",
              }}>Parent: {parentKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "9px", width: "34px", height: "34px",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(148,163,184,0.7)", fontSize: "13px", cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(148,163,184,0.7)";
            }}
          >✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {children.length === 0 ? (
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", textAlign: "center",
              padding: "52px 0", color: "rgba(148,163,184,0.45)", fontSize: "13px",
            }}>
              <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.6 }}>📭</div>
              <div style={{ letterSpacing: "0.04em" }}>No child tickets found</div>
            </div>
          ) : (
            children.map(c => (
              <div
                key={c.issue_key}
                style={{
                  position: "relative",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(139,92,246,0.12)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex", flexDirection: "column", gap: "12px",
                  overflow: "visible",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.26)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,92,246,0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.12)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >

                {/* Child header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", color: "#fbbf24",
                      fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em",
                    }}>{c.issue_key}</span>
                    {c.child_key && (
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px",
                        padding: "2px 8px", borderRadius: "20px",
                        background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.22)",
                        color: "#fbbf24", letterSpacing: "0.03em",
                      }}>{c.child_key}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <StatusBadge isCompleted={c.status === "Completed"} />
                    {c.status !== "Completed" && (
                      <select
                        style={{
                          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(139,92,246,0.22)",
                          borderRadius: "8px", padding: "4px 10px", fontSize: "11px",
                          fontFamily: "'IBM Plex Mono', monospace", color: "#e2e8f0",
                          cursor: "pointer", outline: "none",
                        }}
                        onChange={(e) => {
                          if (e.target.value === "Completed") {
                            setSelectedChild(c);
                            setShowCompletePopup(true);
                          }
                        }}
                      >
                        <option>Open</option>
                        <option>Completed</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Child fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: "13px" }}>
                  <FieldLabel label="Name"><span>{c.name || "-"}</span></FieldLabel>
                  <FieldLabel label="Email"><span>{c.email || "-"}</span></FieldLabel>
                  <FieldLabel label="Summary" className="col-span-2"><span>{c.summary || "-"}</span></FieldLabel>
                  <FieldLabel label="Description" className="col-span-2">
                    <span style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{c.description || "-"}</span>
                  </FieldLabel>
                </div>

                {/* ── Rationale Tooltip ── */}
                {showRationaleFor === c.issue_key && c.child_rationale && (
                  <div style={{
                    position: "absolute", zIndex: 50, bottom: "58px", right: "8px",
                    width: "350px", animation: "fadeIn 0.18s cubic-bezier(0.16,1,0.3,1)",
                  }}>
                    {/* caret arrow */}
                    <div style={{
                      position: "absolute", bottom: "-7px", right: "64px",
                      width: "14px", height: "14px", transform: "rotate(45deg)",
                      background: "#13111e",
                      borderRight: "1px solid rgba(139,92,246,0.22)",
                      borderBottom: "1px solid rgba(139,92,246,0.22)",
                    }} />
                    <div style={{
                      background: "linear-gradient(160deg, #16132a 0%, #110f1e 100%)",
                      border: "1px solid rgba(139,92,246,0.22)",
                      borderRadius: "16px", padding: "16px",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(139,92,246,0.07)",
                      backdropFilter: "blur(16px)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{
                          fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
                          fontSize: "11px", color: "#c4b5fd", letterSpacing: "0.04em",
                          display: "flex", alignItems: "center", gap: "6px",
                        }}>
                          🤖 <span>Duplicate Analysis</span>
                        </span>
                        <button
                          onClick={() => setShowRationaleFor(null)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "rgba(148,163,184,0.55)", fontSize: "12px",
                            padding: "2px 4px", borderRadius: "4px",
                            transition: "color 0.15s ease",
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,0.55)"}
                        >✕</button>
                      </div>
                      <div
                        className="rationale-scroll"
                        style={{
                          fontSize: "12.5px", color: "#cbd5e1", whiteSpace: "pre-line",
                          lineHeight: 1.65, maxHeight: "220px", overflowY: "auto",
                          fontFamily: "'IBM Plex Sans', sans-serif",
                        }}
                      >
                        {c.child_rationale}
                      </div>
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(139,92,246,0.08)", margin: "0 -2px" }} />

                {/* ── Actions ── */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>

                  {/* 💭 Child Rationale button */}
                  <button
                    onClick={() =>
                      setShowRationaleFor(
                        showRationaleFor === c.issue_key ? null : c.issue_key
                      )
                    }
                    style={{
                      background: showRationaleFor === c.issue_key
                        ? "rgba(139,92,246,0.22)" : "rgba(139,92,246,0.10)",
                      border: `1px solid ${showRationaleFor === c.issue_key
                        ? "rgba(139,92,246,0.40)" : "rgba(139,92,246,0.22)"}`,
                      borderRadius: "9px", color: "#c4b5fd",
                      fontSize: "11px", fontWeight: 700,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: "6px 14px", cursor: "pointer",
                      transition: "all 0.15s ease", letterSpacing: "0.03em",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(139,92,246,0.20)";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(139,92,246,0.18)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = showRationaleFor === c.issue_key
                        ? "rgba(139,92,246,0.22)" : "rgba(139,92,246,0.10)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    💭 Child Rationale
                  </button>

                  {/* 🔗 Open in Jira */}
                  <button
                    onClick={() => window.open(`${import.meta.env.VITE_JIRA_BASE_URL}/browse/${c.issue_key}`, "_blank")}
                    style={{
                      background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.22)",
                      borderRadius: "9px", color: "#60a5fa",
                      fontSize: "11px", fontWeight: 700,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: "6px 14px", cursor: "pointer",
                      transition: "all 0.15s ease", letterSpacing: "0.03em",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(59,130,246,0.20)";
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(59,130,246,0.15)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(59,130,246,0.10)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    🔗 Open in Jira
                  </button>

                  {/* ➕ Create New Ticket */}
                  <button
                    onClick={async () => {
                      setCreatingChild(c.issue_key);       // start creating for this child
                      await onDetach(c.issue_key);
                      setCreatingChild(null);               // done creating
                    }}
                    disabled={creatingChild === c.issue_key}
                    style={{
                      border: "1px solid",
                      borderRadius: "9px", fontSize: "11px", fontWeight: 700,
                      fontFamily: "'IBM Plex Mono', monospace",
                      padding: "6px 14px", letterSpacing: "0.03em",
                      transition: "all 0.15s ease",
                      cursor: creatingChild === c.issue_key ? "not-allowed" : "pointer",
                      ...(creatingChild === c.issue_key
                        ? { background: "rgba(100,100,100,0.15)", borderColor: "rgba(100,100,100,0.25)", color: "#9ca3af" }
                        : { background: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.22)", color: "#4ade80" }),
                    }}
                    onMouseEnter={e => {
                      if (creatingChild !== c.issue_key) {
                        e.currentTarget.style.background = "rgba(34,197,94,0.20)";
                        e.currentTarget.style.boxShadow = "0 2px 10px rgba(34,197,94,0.12)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (creatingChild !== c.issue_key) {
                        e.currentTarget.style.background = "rgba(34,197,94,0.10)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {creatingChild === c.issue_key ? "Creating..." : "➕ Create New Ticket"}
                  </button>

                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* ── Completion Popup ── */}
      {showCompletePopup && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(4,4,12,0.78)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999,
        }}>
          <div style={{
            background: "linear-gradient(160deg, #14111f 0%, #100e1b 100%)",
            border: "1px solid rgba(139,92,246,0.22)",
            borderRadius: "18px", padding: "30px 28px", width: "420px",
            boxShadow: "0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(139,92,246,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "slideUp 0.2s cubic-bezier(0.16,1,0.3,1)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "9px",
                background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.24)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", flexShrink: 0,
              }}>✅</div>
              <h3 style={{
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
                fontSize: "16px", color: "#e2e8f0", margin: 0, letterSpacing: "0.01em",
              }}>Completion Option</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: "11px",
                  background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)",
                  color: "#4ade80", fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: 600, fontSize: "13px", cursor: "pointer",
                  transition: "all 0.15s ease", textAlign: "left",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(34,197,94,0.18)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(34,197,94,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(34,197,94,0.10)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                onClick={async () => {
                  await completeSingle(selectedChild.issue_key);
                  setShowCompletePopup(false);
                }}
              >
                ✓ &nbsp;Mark only this ticket as completed
              </button>

              <button
                onClick={async () => {
                  console.log("BUTTON CLICKED");
                  if (!selectedChild) {
                    console.log("selected child missing");
                    return;
                  }
                  await completeAllChildren(selectedChild.issue_key);
                }}
                disabled={!selectedChild}
                style={{
                  width: "100%", padding: "11px 16px",
                  background: "#fbbf24", color: "#0a0a0a",
                  fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
                  fontSize: "13px", borderRadius: "11px", border: "none",
                  cursor: !selectedChild ? "not-allowed" : "pointer",
                  opacity: !selectedChild ? 0.4 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 14px rgba(251,191,36,0.25)",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={e => {
                  if (selectedChild) {
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(251,191,36,0.35)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(251,191,36,0.25)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                ⚡ Complete all child tickets
              </button>

              <button
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: "11px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
                  color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: 600, fontSize: "13px", cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.16)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
                onClick={() => setShowCompletePopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}