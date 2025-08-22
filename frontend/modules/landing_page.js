import config from "../conf/index.js";

function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ------- API -------
async function fetchCities() {
  try {
    const res = await fetch(`${config.backendEndpoint}/cities`, {
      method: "GET",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ------- DOM Builders -------
function createCityTile(id, city, description, image) {
  const col = document.createElement("div");
  col.className = "col-6 col-lg-3 mb-4";
  col.innerHTML = `
    <a href="./pages/adventures/?city=${encodeURIComponent(id)}" id="${String(
    id
  )}" class="text-decoration-none">
      <div class="tile position-relative overflow-hidden rounded">
        <img class="img-fluid w-100" src="${image}" alt="${escapeHTML(
    city
  )}" loading="lazy" />
        <div class="tile-text text-center position-absolute start-50 translate-middle text-white px-3">
          <h5 class="mb-1">${escapeHTML(city)}</h5>
          <p class="mb-0 small">${escapeHTML(description || "")}</p>
        </div>
      </div>
    </a>
  `;
  return col;
}

function renderCities(list) {
  const container = document.getElementById("data");
  if (!container) return;
  container.textContent = "";

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "col-12 text-center text-muted py-5";
    empty.textContent = "No cities match your search.";
    container.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach(({ id, city, description, image }) =>
    frag.appendChild(createCityTile(id, city, description, image))
  );
  container.appendChild(frag);
}

// Backward-compatible export (if other modules call it)
function addCityToDOM(id, city, description, image) {
  const container = document.getElementById("data");
  if (!container) return;
  container.appendChild(createCityTile(id, city, description, image));
}

// ------- Search wiring -------
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
}

function filterCities(cities, q) {
  if (!q) return cities;
  const needle = normalize(q);
  return cities.filter(({ id, city, description }) => {
    return (
      normalize(id).includes(needle) ||
      normalize(city).includes(needle) ||
      normalize(description).includes(needle)
    );
  });
}

function setURLQuery(name, value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  // Avoid full reload, keep history tidy
  window.history.replaceState({}, "", url);
}

function attachSearch(allCities) {
  const input = document.getElementById("city-search");
  if (!input) return;

  // If URL has ?search=..., preload it
  const url = new URL(window.location.href);
  const initialQ = url.searchParams.get("search") || "";
  if (initialQ) input.value = initialQ;

  const apply = (q) => {
    setURLQuery("search", q.trim());
    renderCities(filterCities(allCities, q.trim()));
  };

  // Debounced input
  const onInput = debounce(() => apply(input.value), 250);
  input.addEventListener("input", onInput);

  // Enter key (prevents accidental form submits on some setups)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      apply(input.value);
    }
  });

  // Initial paint with any preloaded query
  apply(initialQ);
}

// ------- Entry -------
async function init() {
  const cities = await fetchCities();
  // Render all (attachSearch will re-filter if ?search= exists)
  renderCities(cities);
  attachSearch(cities);
}

export { init, fetchCities, addCityToDOM };
