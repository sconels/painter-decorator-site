const COLOR_THEMES = {
  warm: {
    bg: "#f7f4ef",
    bgMuted: "#efeae2",
    accent: "#c45c26",
    accentDark: "#9a4518",
    navy: "#1b3a4b",
    navySoft: "#2f5d73",
  },
  forest: {
    bg: "#f3f6f4",
    bgMuted: "#e6ece8",
    accent: "#2d6a4f",
    accentDark: "#1b4332",
    navy: "#1d3557",
    navySoft: "#457b9d",
  },
  coastal: {
    bg: "#f4f7fb",
    bgMuted: "#e8eef5",
    accent: "#0077b6",
    accentDark: "#023e8a",
    navy: "#1b263b",
    navySoft: "#415a77",
  },
  slate: {
    bg: "#f8f9fa",
    bgMuted: "#e9ecef",
    accent: "#495057",
    accentDark: "#343a40",
    navy: "#212529",
    navySoft: "#495057",
  },
};

const FONT_STYLES = {
  classic: {
    body: '"DM Sans", system-ui, sans-serif',
    display: '"Fraunces", Georgia, serif',
    url: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap",
  },
  modern: {
    body: '"Inter", system-ui, sans-serif',
    display: '"Inter", system-ui, sans-serif',
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  traditional: {
    body: '"Source Sans 3", system-ui, sans-serif',
    display: '"Libre Baskerville", Georgia, serif',
    url: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function phoneHref(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `+44${digits.slice(1)}`;
  }
  return digits ? `+${digits}` : "";
}

function applyDesign(design = {}) {
  const theme = COLOR_THEMES[design.colorTheme] ?? COLOR_THEMES.warm;
  const fonts = FONT_STYLES[design.fontStyle] ?? FONT_STYLES.classic;
  const root = document.documentElement;

  root.style.setProperty("--bg", theme.bg);
  root.style.setProperty("--bg-muted", theme.bgMuted);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-dark", theme.accentDark);
  root.style.setProperty("--navy", theme.navy);
  root.style.setProperty("--navy-soft", theme.navySoft);
  root.style.setProperty("--border", `${theme.navy}1f`);
  root.style.setProperty("--shadow", `0 18px 50px ${theme.navy}1f`);
  root.style.setProperty("--font-body", fonts.body);
  root.style.setProperty("--font-display", fonts.display);

  let fontLink = document.querySelector("#site-fonts");
  if (!fontLink) {
    fontLink = document.createElement("link");
    fontLink.id = "site-fonts";
    fontLink.rel = "stylesheet";
    document.head.appendChild(fontLink);
  }
  fontLink.href = fonts.url;
}

function renderHeader(site) {
  const business = site.business ?? {};
  document.querySelectorAll(".logo-text").forEach((node) => {
    node.textContent = business.name ?? "";
  });
}

function renderHero(site) {
  if (!site.sections?.hero) return "";

  const hero = site.hero ?? {};
  const business = site.business ?? {};
  const trustPoints = (hero.trustPoints ?? [])
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join("");

  const visual = hero.showVisual
    ? `<div class="hero-visual" aria-hidden="true">
        <div class="hero-card hero-card-main">
          <div class="swatch swatch-1"></div>
          <div class="swatch swatch-2"></div>
          <div class="swatch swatch-3"></div>
          <p>${escapeHtml(hero.visualTagline)}</p>
        </div>
        <div class="hero-card hero-card-accent">
          <strong>${escapeHtml(hero.statValue)}</strong>
          <span>${escapeHtml(hero.statLabel)}</span>
        </div>
      </div>`
    : "";

  return `<section class="hero">
    <div class="container hero-grid${hero.showVisual ? "" : " hero-grid-single"}">
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(hero.eyebrow)}</p>
        <h1>${escapeHtml(hero.headline)}</h1>
        <p class="lead">${escapeHtml(hero.lead)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#contact">${escapeHtml(hero.primaryButton)}</a>
          <a class="btn btn-secondary" href="tel:${phoneHref(business.phone)}">Call ${escapeHtml(business.phone)}</a>
        </div>
        <ul class="trust-list">${trustPoints}</ul>
      </div>
      ${visual}
    </div>
  </section>`;
}

function renderServices(site) {
  if (!site.sections?.services) return "";

  const section = site.services ?? {};
  const items = (section.items ?? [])
    .map(
      (item, index) => `<article class="service-card">
        <div class="service-icon" aria-hidden="true">${String(index + 1).padStart(2, "0")}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </article>`
    )
    .join("");

  return `<section class="section" id="services">
    <div class="container">
      <div class="section-heading">
        <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.description)}</p>
      </div>
      <div class="card-grid">${items}</div>
    </div>
  </section>`;
}

function renderAbout(site) {
  if (!site.sections?.about) return "";

  const section = site.about ?? {};
  const points = (section.points ?? [])
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join("");

  const stats = section.showStats
    ? `<div class="stats-panel">
        ${(section.stats ?? [])
          .map(
            (stat) => `<div class="stat">
              <strong>${escapeHtml(stat.value)}</strong>
              <span>${escapeHtml(stat.label)}</span>
            </div>`
          )
          .join("")}
      </div>`
    : "";

  return `<section class="section section-muted" id="about">
    <div class="container about-grid${section.showStats ? "" : " about-grid-single"}">
      <div>
        <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.description)}</p>
        <ul class="check-list">${points}</ul>
      </div>
      ${stats}
    </div>
  </section>`;
}

function renderGallerySection(site) {
  if (!site.sections?.gallery) return "";

  const section = site.gallery ?? {};

  return `<section class="section" id="work">
    <div class="container">
      <div class="section-heading">
        <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.description)}</p>
      </div>
      <p class="gallery-empty" id="gallery-empty" hidden>Project photos coming soon.</p>
      <div class="gallery-grid" id="gallery-grid"></div>
    </div>
  </section>`;
}

function renderReviews(site) {
  if (!site.sections?.reviews) return "";

  const section = site.reviews ?? {};
  const reviewItems = section.items ?? [];

  if (reviewItems.length === 0) return "";

  const items = reviewItems
    .map(
      (item) => `<blockquote class="review-card">
        <p>“${escapeHtml(item.quote)}”</p>
        <footer>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.detail)}</span>
        </footer>
      </blockquote>`
    )
    .join("");

  return `<section class="section section-muted" id="reviews">
    <div class="container">
      <div class="section-heading">
        <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <div class="review-grid">${items}</div>
    </div>
  </section>`;
}

function isValidMapEmbedUrl(url) {
  return /https:\/\/(www\.)?google\.com\/maps\/embed/i.test(url);
}

function sanitizeMapEmbedUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  if (raw.includes("<iframe")) {
    const match = raw.match(/src=["']([^"']+)["']/i);
    if (match?.[1]) {
      return match[1].replace(/&amp;/g, "&");
    }
  }

  if (raw.startsWith('src="') || raw.startsWith("src='")) {
    return raw.replace(/^src=["']/, "").replace(/["']>.*$/, "").replace(/&amp;/g, "&");
  }

  return raw.replace(/&amp;/g, "&");
}

function mountMap(site) {
  const container = document.querySelector("#map-embed-container");
  if (!container || !site.sections?.map || !site.map?.enabled) return;

  const embedUrl = sanitizeMapEmbedUrl(site.map.embedUrl);
  if (!isValidMapEmbedUrl(embedUrl)) {
    container.innerHTML =
      '<p class="map-error">Map unavailable. Use the link below to view the area in Google Maps.</p>';
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = embedUrl;
  iframe.title = site.map.title || "Service area map";
  iframe.loading = "lazy";
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  iframe.allowFullscreen = true;
  container.appendChild(iframe);
}

function renderMap(site) {
  if (!site.sections?.map || !site.map?.enabled) return "";

  const map = site.map ?? {};

  return `<section class="section section-muted" id="area">
    <div class="container">
      <div class="section-heading">
        <p class="eyebrow">${escapeHtml(map.eyebrow)}</p>
        <h2>${escapeHtml(map.title)}</h2>
        <p>${escapeHtml(map.description)}</p>
      </div>
      <div class="map-embed" id="map-embed-container"></div>
      <p class="map-fallback">
        <a href="https://www.google.com/maps/search/?api=1&amp;query=Cambridge,+United+Kingdom" target="_blank" rel="noopener noreferrer">
          Open Cambridge service area in Google Maps
        </a>
      </p>
    </div>
  </section>`;
}

function renderContact(site) {
  if (!site.sections?.contact) return "";

  const section = site.contact ?? {};
  const business = site.business ?? {};
  const options = (section.serviceOptions ?? [])
    .map((option) => `<option>${escapeHtml(option)}</option>`)
    .join("");

  return `<section class="section contact-section" id="contact">
    <div class="container contact-grid">
      <div>
        <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.description)}</p>
        <ul class="contact-details">
          <li>
            <span>Phone</span>
            <a href="tel:${phoneHref(business.phone)}">${escapeHtml(business.phone)}</a>
          </li>
          <li>
            <span>Email</span>
            <a href="mailto:${escapeHtml(business.email)}">${escapeHtml(business.email)}</a>
          </li>
          <li>
            <span>Area</span>
            <strong>${escapeHtml(business.area)}</strong>
          </li>
        </ul>
      </div>
      <form class="contact-form" action="https://formsubmit.co/${encodeURIComponent(business.email ?? "")}" method="POST">
        <input type="hidden" name="_subject" value="New website enquiry — ${escapeHtml(business.name)}" />
        <input type="hidden" name="_captcha" value="true" />
        <input type="hidden" name="_template" value="table" />
        <label class="form-honeypot" aria-hidden="true">
          Leave this empty
          <input type="text" name="_honey" tabindex="-1" autocomplete="off" />
        </label>
        <label>
          Name
          <input type="text" name="name" autocomplete="name" required />
        </label>
        <label>
          Phone or email
          <input type="text" name="contact" autocomplete="email" required />
        </label>
        <label>
          What do you need help with?
          <select name="service" required>
            <option value="">Choose a service</option>
            ${options}
          </select>
        </label>
        <label>
          Project details
          <textarea name="message" rows="4" placeholder="Room sizes, timelines, photos welcome..." required></textarea>
        </label>
        <button class="btn btn-primary btn-full" type="submit">Send enquiry</button>
        <p class="form-note">${escapeHtml(section.formNote)}</p>
      </form>
    </div>
  </section>`;
}

function setMetaTag(attribute, name, content) {
  if (!content) return;

  let tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLinkTag(rel, href) {
  if (!href) return;

  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function applySocialMeta(site) {
  const business = site.business ?? {};
  const social = site.social ?? {};
  const siteUrl = (site.siteUrl ?? window.location.origin).replace(/\/$/, "");
  const title = social.title ?? business.name ?? document.title;
  const description =
    social.description ??
    `${business.name} — professional painting and decorating for homes and businesses.`;
  const imagePath = social.image ?? "/social/og-image.png";
  const imageUrl = imagePath.startsWith("http")
    ? imagePath
    : `${siteUrl}${imagePath}`;
  const imageAlt =
    social.imageAlt ?? `${business.name} project photo`;

  setMetaTag("name", "description", description);
  setLinkTag("canonical", `${siteUrl}/`);
  setMetaTag("property", "og:type", "website");
  setMetaTag("property", "og:site_name", business.name ?? title);
  setMetaTag("property", "og:locale", "en_GB");
  setMetaTag("property", "og:title", title);
  setMetaTag("property", "og:description", description);
  setMetaTag("property", "og:url", `${siteUrl}/`);
  setMetaTag("property", "og:image", imageUrl);
  setMetaTag("property", "og:image:alt", imageAlt);
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", title);
  setMetaTag("name", "twitter:description", description);
  setMetaTag("name", "twitter:image", imageUrl);
  setMetaTag("name", "twitter:image:alt", imageAlt);
}

function applyAnalytics(site) {
  const token = site.analytics?.cloudflareToken?.trim();
  if (!token || document.querySelector("#cf-analytics")) return;

  const script = document.createElement("script");
  script.id = "cf-analytics";
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.setAttribute(
    "data-cf-beacon",
    JSON.stringify({ token, spa: true })
  );
  document.body.appendChild(script);
}

function renderFooter(site) {
  const business = site.business ?? {};
  const links = [];

  if (site.sections?.services) links.push('<a href="#services">Services</a>');
  if (site.sections?.about) links.push('<a href="#about">About</a>');
  if (site.sections?.gallery) links.push('<a href="#work">Our Work</a>');
  if (site.sections?.reviews) links.push('<a href="#reviews">Reviews</a>');
  if (site.sections?.contact) links.push('<a href="#contact">Contact</a>');

  const footerTagline = document.querySelector("#footer-tagline");
  if (footerTagline) {
    footerTagline.textContent = business.tagline ?? "";
  }

  const footerLinks = document.querySelector("#footer-links");
  if (footerLinks) {
    footerLinks.innerHTML = links.join("");
  }

  const footerCopy = document.querySelector("#footer-copy-name");
  if (footerCopy) {
    footerCopy.textContent = business.name ?? "";
  }
}

function renderNav(site) {
  const nav = document.querySelector("#site-nav");
  if (!nav) return;

  const links = [];
  if (site.sections?.services) links.push('<a href="#services">Services</a>');
  if (site.sections?.about) links.push('<a href="#about">About</a>');
  if (site.sections?.gallery) links.push('<a href="#work">Our Work</a>');
  if (site.sections?.reviews) links.push('<a href="#reviews">Reviews</a>');
  if (site.sections?.contact) {
    links.push('<a class="nav-cta" href="#contact">Get a quote</a>');
  }

  nav.innerHTML = links.join("");
}

async function loadSiteContent() {
  const main = document.querySelector("#site-main");
  if (!main) return;

  try {
    const response = await fetch("/data/site.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Site content unavailable");

    const site = await response.json();
    applyDesign(site.design);
    renderHeader(site);
    renderNav(site);

    main.innerHTML = [
      renderHero(site),
      renderServices(site),
      renderAbout(site),
      renderGallerySection(site),
      renderReviews(site),
      renderMap(site),
      renderContact(site),
    ].join("");

    renderFooter(site);
    mountMap(site);
    applySocialMeta(site);
    applyAnalytics(site);

    document.title = site.business?.name ?? document.title;

    document.dispatchEvent(new CustomEvent("site:ready", { detail: site }));
  } catch (error) {
    main.innerHTML =
      '<section class="section"><div class="container"><p>Website content is loading. Please refresh the page.</p></div></section>';
    console.error(error);
  } finally {
    document.documentElement.classList.remove("is-loading");
    document.documentElement.classList.add("is-ready");
  }
}

loadSiteContent();
