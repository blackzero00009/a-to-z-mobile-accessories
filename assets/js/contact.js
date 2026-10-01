(function () {
  const form = document.getElementById("enquiryForm");
  const note = document.getElementById("enquiryNote");
  if (!form || !note) return;

  const product = new URLSearchParams(location.search).get("product");
  if (product) {
    const message = document.getElementById("enqMessage");
    message.value = `I would like to know more about ${product.replaceAll("-", " ")}.`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!a2zSupabase) {
      note.textContent = "The enquiry form is temporarily unavailable. Please call the shop.";
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    button.disabled = true;
    note.textContent = "Sending your enquiry…";
    const { error } = await a2zSupabase.from("enquiries").insert({
      customer_name: formData.get("name").trim(),
      customer_phone: formData.get("phone").trim(),
      subject: formData.get("subject"),
      message: formData.get("message").trim() || null,
    });
    button.disabled = false;
    if (error) {
      note.textContent = a2zSupabaseError(error);
      return;
    }
    form.reset();
    note.textContent = "Thank you. Your enquiry has been sent to the shop.";
  });
})();
