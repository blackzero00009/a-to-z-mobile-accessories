(function () {
  if (!a2zSupabase) { window.location.replace("login.html"); return; }

  const id = new URLSearchParams(location.search).get("id");
  const isEdit = Boolean(id);

  const form       = document.getElementById("adminForm");
  const pageTitle  = document.getElementById("afPageTitle");
  const panelTitle = document.getElementById("afPanelTitle");
  const submitBtn  = document.getElementById("afSubmit");
  const note       = document.getElementById("afNote");

  const afEmail    = document.getElementById("afEmail");
  const afPassword = document.getElementById("afPassword");
  const afName     = document.getElementById("afName");
  const afRole     = document.getElementById("afRole");
  const afStatus   = document.getElementById("afStatus");
  const pwWrap     = document.getElementById("afPasswordWrap");

  if (isEdit) {
    document.title         = "Edit Admin — A to Z Admin";
    pageTitle.textContent  = "Edit Admin";
    panelTitle.textContent = "Update admin details";
    submitBtn.textContent  = "Save Changes";
    afEmail.disabled = true;
    pwWrap.style.display = "none";
    afPassword.removeAttribute("required");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submitBtn.disabled = true;

    if (isEdit) {
      note.textContent = "Saving changes…";
      note.classList.remove("warn");
      const payload = {
        full_name:  afName.value.trim(),
        role:       afRole.value,
        is_active:  afStatus.value === "true",
        updated_at: new Date().toISOString(),
      };
      const { error } = await a2zSupabase
        .from("profiles").update(payload).eq("id", id);
      if (error) {
        submitBtn.disabled = false;
        note.textContent = a2zSupabaseError(error);
        return;
      }
      window.location.href = "admins.html";
      return;
    }

    note.textContent = "Creating admin user…";
    note.classList.remove("warn");
    const email    = afEmail.value.trim();
    const password = afPassword.value;
    const fullName = afName.value.trim();

    const { data: signUpData, error: signUpError } = await a2zSupabase.auth.signUp({ email, password });
    if (signUpError) {
      submitBtn.disabled = false;
      note.textContent = signUpError.message;
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      submitBtn.disabled = false;
      note.textContent = "Account created but could not retrieve user ID. Check Supabase dashboard.";
      return;
    }

    const { error: profileError } = await a2zSupabase
      .from("profiles").insert({
        id:         userId,
        full_name:  fullName,
        email:      email,
        role:       afRole.value,
        is_active:  afStatus.value === "true",
      });

    if (profileError) {
      submitBtn.disabled = false;
      note.textContent = "Account created but profile setup failed: " + a2zSupabaseError(profileError);
      return;
    }

    note.textContent = "Admin created successfully. They must confirm their email before logging in.";
    setTimeout(() => { window.location.href = "admins.html"; }, 2000);
  });

  if (isEdit) {
    (async () => {
      const { data: { user } } = await a2zSupabase.auth.getUser();
      if (!user) { window.location.replace("login.html"); return; }

      note.textContent = "Loading…";
      const { data: profile, error } = await a2zSupabase
        .from("profiles").select("id, full_name, email, role, is_active").eq("id", id).maybeSingle();

      if (error || !profile) {
        note.textContent = "Admin user not found.";
        submitBtn.disabled = true;
        return;
      }
      note.textContent = "";

      afEmail.value    = profile.email || "";
      afName.value     = profile.full_name;
      afRole.value     = profile.role;
      afStatus.value   = String(profile.is_active);

      if (profile.role === "web_owner") {
        note.textContent = "Web Owner role cannot be changed from this page.";
        note.classList.add("warn");
        afRole.disabled = true;
      }
    })();
  }
})();
