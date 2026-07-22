const galleryGrid = document.querySelector("#gallery-grid");
const galleryEmpty = document.querySelector("#gallery-empty");

async function loadGallery() {
  if (!galleryGrid) return;

  try {
    const response = await fetch("/data/gallery.json");
    if (!response.ok) throw new Error("Gallery data unavailable");

    const data = await response.json();
    const photos = Array.isArray(data.photos) ? data.photos : [];
    renderGallery(photos);
  } catch {
    if (galleryEmpty) {
      galleryEmpty.hidden = false;
      galleryEmpty.textContent =
        "Gallery photos will appear here soon. Check back shortly.";
    }
  }
}

function renderGallery(photos) {
  galleryGrid.innerHTML = "";

  if (photos.length === 0) {
    if (galleryEmpty) {
      galleryEmpty.hidden = false;
    }
    return;
  }

  if (galleryEmpty) {
    galleryEmpty.hidden = true;
  }

  photos.forEach((photo) => {
    if (!photo.image) return;

    const figure = document.createElement("figure");
    figure.className = "gallery-item";

    if (photo.layout === "tall") {
      figure.classList.add("gallery-item-tall");
    } else if (photo.layout === "wide") {
      figure.classList.add("gallery-item-wide");
    }

    const img = document.createElement("img");
    img.src = photo.image;
    img.alt = photo.caption || "Painting and decorating project";
    img.loading = "lazy";

    figure.appendChild(img);

    if (photo.caption) {
      const caption = document.createElement("figcaption");
      caption.className = "gallery-caption";
      caption.textContent = photo.caption;
      figure.appendChild(caption);
    }

    galleryGrid.appendChild(figure);
  });
}

loadGallery();
