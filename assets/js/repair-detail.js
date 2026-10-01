(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const root = document.getElementById("rdRoot");
  const jobNumberEl = document.getElementById("rdJobNumber");

  const STATUSES = [
    "RECEIVED", "CHECKING", "WAITING FOR APPROVAL", "APPROVED", "REPAIRING",
    "PART / ACCESSORY REQUIRED", "PART / ACCESSORY PURCHASED", "READY",
    "DELIVERED / COLLECTED", "CANNOT REPAIR", "RETURNED", "CANCELLED",
  ];

  function showMissing(message) {
    root.innerHTML = `<div class="panel"><div class="panel-body"><div class="result-empty"><strong>${a2zEscape(message)}</strong><div style="margin-top:14px;"><a class="btn btn-dark btn-sm" href="repairs.html">Back to Repairs</a></div></div></div></div>`;
  }

  function dash(value) { return value ? a2zEscape(value) : "—"; }

  function render(repair, history) {
    document.title = `Repair ${repair.job_number} — A to Z Admin`;
    jobNumberEl.textContent = repair.job_number;

    const statusForm = `
      <form class="status-form" id="statusForm">
        <label for="rdNewStatus" style="font-size:12px;font-weight:700;color:var(--muted);">Update status</label>
        <select id="rdNewStatus">${STATUSES.map((status) => `<option value="${a2zEscape(status)}"${status === repair.status ? " selected" : ""}>${a2zEscape(status)}</option>`).join("")}</select>
        <textarea id="rdStatusNote" placeholder="Note for this status change (shown in history)"></textarea>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-dark btn-sm" type="submit" id="rdStatusBtn">Update Status</button>
          <p id="rdStatusNoteMsg" class="form-note" style="margin:0;" aria-live="polite"></p>
        </div>
      </form>`;

    const timeline = history.length
      ? history.map((entry) => `<li>
          <div class="t-time">${a2zEscape(a2zFormatDate(entry.changed_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }))}</div>
          <div class="t-status">${a2zEscape(entry.new_status)}</div>
          <div class="t-note">${dash(entry.condition_note || entry.action_note)}</div>
        </li>`).join("")
      : `<li><div class="t-status">No history yet</div><div class="t-note">Status changes will appear here.</div></li>`;

    root.innerHTML = `
      <div class="admin-actions">
        <a class="btn btn-outline btn-sm" href="repairs.html">← Back to repairs</a>
        <a class="btn btn-dark btn-sm" href="repair-form.html?id=${encodeURIComponent(repair.id)}">Edit Job Card</a>
      </div>

      <div class="split-2" style="gap:22px;">
        <div style="display:grid;gap:22px;align-content:start;">
          <div class="panel">
            <div class="panel-head"><h2>Customer</h2></div>
            <div class="panel-body">
              <div class="detail-grid">
                <div class="detail-item"><span>Name</span><strong>${dash(repair.customer_name)}</strong></div>
                <div class="detail-item"><span>Phone</span><strong>${dash(repair.customer_phone)}</strong></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2>Device</h2></div>
            <div class="panel-body">
              <div class="detail-grid">
                <div class="detail-item"><span>Device</span><strong>${dash(repair.device_name)}</strong></div>
                <div class="detail-item"><span>Model</span><strong>${dash(repair.model)}</strong></div>
                <div class="detail-item"><span>Serial Number</span><strong>${dash(repair.serial_number)}</strong></div>
                <div class="detail-item"><span>Received</span><strong>${a2zEscape(a2zFormatDate(repair.received_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}</strong></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2>Intake</h2></div>
            <div class="panel-body">
              <div class="detail-grid" style="grid-template-columns:1fr;">
                <div class="detail-item"><span>Problem Reported</span><p>${dash(repair.problem_reported)}</p></div>
                <div class="detail-item"><span>Initial Condition</span><p>${dash(repair.initial_condition)}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div style="display:grid;gap:22px;align-content:start;">
          <div class="panel">
            <div class="panel-head">
              <h2>Current status</h2>
              <span class="badge ${a2zStatusBadge(repair.status)}">${a2zEscape(repair.status)}</span>
            </div>
            <div class="panel-body">
              <div class="detail-grid" style="grid-template-columns:1fr;">
                <div class="detail-item"><span>Current Condition (customer-visible)</span><p>${dash(repair.current_condition)}</p></div>
                <div class="detail-item"><span>Action Being Taken (customer-visible)</span><p>${dash(repair.resolution_action)}</p></div>
                <div class="detail-item"><span>Required Part</span><p>${dash(repair.required_part)}${repair.part_status ? ` — <strong>${a2zEscape(repair.part_status)}</strong>` : ""}</p></div>
                <div class="detail-item"><span>Expected Completion</span><strong>${repair.estimated_completion ? a2zEscape(a2zFormatDate(repair.estimated_completion)) : "—"}</strong></div>
                <div class="detail-item"><span>Customer Note</span><p>${dash(repair.customer_note)}</p></div>
                <div class="detail-item"><span>Internal Note (admins only)</span><p>${dash(repair.internal_note)}</p></div>
              </div>
              ${statusForm}
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2>Status history</h2></div>
            <div class="panel-body">
              <ul class="timeline">${timeline}</ul>
            </div>
          </div>
        </div>
      </div>`;

    bindStatusForm(repair);
  }

  function bindStatusForm(repair) {
    const form = document.getElementById("statusForm");
    const select = document.getElementById("rdNewStatus");
    const noteInput = document.getElementById("rdStatusNote");
    const button = document.getElementById("rdStatusBtn");
    const msg = document.getElementById("rdStatusNoteMsg");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const newStatus = select.value;
      if (newStatus === repair.status && !noteInput.value.trim()) {
        msg.textContent = "Choose a different status or add a note.";
        return;
      }
      button.disabled = true;
      msg.textContent = "Updating…";

      const { data: userData } = await a2zSupabase.auth.getUser();
      const { error: historyError } = await a2zSupabase.from("repair_status_history").insert({
        repair_id:      repair.id,
        old_status:     repair.status,
        new_status:     newStatus,
        condition_note: noteInput.value.trim() || null,
        changed_by:     userData?.user?.id || null,
      });
      if (historyError) {
        button.disabled = false;
        msg.textContent = a2zSupabaseError(historyError);
        return;
      }

      const { error: updateError } = await a2zSupabase
        .from("repairs").update({ status: newStatus }).eq("id", repair.id);
      if (updateError) {
        button.disabled = false;
        msg.textContent = a2zSupabaseError(updateError);
        return;
      }

      load();
    });
  }

  async function load() {
    if (!id) { showMissing("Repair job not found."); return; }
    const { data: repair, error } = await a2zSupabase
      .from("repairs").select("*").eq("id", id).maybeSingle();
    if (error || !repair) { showMissing(error ? "Repair details are temporarily unavailable." : "Repair job not found."); return; }

    const { data: history } = await a2zSupabase
      .from("repair_status_history")
      .select("new_status, condition_note, action_note, changed_at")
      .eq("repair_id", repair.id)
      .order("changed_at", { ascending: true });

    render(repair, history || []);
  }

  load();
})();
