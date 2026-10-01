(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const isEdit = Boolean(id);

  const form       = document.getElementById("repairForm");
  const pageTitle  = document.getElementById("rfPageTitle");
  const panelTitle = document.getElementById("rfPanelTitle");
  const submitBtn  = document.getElementById("rfSubmit");
  const note       = document.getElementById("rfNote");

  const rfJob           = document.getElementById("rfJob");
  const rfStatus        = document.getElementById("rfStatus");
  const rfCustomer      = document.getElementById("rfCustomer");
  const rfPhone         = document.getElementById("rfPhone");
  const rfDevice        = document.getElementById("rfDevice");
  const rfModel         = document.getElementById("rfModel");
  const rfSerial        = document.getElementById("rfSerial");
  const rfEta           = document.getElementById("rfEta");
  const rfProblem       = document.getElementById("rfProblem");
  const rfCondition     = document.getElementById("rfCondition");
  const rfCurrent       = document.getElementById("rfCurrent");
  const rfAction        = document.getElementById("rfAction");
  const rfPart          = document.getElementById("rfPart");
  const rfPartStatus    = document.getElementById("rfPartStatus");
  const rfCustomerNote  = document.getElementById("rfCustomerNote");
  const rfInternalNote  = document.getElementById("rfInternalNote");

  const STATUSES = [
    "RECEIVED", "CHECKING", "WAITING FOR APPROVAL", "APPROVED", "REPAIRING",
    "PART / ACCESSORY REQUIRED", "PART / ACCESSORY PURCHASED", "READY",
    "DELIVERED / COLLECTED", "CANNOT REPAIR", "RETURNED", "CANCELLED",
  ];

  rfStatus.innerHTML = STATUSES.map((status) =>
    `<option value="${a2zEscape(status)}">${a2zEscape(status)}</option>`).join("");

  if (isEdit) {
    document.title    = "Edit Repair — A to Z Admin";
    pageTitle.textContent  = "Edit Repair Job";
    panelTitle.textContent = "Update repair job card";
    submitBtn.textContent  = "Save Changes";
  }

  async function nextJobNumber() {
    const { data } = await a2zSupabase.from("repairs").select("job_number");
    let max = 10000;
    (data || []).forEach((row) => {
      const num = parseInt(String(row.job_number).replace(/\D/g, ""), 10);
      if (!Number.isNaN(num) && num > max) max = num;
    });
    return `AZ${max + 1}`;
  }

  async function loadForEdit() {
    note.textContent = "Loading…";
    const { data, error } = await a2zSupabase
      .from("repairs").select("*").eq("id", id).maybeSingle();
    note.textContent = "";
    if (error || !data) {
      note.textContent = "Repair job not found.";
      submitBtn.disabled = true;
      return;
    }
    rfJob.value          = data.job_number;
    rfStatus.value       = data.status;
    rfCustomer.value     = data.customer_name;
    rfPhone.value        = data.customer_phone;
    rfDevice.value       = data.device_name;
    rfModel.value        = data.model || "";
    rfSerial.value       = data.serial_number || "";
    rfEta.value          = data.estimated_completion || "";
    rfProblem.value      = data.problem_reported;
    rfCondition.value    = data.initial_condition || "";
    rfCurrent.value      = data.current_condition;
    rfAction.value       = data.resolution_action;
    rfPart.value         = data.required_part || "";
    rfPartStatus.value   = data.part_status || "";
    rfCustomerNote.value = data.customer_note || "";
    rfInternalNote.value = data.internal_note || "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;
    note.textContent = isEdit ? "Saving changes…" : "Creating repair job…";

    const status = rfStatus.value;
    const payload = {
      customer_name:      rfCustomer.value.trim(),
      customer_phone:     rfPhone.value.trim(),
      device_name:        rfDevice.value.trim(),
      model:              rfModel.value.trim() || null,
      serial_number:      rfSerial.value.trim() || null,
      estimated_completion: rfEta.value || null,
      problem_reported:   rfProblem.value.trim(),
      initial_condition:  rfCondition.value.trim() || null,
      current_condition:  rfCurrent.value.trim(),
      resolution_action:  rfAction.value.trim(),
      required_part:      rfPart.value.trim() || null,
      part_status:        rfPartStatus.value || null,
      status,
      customer_note:      rfCustomerNote.value.trim() || null,
      internal_note:      rfInternalNote.value.trim() || null,
    };

    if (!isEdit) payload.job_number = rfJob.value;

    const { error } = isEdit
      ? await a2zSupabase.from("repairs").update(payload).eq("id", id)
      : await a2zSupabase.from("repairs").insert(payload);

    if (error) {
      submitBtn.disabled = false;
      note.textContent = a2zSupabaseError(error);
      return;
    }

    if (!isEdit) {
      /* record the opening entry in the status history */
      const { data: userData } = await a2zSupabase.auth.getUser();
      const { data: created } = await a2zSupabase
        .from("repairs").select("id").eq("job_number", payload.job_number).maybeSingle();
      if (created) {
        await a2zSupabase.from("repair_status_history").insert({
          repair_id:      created.id,
          old_status:     null,
          new_status:     status,
          condition_note: payload.problem_reported,
          changed_by:     userData?.user?.id || null,
        });
      }
    }

    window.location.href = "repairs.html";
  });

  /* init */
  if (isEdit) loadForEdit();
  else nextJobNumber().then((job) => { rfJob.value = job; });
})();
