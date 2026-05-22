import { useEffect, useState, useRef, useCallback } from "react";
import { useTickets } from "../hooks/useTickets";
import { useRca } from "../hooks/useRca";
import TicketCard from "../components/TicketCard";
import SopReminderCard from "../components/SopReminderCard";
import ChildModal from "../components/ChildModal";
import MergeModal from "../components/MergeModal";
import RcaModal from "../components/RcaModal";
import ConfirmCompleteModal from "../components/ConfirmCompleteModal";
import CreateSopModal from "../components/CreateSopModal";
import { useEscalation } from "../hooks/useEscalation";
import EscalationModal from "../components/EscalationModal";
import { usePrioritySla } from "../hooks/usePrioritySla";
import PrioritySlaHitlModal from "../components/PrioritySlaHitlModal";

const POLL_INTERVAL = 10000;

export default function Tickets() {
  const {
    tickets,
    reminderTickets,
    completedReminders,
    loading,
    loadTickets,
    updateStatus,
    completeSingle,
    confirmModal,
    setConfirmModal,
    confirmComplete,
    afterCompleteFlow,
    requestComplete,
    childModal,
    openChildModal,
    closeChildModal,
    detachChild,
    mergeModal,
    mergeTickets,
    openMergeModal,
    closeMergeModal,
    executeMerge,
  } = useTickets();

  const {
    hitlOpen,
    hitlData,
    hitlForm,
    hitlErrors,
    hitlSubmitting,
    hitlSubmitted,
    hitlSubmitError,
    openHitl,
    closeHitl,
    updateHitlField,
    submitHitl,
  } = usePrioritySla();

  const {
    rcaModal,
    rcaData,
    rcaLoading,
    rcaError,
    openRcaModal,
    closeRcaModal,
    submitHuman,
  } = useRca();

  const {
    modal: escModal,
    phase: escPhase,
    result: escResult,
    error: escError,
    hitlForm: escHitlForm,
    hitlErrors: escHitlErrors,
    isHighConfidence: escIsHigh,
    isMediumOrLow: escIsMedLow,
    isAutoEscalated: escIsAuto,
    isHumanFinalised: escIsHuman,
    isQuarantine: escIsQuarantine,
    openEscalation,
    openExistingEscalation,
    closeEscalation,
    enterHitlForm: escEnterHitl,
    exitHitlForm: escExitHitl,
    updateHitlField: escUpdateField,
    submitHitl: escSubmitHitl,
  } = useEscalation();

  const [appFilter,       setAppFilter]       = useState("ALL");
  const [componentFilter, setComponentFilter] = useState("ALL");
  const [sopModal,        setSopModal]        = useState(null);

  // ── POLLING ──
  const [countdown,     setCountdown]     = useState(POLL_INTERVAL / 1000);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const countdownRef = useRef(null);
  const pollRef      = useRef(null);

  const resetCountdown = useCallback(() => {
    setCountdown(POLL_INTERVAL / 1000);
  }, []);

  const silentRefresh = useCallback(async () => {
    await loadTickets(false);
    setLastRefreshed(new Date());
    resetCountdown();
  }, [loadTickets, resetCountdown]);

  // Initial load
  useEffect(() => {
    loadTickets(true);
    setLastRefreshed(new Date());
  }, [loadTickets]);

  // Countdown ticker
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? POLL_INTERVAL / 1000 : prev - 1));
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  // Poll silently
  useEffect(() => {
    pollRef.current = setInterval(() => { silentRefresh(); }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [silentRefresh]);

  // ── HIGHLIGHT SEARCHED TICKET ──
  useEffect(() => {
    if (loading) return;
    const highlightKey = localStorage.getItem("highlight_ticket");
    if (!highlightKey) return;

    const card = document.getElementById(`ticket-${highlightKey}`);
    if (!card) return;

    const scrollTimer = setTimeout(() => {
      card.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      card.classList.add("ring-4", "ring-yellow-400", "scale-[1.02]", "transition-all", "duration-300");
    }, 300);

    const removeTimer = setTimeout(() => {
      card.classList.remove("ring-4", "ring-yellow-400", "scale-[1.02]");
      localStorage.removeItem("highlight_ticket");
    }, 3300);

    return () => { clearTimeout(scrollTimer); clearTimeout(removeTimer); };
  }, [loading, tickets]);

  // ── SORT tickets by Jira numeric ID ──
  const sortedTickets = [...tickets].sort((a, b) => {
    const numA = parseInt((a.issue_key || "").replace(/[^0-9]/g, ""), 10) || 0;
    const numB = parseInt((b.issue_key || "").replace(/[^0-9]/g, ""), 10) || 0;
    return numA - numB;
  });

  const appOptions       = ["ALL", ...new Set(sortedTickets.map((t) => t.app_name       || "General"))];
  const componentOptions = ["ALL", ...new Set(sortedTickets.map((t) => t.component_name || "General"))];

  const filteredTickets = sortedTickets.filter((t) => {
    const app  = t.app_name       || "General";
    const comp = t.component_name || "General";
    return (
      (appFilter       === "ALL" || app  === appFilter) &&
      (componentFilter === "ALL" || comp === componentFilter)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#1a1f35] relative">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12">

        {/* ── POLLING TIMER ── */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2.5 bg-[#151b2b]/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl px-4 py-2.5 shadow-xl shadow-black/30 select-none">
          <div className="relative flex items-center justify-center w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="2.5" />
              <circle
                cx="16" cy="16" r="12" fill="none"
                stroke="url(#poll-grad)" strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 12}`}
                strokeDashoffset={`${2 * Math.PI * 12 * (1 - countdown / (POLL_INTERVAL / 1000))}`}
                style={{ transition: "stroke-dashoffset 0.9s linear" }}
              />
              <defs>
                <linearGradient id="poll-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-[9px] font-bold text-purple-300 leading-none">{countdown}s</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-slate-300 tracking-wide uppercase">Polling</span>
            {lastRefreshed && (
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </div>
          <div className="relative flex items-center justify-center w-2 h-2 ml-0.5">
            <span className="absolute inline-flex w-2 h-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* ── HEADER ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 mb-6 shadow-2xl shadow-purple-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">Tickets Dashboard</h1>
          <p className="text-slate-400 text-lg">Manage and track all your support tickets</p>

          {/* Stats bar */}
          {!loading && filteredTickets.length > 0 && (
            <div className="mt-8 inline-flex items-center gap-6 bg-[#151b2b]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl px-8 py-4 shadow-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{filteredTickets.length}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Total Tickets</div>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {filteredTickets.filter((t) => t.status === "Completed").length}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Completed</div>
              </div>
              <div className="w-px h-12 bg-slate-700" />
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {filteredTickets.filter((t) => t.status !== "Completed").length}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">In Progress</div>
              </div>
              {reminderTickets && reminderTickets.length > 0 && (
                <>
                  <div className="w-px h-12 bg-slate-700" />
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-300">
                      {reminderTickets.filter((t) => t.status !== "Completed").length}
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">SOP Pending</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── FILTER BAR ── */}
        <div className="mt-6 flex flex-wrap items-center gap-3 justify-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <select
              className="pl-8 pr-8 py-2 bg-[#151b2b] text-sm text-white rounded-xl border border-purple-500/30 hover:border-purple-400/60 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
            >
              {appOptions.map((app) => (
                <option key={app} value={app}>{app === "ALL" ? "All Apps" : app}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-1 h-1 rounded-full bg-slate-600 hidden sm:block" />

          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <select
              className="pl-8 pr-8 py-2 bg-[#151b2b] text-sm text-white rounded-xl border border-blue-500/30 hover:border-blue-400/60 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
              value={componentFilter}
              onChange={(e) => setComponentFilter(e.target.value)}
            >
              {componentOptions.map((comp) => (
                <option key={comp} value={comp}>{comp === "ALL" ? "All Components" : comp}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {(appFilter !== "ALL" || componentFilter !== "ALL") && (
            <button
              onClick={() => { setAppFilter("ALL"); setComponentFilter("ALL"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 text-sm font-medium transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reset
            </button>
          )}
        </div>

        <div className="mt-8" />

        {/* ── LOADING SKELETON ── */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-[#151b2b]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-slate-700/50 rounded-lg w-32 mb-3" />
                    <div className="h-4 bg-slate-700/30 rounded-lg w-48 mb-2" />
                    <div className="h-4 bg-slate-700/30 rounded-lg w-40" />
                  </div>
                  <div className="h-8 bg-slate-700/50 rounded-lg w-24" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700/30 rounded w-full" />
                  <div className="h-3 bg-slate-700/30 rounded w-5/6" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-9 bg-slate-700/50 rounded-lg flex-1" />
                  <div className="h-9 bg-slate-700/50 rounded-lg flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && filteredTickets.length === 0 && (!reminderTickets || reminderTickets.length === 0) && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-slate-800/50 mb-6">
              <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Tickets Found</h3>
            <p className="text-slate-400 mb-6">There are no tickets in the system yet</p>
          </div>
        )}

        {/* ── SOP REMINDER SECTION ── */}
        {!loading && reminderTickets && reminderTickets.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", fontWeight: 700,
                color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                ⏳ Pending SOP Creation ({reminderTickets.filter((t) => t.status !== "Completed").length})
              </span>
              <div style={{ flex: 1, height: "1px", background: "rgba(250,204,21,0.15)" }} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reminderTickets.map((t, idx) => (
                <SopReminderCard
                  key={t.issue_key}
                  ticket={t}
                  idx={idx}
                  onCreateSop={(ticket) => setSopModal({ ticket })}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TICKETS GRID ── */}
        {!loading && (filteredTickets.length > 0 || (completedReminders && completedReminders.length > 0)) && (
          <>
            {reminderTickets && reminderTickets.length > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", fontWeight: 700,
                  color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  🎫 All Tickets ({filteredTickets.length + (completedReminders?.length || 0)})
                </span>
                <div style={{ flex: 1, height: "1px", background: "rgba(139,92,246,0.15)" }} />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {filteredTickets.map((t, idx) => (
                <TicketCard
                  key={t.issue_key}
                  ticket={t}
                  idx={idx}
                  onOpenChildren={openChildModal}
                  onOpenMerge={openMergeModal}
                  onStatusChange={updateStatus}
                  onOpenRca={openRcaModal}
                  onRequestComplete={requestComplete}
                  onOpenPriorityHitl={openHitl}
                  onEscalate={(issueKey, ticket) => {
                    const hasEscalation = ticket?.esc_action && ticket.esc_action !== "QUARANTINE";
                    if (hasEscalation) {
                      openExistingEscalation(issueKey, ticket);
                    } else {
                      openEscalation(issueKey, ticket);
                    }
                  }}
                />
              ))}
              {completedReminders && completedReminders.map((t, idx) => (
                <SopReminderCard
                  key={t.issue_key}
                  ticket={t}
                  idx={filteredTickets.length + idx}
                  onCreateSop={() => {}}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ── */}

      {childModal && (
        <ChildModal
          parentKey={childModal.parentKey}
          children={childModal.children}
          onClose={closeChildModal}
          onDetach={detachChild}
          updateStatus={updateStatus}
          completeSingle={completeSingle}
        />
      )}

      {mergeModal && (
        <MergeModal
          targetKey={mergeModal.targetKey}
          tickets={mergeTickets}
          onClose={closeMergeModal}
          onMerge={executeMerge}
        />
      )}

      {rcaModal && (
        <RcaModal
          issueKey={rcaModal.issueKey}
          data={rcaData}
          loading={rcaLoading}
          error={rcaError}
          onClose={closeRcaModal}
          onSubmitHuman={(rootCause, affected) =>
            submitHuman(rcaModal.issueKey, { rootCause, affected })
          }
        />
      )}

      {hitlOpen && (
        <PrioritySlaHitlModal
          hitlData={hitlData}
          hitlForm={hitlForm}
          hitlErrors={hitlErrors}
          hitlSubmitting={hitlSubmitting}
          hitlSubmitted={hitlSubmitted}
          hitlSubmitError={hitlSubmitError}
          onFieldChange={updateHitlField}
          onSubmit={async () => { await submitHitl(); loadTickets(); }}
          onClose={() => { closeHitl(); loadTickets(); }}
        />
      )}

      {escModal && (
        <EscalationModal
          modal={escModal}
          phase={escPhase}
          result={escResult}
          error={escError}
          hitlForm={escHitlForm}
          hitlErrors={escHitlErrors}
          isHighConfidence={escIsHigh}
          isMediumOrLow={escIsMedLow}
          isAutoEscalated={escIsAuto}
          isHumanFinalised={escIsHuman}
          isQuarantine={escIsQuarantine}
          enterHitlForm={escEnterHitl}
          exitHitlForm={escExitHitl}
          updateHitlField={escUpdateField}
          submitHitl={escSubmitHitl}
          onClose={() => { closeEscalation(); loadTickets(); }}
        />
      )}

      {confirmModal && (
        <ConfirmCompleteModal
          open={!!confirmModal}
          issueKey={confirmModal.issueKey}
          ticket={confirmModal.ticket}
          openChildren={confirmModal.openChildren}
          skipToSopPrompt={confirmModal.skipToSopPrompt || false}
          onCancel={() => setConfirmModal(null)}
          onConfirm={() => confirmComplete(confirmModal.issueKey)}
          onDone={afterCompleteFlow}
        />
      )}

      {sopModal && (
        <CreateSopModal
          open={!!sopModal}
          issueKey={sopModal.ticket.issue_key}
          ticket={sopModal.ticket}
          onDone={() => { setSopModal(null); setTimeout(() => loadTickets(), 400); }}
          onCancel={() => setSopModal(null)}
        />
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}