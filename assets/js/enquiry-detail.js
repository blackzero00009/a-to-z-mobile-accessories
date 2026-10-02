(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const root = document.getElementById("edRoot");

  const STATUSES = ["NEW", "IN PROGRESS", "RESOLVED"];

  const BADGE = {
    "NEW": "badge-received",
    "IN PROGRESS": "badge-repairing",
    "RESOLVED": "badge-delivered",
  };

  function dash(value) { return value ? a2zEscape(value) : "—"; }

  function showMissing(message) {
    root.innerHTML = `<div class="panel"><div class="panel-body"><div class="result-empty"><strong>${a2zEscape(message)}</strong><div style="margin-top:14px;"><a class="btn btn-dark btn-sm" href="enquiries.html">Back to Enquiries</a></div></div></div></div>`;
  }

  function render(enquiry) {
    document.title = `Enquiry — ${enquiry.customer_name} — A to Z Admin`;

    root.innerHTML = `
      <div class="admin-actions">
        <a class="btn btn-outline btn-sm" href="enquiries.html">← Back to enquiries</a>
      </div>

      <div class="split-2" style="gap:22px;">
        <div class="panel">
          <div class="panel-head">
            <h2>Customer</h2>
            <span class="badge ${BADGE[enquiry.status] || "badge-received"}">${a2zEscape(enquiry.status)}</span>
          </div>
          <div class="panel-body">
            <div class="detail-grid">
              <div class="detail-item"><span>Name</span><strong>${dash(enquiry.customer_name)}</strong></div>
              <div class="detail-item"><span>Phone</span><strong><a href="tel:${a2zEscape(enquiry.customer_phone)}">${dash(enquiry.customer_phone)}</a></strong></div>
              <div class="detail-item"><span>Email</span><strong>${enquiry.customer_email ? `<a href="mailto:${a2zEscape(enquiry.customer_email)}">${a2zEscape(enquiry.customer_email)}</a>` : "—"}</strong></div>
              <div class="detail-item"><span>Received</span><strong>${dash(a2zFormatDate(enquiry.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}</strong></div>
            </div>
          </div>
        </div>

        <div style="display:grid;gap:22px;align-content:start;">
          <div class="panel">
            <div class="panel-head"><h2>Message</h2></div>
            <div class="panel-body">
              <p class="detail-item" style="margin:0 0 12px;"><span>Regarding</span><strong>${dash(enquiry.subject)}</strong></p>
              <p style="margin:0;white-space:pre-wrap;">${dash(enquiry.message) || '<span class="form-note">No message provided.</span>'}</p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2>Status</h2></div>
            <div class="panel-body">
              <form class="status-form" id="edStatusForm">
                <label for="edStatus" style="font-size:12px;font-weight:700;color:var(--muted);">Update status</label>
                <select id="edStatus">${STATUSES.map((status) => `<option value="${a2zEscape(status)}"${status === enquiry.status ? " selected" : ""}>${a2zEscape(status)}</option>`).join("")}</select>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                  <button class="btn btn-dark btn-sm" type="submit" id="edStatusBtn">Update Status</button>
                  <p id="edStatusNote" class="form-note" style="margin:0;" aria-live="polite"></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>`;

    const form = document.getElementById("edStatusForm");
    const btn = document.getElementById("edStatusBtn");
    const note = document.getElementById("edStatusNote");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const next = document.getElementById("edStatus").value;
      btn.disabled = true;
      note.textContent = "Updating…";
      const { error } = await a2zSupabase
        .from("enquiries")
        .update({ status: next })
        .eq("id", id);
      btn.disabled = false;
      if (error) {
        note.textContent = a2zSupabaseError(error);
        return;
      }
      enquiry.status = next;
      const badge = root.querySelector(".badge");
      badge.className = `badge ${BADGE[next] || "badge-received"}`;
      badge.textContent = next;
      note.textContent = "Status updated.";
    });
  }

  (async () => {
    if (!id) { showMissing("No enquiry selected."); return; }
    const { data, error } = await a2zSupabase
      .from("enquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) { showMissing("Enquiry not found."); return; }
    render(data);
  })();
})();
