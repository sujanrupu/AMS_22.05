import { useState, useCallback } from "react";
import { apiRequest } from "../api/apiClient";

export function useTickets() {
  const [tickets,            setTickets]           = useState([]);
  const [reminderTickets,    setReminderTickets]    = useState([]);
  const [completedReminders, setCompletedReminders] = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [childModal,         setChildModal]         = useState(null);
  const [deleteModal,        setDeleteModal]        = useState(null);
  const [mergeModal,         setMergeModal]         = useState(null);
  const [mergeTickets,       setMergeTickets]       = useState([]);
  const [confirmModal,       setConfirmModal]       = useState(null);

  // ── LOAD ──
  // showLoader=true  → shows skeleton (initial load)
  // showLoader=false → silent background poll (no flicker)
  const loadTickets = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await apiRequest("/tickets");
      const all =
        Array.isArray(res)          ? res :
        Array.isArray(res?.tickets) ? res.tickets :
        Array.isArray(res?.data)    ? res.data : [];

      setReminderTickets(all.filter(t => !!t.sop_parent_key && t.status !== "Completed"));
      setCompletedReminders(all.filter(t => !!t.sop_parent_key && t.status === "Completed"));
      setTickets(all.filter(t => !t.parent_ticket_key && !t.child_key && !t.sop_parent_key));

      return all; // returned so requestComplete can use fresh data
    } catch (err) {
      console.error("❌ loadTickets error:", err);
      return [];
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // ── REQUEST COMPLETE (called from TicketCard dropdown) ──
  const requestComplete = useCallback(async (issueKey) => {
    const res = await apiRequest(`/tickets/${issueKey}/complete-check`);

    // always work from fresh data
    const all    = await loadTickets();
    const ticket = all.find(t => t.issue_key === issueKey) || null;

    if (res?.requires_confirmation) {
      setConfirmModal({ issueKey, openChildren: res.open_children || [], ticket });
      return;
    }

    // no open children — complete directly
    const completeRes = await apiRequest(`/tickets/${issueKey}/complete`, "PUT");
    if (!completeRes?.error) {
      const freshAll    = await loadTickets();
      const freshTicket = freshAll.find(t => t.issue_key === issueKey) || ticket;

      if (freshTicket?.sop_match_type === "no_sop_found") {
        setConfirmModal({ issueKey, openChildren: [], ticket: freshTicket, skipToSopPrompt: true });
        return;
      }

      localStorage.removeItem(`esc_${issueKey}`);
    }
  }, [loadTickets]);

  const updateStatus = useCallback(async (issueKey, value) => {
    if (value !== "Completed") return;
    await requestComplete(issueKey);
  }, [requestComplete]);

  // ── CONFIRM COMPLETE (called from ConfirmCompleteModal onConfirm) ──
  // Does NOT reload or close — lets the modal handle next step
  const confirmComplete = useCallback(async (issueKey, force = true) => {
    const res = await apiRequest(`/tickets/${issueKey}/complete?force=${force}`, "PUT");
    if (res?.error) {
      console.error("❌ confirmComplete failed:", res.message);
      return { error: true };
    }
    localStorage.removeItem(`esc_${issueKey}`);
    return { ok: true };
  }, []);

  // called when entire modal flow finishes (SOP created or skipped)
  const afterCompleteFlow = useCallback(() => {
    setConfirmModal(null);
    setTimeout(() => loadTickets(), 400);
  }, [loadTickets]);

  // ── COMPLETE SINGLE ──
  const completeSingle = useCallback(async (issueKey) => {
    try {
      const res = await apiRequest(`/tickets/${issueKey}/complete-single`, "PUT");
      if (!res || res.type === "error") { console.error(res?.message); return; }
      await loadTickets();
    } catch (err) {
      console.error("completeSingle:", err);
    }
  }, [loadTickets]);

  // ── DELETE ──
  const openDeleteModal = useCallback((issueKey) => setDeleteModal({ issueKey }), []);

  const deleteParentCascade = useCallback(async (issueKey) => {
    const res = await apiRequest(`/tickets/${issueKey}`, "DELETE");
    if (res?.error) { console.error("❌ Cascade delete failed:", res.message); return; }
    setDeleteModal(null);
    loadTickets();
  }, [loadTickets]);

  const deleteParentOnly = useCallback(async (issueKey) => {
    const res = await apiRequest(`/tickets/${issueKey}/parent-only`, "DELETE");
    if (res?.error) { console.error("❌ Parent delete failed:", res.message); return; }
    setDeleteModal(null);
    loadTickets();
  }, [loadTickets]);

  const deleteSingleChild = useCallback(async (issueKey) => {
    const res = await apiRequest(`/tickets/child/${issueKey}`, "DELETE");
    if (res?.error) { console.error("❌ Child delete failed:", res.message); return; }
    setChildModal(null);
    loadTickets();
  }, [loadTickets]);

  // ── CHILD MODAL ──
  const openChildModal = useCallback(async (parentKey) => {
    const res = await apiRequest("/tickets");
    const all =
      Array.isArray(res)          ? res :
      Array.isArray(res?.tickets) ? res.tickets :
      Array.isArray(res?.data)    ? res.data : [];
    setChildModal({ parentKey, children: all.filter(t => t.parent_ticket_key === parentKey) });
  }, []);

  const detachChild = useCallback(async (issueKey) => {
    const res = await apiRequest(`/tickets/${issueKey}/detach`, "PUT");
    if (res?.error) { console.error("❌ Detach failed:", res.message); return; }
    setChildModal(null);
    loadTickets();
  }, [loadTickets]);

  // ── MERGE MODAL ──
  // Takes full ticket object (has safety check for child tickets)
  const openMergeModal = useCallback(async (ticket) => {
    // accept plain issueKey string for backwards compat
    const ticketObj = typeof ticket === "string" ? { issue_key: ticket } : ticket;

    if (ticketObj?.parent_ticket_key) {
      alert("Only parent tickets can merge");
      return;
    }

    const res = await apiRequest("/tickets");
    const all =
      Array.isArray(res)          ? res :
      Array.isArray(res?.tickets) ? res.tickets :
      Array.isArray(res?.data)    ? res.data : [];

    setMergeTickets(all.filter(t =>
      !t.parent_ticket_key &&
      !t.child_key         &&
      !t.sop_parent_key    &&
      t.issue_key !== ticketObj.issue_key
    ));
    setMergeModal({ targetKey: ticketObj.issue_key, ticket: ticketObj });
  }, []);

  // executeMerge — supports both (targetKey, sourceKey) and (payload object)
  const executeMerge = useCallback(async (targetKeyOrPayload, sourceKey) => {
    try {
      const payload =
        typeof targetKeyOrPayload === "object" && !sourceKey
          ? targetKeyOrPayload
          : { target_parent_key: targetKeyOrPayload, source_parent_keys: [sourceKey] };

      const res = await apiRequest("/tickets/merge", "POST", payload);
      console.log("Merge result:", res);

      if (res?.type === "error") {
        alert(res.message || "Merge failed");
        return;
      }

      setMergeModal(null);
      loadTickets();
    } catch (err) {
      console.error("merge error:", err);
      alert("Merge failed");
    }
  }, [loadTickets]);

  return {
    tickets, reminderTickets, completedReminders, loading, loadTickets,
    updateStatus, completeSingle, requestComplete,
    confirmModal, setConfirmModal, confirmComplete, afterCompleteFlow,
    deleteModal, openDeleteModal, closeDeleteModal: () => setDeleteModal(null),
    deleteParentCascade, deleteParentOnly, deleteSingleChild,
    childModal, openChildModal, closeChildModal: () => setChildModal(null), detachChild,
    mergeModal, mergeTickets, openMergeModal, closeMergeModal: () => setMergeModal(null), executeMerge,
  };
}