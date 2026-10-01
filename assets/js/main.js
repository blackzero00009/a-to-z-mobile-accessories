/* Shared site behaviour: mobile menu + active nav state. */

(function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll(".main-nav a[data-nav]").forEach((link) => {
      link.classList.toggle("active", link.dataset.nav === page);
    });
  }
})();
