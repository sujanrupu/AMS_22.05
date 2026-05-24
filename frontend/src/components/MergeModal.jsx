import { useState } from "react";
import { apiRequest } from "../api/apiClient";

export default function MergeModal({
  targetKey,
  onClose,
  onMerge
}) {

  const [mode, setMode] = useState(
    "merge_into_this"
  );

  const [jiraId, setJiraId] =
    useState("");

  const [ticket, setTicket] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [merging, setMerging] =
    useState(false);

  const [mergeReason, setMergeReason] =
    useState("");


  // ─────────────────────────────
  // SEARCH
  // ─────────────────────────────
  const searchTicket = async () => {

    if (!jiraId.trim())
      return;

    setLoading(true);

    try {

      const res =
        await apiRequest(
          `/tickets/search/${jiraId.trim()}`
        );

      console.log(
        "search result:",
        res
      );

      if (
        res?.type === "error"
      ) {

        alert(
          "Ticket not found"
        );

        setTicket(null);

        return;
      }


      // only parent ticket allowed
      if (
        res.mode !==
        "parent-view"
      ) {

        alert(
          "Only parent tickets can be merged"
        );

        setTicket(null);

        return;
      }


      const found =
        res.parent;


      // prevent self merge
      if (
        found.issue_key
        === targetKey
      ) {

        alert(
          "Cannot merge same ticket"
        );

        setTicket(null);

        return;
      }

      setTicket(found);

    }
    catch (err) {

      console.log(
        "search error:",
        err
      );

      setTicket(null);
    }

    finally {

      setLoading(false);
    }
  };


  // ─────────────────────────────
  // MERGE
  // ─────────────────────────────
  const handleMerge =
    async () => {

      if (!ticket)
        return;

      if (!mergeReason.trim()) {

        alert(
          "Please enter merge rationale"
        );

        return;
      }

      try {

        setMerging(true);

        const payload = {

          mode,

          current_ticket:
            targetKey,

          selected_tickets: [

            ticket.issue_key
          ],

          merge_reason:
            mergeReason.trim()
        };


        await onMerge(
          payload
        );


        onClose();

      }
      catch (err) {

        console.error(
          "merge error:",
          err
        );

        alert(
          "Merge failed"
        );
      }

      finally {

        setMerging(false);
      }
    };


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
    >
      <style>{`
        @keyframes mergeSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .merge-radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 11px 14px;
          border-radius: 11px;
          border: 1px solid rgba(139,92,246,0.10);
          background: rgba(255,255,255,0.025);
          color: #cbd5e1;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.15s ease;
          user-select: none;
        }
        .merge-radio-label:hover {
          background: rgba(139,92,246,0.08);
          border-color: rgba(139,92,246,0.22);
          color: #e2e8f0;
        }
        .merge-radio-label.selected {
          background: rgba(139,92,246,0.12);
          border-color: rgba(139,92,246,0.32);
          color: #c4b5fd;
        }
        .merge-radio-label input[type="radio"] {
          accent-color: #8b5cf6;
          width: 15px;
          height: 15px;
          flex-shrink: 0;
        }
        .merge-textarea::-webkit-scrollbar { width: 4px; }
        .merge-textarea::-webkit-scrollbar-track { background: transparent; }
        .merge-textarea::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 6px; }
      `}</style>

      <div
        style={{
          background: "linear-gradient(160deg, #13111e 0%, #0f0d1a 100%)",
          border: "1px solid rgba(139,92,246,0.18)",
          borderRadius: "20px",
          padding: 0,
          width: "560px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.07), inset 0 1px 0 rgba(255,255,255,0.04)",
          animation: "mergeSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)",
          overflow: "hidden",
        }}
      >

        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "20px 28px 18px",
            background: "linear-gradient(90deg, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.04) 100%)",
            borderBottom: "1px solid rgba(139,92,246,0.14)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "rgba(139,92,246,0.14)", border: "1px solid rgba(139,92,246,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", flexShrink: 0,
            }}>🔀</div>
            <div>
              <h2 style={{
                fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
                fontSize: "15px", color: "#c4b5fd", margin: 0, letterSpacing: "0.01em",
              }}>Merge Tickets</h2>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px",
                color: "rgba(148,163,184,0.6)", margin: "2px 0 0", letterSpacing: "0.04em",
              }}>Current: {targetKey}</p>
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

        {/* ── BODY ── */}
        <div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* MODE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "11px",
              fontWeight: 600, color: "rgba(148,163,184,0.55)",
              textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
            }}>Merge Mode</p>

            <label className={`merge-radio-label${mode === "merge_into_this" ? " selected" : ""}`}>
              <input
                type="radio"
                checked={mode === "merge_into_this"}
                onChange={() => {
                  setMode("merge_into_this");
                  setTicket(null);
                }}
              />
              <span>Merge other tickets into this</span>
            </label>

            <label className={`merge-radio-label${mode === "merge_with_other" ? " selected" : ""}`}>
              <input
                type="radio"
                checked={mode === "merge_with_other"}
                onChange={() => {
                  setMode("merge_with_other");
                  setTicket(null);
                }}
              />
              <span>Merge this ticket with another</span>
            </label>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "rgba(139,92,246,0.10)" }} />

          {/* INPUT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{
              fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "11px",
              fontWeight: 600, color: "rgba(148,163,184,0.55)",
              textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
            }}>Target Ticket</p>
            <input
              value={jiraId}
              onChange={(e) => {
                setJiraId(e.target.value.toUpperCase())
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  searchTicket();
                }
              }}
              placeholder="Enter Parent Jira ID"
              style={{
                width: "100%", padding: "11px 14px", borderRadius: "11px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.20)",
                outline: "none", color: "#e2e8f0",
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px",
                letterSpacing: "0.04em", boxSizing: "border-box",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.45)";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.10)";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.20)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* SEARCH BUTTON */}
          <button
            onClick={searchTicket}
            style={{
              width: "100%", padding: "11px 16px",
              background: loading
                ? "rgba(139,92,246,0.40)"
                : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: loading ? "rgba(255,255,255,0.7)" : "#fff",
              fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
              fontSize: "13px", borderRadius: "11px", border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.18s ease",
              boxShadow: loading ? "none" : "0 4px 14px rgba(139,92,246,0.30)",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(139,92,246,0.42)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = loading ? "none" : "0 4px 14px rgba(139,92,246,0.30)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>

          {/* RESULT */}
          {ticket && (
            <div
              style={{
                border: "1px solid rgba(139,92,246,0.20)",
                borderRadius: "14px", padding: "16px 18px",
                background: "rgba(139,92,246,0.05)",
                display: "flex", flexDirection: "column", gap: "10px",
                animation: "mergeSlideUp 0.18s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", color: "#fbbf24",
                fontWeight: 700, fontSize: "13px", letterSpacing: "0.05em",
              }}>
                {ticket.issue_key}
              </div>

              <div style={{
                fontSize: "13px", color: "#cbd5e1",
                fontFamily: "'IBM Plex Sans', sans-serif", lineHeight: 1.5,
              }}>
                {ticket.summary}
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "11px", color: "rgba(148,163,184,0.60)",
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                <span style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: ticket.status === "Completed" ? "#4ade80" : "#fbbf24",
                  flexShrink: 0,
                }} />
                Status: {ticket.status}
              </div>

              {/* ── Merge Rationale Textarea ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{
                  fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "11px",
                  fontWeight: 600, color: "rgba(148,163,184,0.55)",
                  textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
                }}>Merge Rationale</p>
                <textarea
                  className="merge-textarea"
                  value={mergeReason}
                  onChange={(e) =>
                    setMergeReason(e.target.value)
                  }
                  placeholder="Why are you merging these tickets?"
                  style={{
                    width: "100%", padding: "11px 14px",
                    borderRadius: "11px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(139,92,246,0.20)",
                    outline: "none", color: "#e2e8f0",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "13px", lineHeight: 1.6,
                    minHeight: "100px", resize: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.45)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.10)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "rgba(139,92,246,0.20)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* CONFIRM MERGE */}
              <button
                onClick={handleMerge}
                disabled={merging}
                style={{
                  width: "100%", padding: "11px 16px", borderRadius: "11px",
                  background: merging ? "rgba(100,100,100,0.15)" : "rgba(34,197,94,0.12)",
                  border: `1px solid ${merging ? "rgba(100,100,100,0.22)" : "rgba(34,197,94,0.26)"}`,
                  color: merging ? "#9ca3af" : "#4ade80",
                  fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700,
                  fontSize: "13px", cursor: merging ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease", letterSpacing: "0.02em",
                }}
                onMouseEnter={e => {
                  if (!merging) {
                    e.currentTarget.style.background = "rgba(34,197,94,0.20)";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(34,197,94,0.14)";
                  }
                }}
                onMouseLeave={e => {
                  if (!merging) {
                    e.currentTarget.style.background = "rgba(34,197,94,0.12)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                {merging ? "Merging…" : "✓ Confirm Merge"}
              </button>
            </div>
          )}

          {/* Divider before cancel */}
          <div style={{ height: "1px", background: "rgba(139,92,246,0.08)", marginTop: "-4px" }} />

          {/* CANCEL */}
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "11px 16px", borderRadius: "11px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)",
              color: "#f87171", fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: 600, fontSize: "13px", cursor: "pointer",
              transition: "all 0.15s ease", marginTop: "-6px",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          >
            Cancel
          </button>

        </div>
      </div>
    </div>

  );

}