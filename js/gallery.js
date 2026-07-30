async function loadGallery() {
  const galleryGrid = document.querySelector("#gallery-grid");
  const galleryEmpty = document.querySelector("#gallery-empty");

  if (!galleryGrid) return;

  try {
    const response = await fetch("/data/gallery.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Gallery data unavailable");

    const data = await response.json();
    const items = normalizeGalleryItems(data);
    renderGallery(items, galleryGrid, galleryEmpty);
  } catch {
    if (galleryEmpty) {
      galleryEmpty.hidden = false;
      galleryEmpty.textContent =
        "Gallery photos will appear here soon. Check back shortly.";
    }
  }
}

function normalizeGalleryItems(data) {
  if (Array.isArray(data.items) && data.items.length > 0) {
    return data.items;
  }

  if (!Array.isArray(data.photos)) {
    return [];
  }

  return data.photos.map((photo) => ({
    type: "single",
    image: photo.image,
    caption: photo.caption,
    layout: photo.layout,
  }));
}

function createSingleItem(item) {
  const figure = document.createElement("figure");
  figure.className = "gallery-item";

  if (item.layout === "tall") {
    figure.classList.add("gallery-item-tall");
  } else if (item.layout === "wide") {
    figure.classList.add("gallery-item-wide");
  }

  const img = document.createElement("img");
  img.src = item.image;
  img.alt = item.caption || "Painting and decorating project";
  img.loading = "lazy";
  figure.appendChild(img);

  if (item.caption) {
    const caption = document.createElement("figcaption");
    caption.className = "gallery-caption";
    caption.textContent = item.caption;
    figure.appendChild(caption);
  }

  return figure;
}

function createPairItem(item) {
  const figure = document.createElement("figure");
  figure.className = "gallery-item gallery-item-pair";

  figure.innerHTML = `
    <div class="gallery-pair">
      <div class="gallery-pair-header">
        <h3>${escapeText(item.title || "Before & after")}</h3>
      </div>
      <div class="gallery-pair-grid">
        <div class="gallery-pair-photo">
          <span class="gallery-pair-label">Before</span>
          <img src="${escapeAttr(item.before)}" alt="${escapeAttr(item.title || "Project")} — before" loading="lazy" />
        </div>
        <div class="gallery-pair-photo">
          <span class="gallery-pair-label">After</span>
          <img src="${escapeAttr(item.after)}" alt="${escapeAttr(item.title || "Project")} — after" loading="lazy" />
        </div>
      </div>
    </div>
  `;

  return figure;
}

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeText(value).replaceAll('"', "&quot;");
}

function renderGallery(items, galleryGrid, galleryEmpty) {
  galleryGrid.innerHTML = "";

  if (items.length === 0) {
    if (galleryEmpty) {
      galleryEmpty.hidden = false;
    }
    return;
  }

  if (galleryEmpty) {
    galleryEmpty.hidden = true;
  }

  items.forEach((item) => {
    if (item.type === "pair" && item.before && item.after) {
      galleryGrid.appendChild(createPairItem(item));
      return;
    }

    if (item.image) {
      galleryGrid.appendChild(createSingleItem(item));
    }
  });
}

function initGallery() {
  if (document.querySelector("#gallery-grid")) {
    loadGallery();
  }
}

document.addEventListener("site:ready", initGallery);
