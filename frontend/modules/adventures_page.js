import config from "../conf/index.js";

/** Extract ?city=<id> from URLSearchParams */
function getCityFromURL(search) {
  const params = new URLSearchParams(search || "");
  return params.get("city"); // e.g. "bengaluru"
}

/** Fetch adventures for a city (returns [] on failure) */
async function fetchAdventures(city) {
  if (!city) return [];
  const url = `${config.backendEndpoint}/adventures/?city=${encodeURIComponent(
    city
  )}`;
  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Render adventure cards into #data */
function addAdventureToDOM(adventures = []) {
  const container = document.getElementById("data");
  if (!container) return;
  container.textContent = ""; // clear previous

  const frag = document.createDocumentFragment();

  adventures.forEach((a) => {
    const col = document.createElement("div");
    col.className = "col-6 col-lg-3 mb-4";

    // Card
    const link = document.createElement("a");
    link.href = `detail/?adventure=${encodeURIComponent(a.id)}`;
    link.id = a.id;

    const card = document.createElement("div");
    card.className = "activity-card";

    const img = document.createElement("img");
    img.className = "activity-card-image";
    img.src = a.image;
    img.alt = a.name || "Adventure";
    img.loading = "lazy";

    const banner = document.createElement("div");
    banner.className = "category-banner";
    banner.innerHTML = `<h4>${a.category ?? ""}</h4>`;

    const row1 = document.createElement("div");
    row1.className = "d-flex w-100 justify-content-between";
    const nameP = document.createElement("p");
    nameP.textContent = a.name ?? "";
    const priceP = document.createElement("p");
    priceP.textContent = `₹${Number(a.costPerHead || 0)}`;
    row1.append(nameP, priceP);

    const row2 = document.createElement("div");
    row2.className = "d-flex justify-content-between";
    row2.style.width = "90%";
    const durL = document.createElement("p");
    durL.textContent = "Duration";
    const durV = document.createElement("p");
    durV.textContent = `${Number(a.duration || 0)} Hours`;
    row2.append(durL, durV);

    card.append(img, banner, row1, row2);
    link.append(card);
    col.append(link);
    frag.append(col);
  });

  container.append(frag);
}

/** Filter list by duration inclusive between low and high */
function filterByDuration(list = [], low, high) {
  const lo = Number(low);
  const hi = Number(high);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return list;
  return list.filter((item) => {
    const d = Number(item?.duration);
    return Number.isFinite(d) && d >= lo && d <= hi;
  });
}

/** Filter list by category (categoryList: string[]) */
function filterByCategory(list = [], categoryList = []) {
  if (!Array.isArray(categoryList) || categoryList.length === 0) return list;
  const set = new Set(categoryList);
  return list.filter((item) => set.has(item?.category));
}

/**
 * Combined filter:
 * - filters = { duration: "low-high" | "", category: string[] }
 * - Handles duration only, category only, or both.
 */
function filterFunction(list = [], filters = { duration: "", category: [] }) {
  let out = list;

  // Duration
  if (filters?.duration) {
    const [lowStr, highStr] = String(filters.duration).split("-");
    out = filterByDuration(out, lowStr, highStr);
  }

  // Category
  if (Array.isArray(filters?.category) && filters.category.length > 0) {
    out = filterByCategory(out, filters.category);
  }

  return out;
}

/** Save filters to localStorage */
function saveFiltersToLocalStorage(filters) {
  try {
    window.localStorage.setItem("filters", JSON.stringify(filters || {}));
    return true;
  } catch {
    return false;
  }
}

/** Read filters from localStorage (returns object or null) */
function getFiltersFromLocalStorage() {
  try {
    const raw = window.localStorage.getItem("filters");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // normalize shape
    return {
      duration: typeof obj?.duration === "string" ? obj.duration : "",
      category: Array.isArray(obj?.category) ? obj.category : [],
    };
  } catch {
    return null;
  }
}

/**
 * Update filters UI:
 * - Set duration select value if present (id="duration-select")
 * - Render category pills into #category-list
 */
function generateFilterPillsAndUpdateDOM(
  filters = { duration: "", category: [] }
) {
  // duration select
  const durationSelect = document.getElementById("duration-select");
  if (durationSelect && typeof filters.duration === "string") {
    durationSelect.value = filters.duration || "";
  }

  // category pills
  const listEl = document.getElementById("category-list");
  if (!listEl) return;
  listEl.textContent = ""; // clear old

  if (Array.isArray(filters.category)) {
    filters.category.forEach((cat) => {
      const pill = document.createElement("div");
      pill.className = "category-filter";
      pill.textContent = cat;
      listEl.append(pill);
    });
  }
}

export {
  getCityFromURL,
  fetchAdventures,
  addAdventureToDOM,
  filterByDuration,
  filterByCategory,
  filterFunction,
  saveFiltersToLocalStorage,
  getFiltersFromLocalStorage,
  generateFilterPillsAndUpdateDOM,
};
