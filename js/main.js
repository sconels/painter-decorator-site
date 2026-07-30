const navToggle = document.querySelector(".nav-toggle");
const year = document.querySelector("#year");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

function bindNavigation() {
  const siteNav = document.querySelector("#site-nav");
  if (!navToggle || !siteNav) return;

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

document.addEventListener("site:ready", bindNavigation);
