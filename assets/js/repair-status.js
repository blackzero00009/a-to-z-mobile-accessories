(function () {
  const form = document.getElementById("repairForm");
  const input = document.getElementById("jobNumber");
  const result = document.getElementById("repairResult");
  if (!form || !result) return;

  function renderError(title, detail) {
    result.innerHTML = `<div class="result-empty"><strong>${a2zEscape(title)}</strong><span>${a2zEscape(detail)}</span></div>`;
  }

  function renderRecord(record) {
    result.innerHTML = `
      <div class="result-card">
        <div class="result-head"><div><span class="eyebrow">Repair status</span><h2>${a2zEscape(record.job_number)}</h2></div><span class="badge ${a2zStatusBadge(record.status)}">${a2zEscape(record.status)}</span></div>
        <dl>
          <div class="result-row"><dt>Item</dt><dd>${a2zEscape(record.item)}</dd></div>
          <div class="result-row"><dt>Received</dt><dd>${a2zEscape(a2zFormatDate(record.received_at, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }))}</dd></div>
          <div class="result-row"><dt>Problem Reported</dt><dd>${a2zEscape(record.problem_reported)}</dd></div>
          <div class="result-row"><dt>Current Condition</dt><dd>${a2zEscape(record.current_condition)}</dd></div>
          <div class="result-row"><dt>Action Being Taken</dt><dd>${a2zEscape(record.resolution_action)}</dd></div>
          <div class="result-row"><dt>Estimated Completion</dt><dd>${a2zEscape(a2zFormatDate(record.estimated_completion))}</dd></div>
        </dl>
      </div>`;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function lookup(job) {
    if (!a2zSupabase) {
      renderError("Repair lookup is temporarily unavailable.", "Please call the shop for an update.");
      return;
    }
    const { data, error } = await a2zSupabase.rpc("public_repair_status", { p_job_number: job });
    if (error) {
      renderError("Repair lookup is temporarily unavailable.", a2zSupabaseError(error));
      return;
    }
    if (!data?.length) {
      renderError("Job number not found.", "Please check the number and try again.");
      return;
    }
    renderRecord(data[0]);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const job = input.value.trim().toUpperCase();
    if (!job) return;
    const url = new URL(location.href);
    url.searchParams.set("job", job);
    history.replaceState(null, "", url);
    lookup(job);
  });

  const preset = new URLSearchParams(location.search).get("job");
  if (preset) {
    input.value = preset.toUpperCase();
    lookup(preset.toUpperCase());
  }
})();
