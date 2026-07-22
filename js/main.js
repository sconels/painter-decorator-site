const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector("#site-nav");
const year = document.querySelector("#year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelector(".contact-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  alert(
    "Thanks for your enquiry. Connect this form to email or a form service when you go live."
  );
});
