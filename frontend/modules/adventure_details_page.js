import config from "../conf/index.js";

/** Extract ?adventure=<id> from URLSearchParams */
function getAdventureIdFromURL(search) {
  const params = new URLSearchParams(search || "");
  return params.get("adventure");
}

/**
 *
 * Fetch details for a given adventure id (null on error)
 
 */
async function fetchAdventureDetails(adventureId) {
  if (!adventureId) return null;

  // 1. Fetch the details of the adventure by making an API call
  const url = `${
    config.backendEndpoint
  }/adventures/detail/?adventure=${encodeURIComponent(adventureId)}`;

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      return null;
    }
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

//Implementation of DOM manipulation to add adventure details to DOM
function addAdventureDetailsToDOM(adventure) {
  if (!adventure) return null;
  const { name, subtitle, images, content } = adventure;

  // Safer text assignment (prevents accidental HTML injection)
  let nameElement = document.getElementById("adventure-name");
  let subtitleElement = document.getElementById("adventure-subtitle");

  if (nameElement) nameElement.textContent = name ?? "";
  if (subtitleElement) subtitleElement.textContent = subtitle ?? "";

  let photoGallery = document.getElementById("photo-gallery");
  images.forEach((image, i) => {
    const divElement = document.createElement("div");
    divElement.className = "col-lg-12 mb-3";
    divElement.innerHTML = `<img loading="lazy" alt="${
      name || "Adventure"
    } - image ${i + 1}" src="${image}" class="activity-card-image w-100"/>`;
    photoGallery.appendChild(divElement);
  });

  const contentElement = document.getElementById("adventure-content");
  contentElement.innerHTML = content;
}

/**
 * Bootstrap carousel for images (dynamic indicators + items)
 */
function addBootstrapPhotoGallery(images = []) {
  const photoGallery = document.getElementById("photo-gallery");
  if (!photoGallery) return;

  photoGallery.innerHTML = ""; // clear old
  if (!Array.isArray(images) || images.length === 0) return;

  const carouselId = "adventureCarousel";

  const indicators = images
    .map(
      (_, i) =>
        `<button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${i}" ${
          i === 0 ? 'class="active" aria-current="true"' : ""
        } aria-label="Slide ${i + 1}"></button>`
    )
    .join("");

  const slides = images
    .map(
      (img, i) => `
        <div class="carousel-item ${i === 0 ? "active" : ""}">
          <img src="${img}" alt="Adventure image ${i + 1}"
               class="activity-card-image w-100 pb-3 pb-md-0" loading="lazy"/>
        </div>`
    )
    .join("");

  photoGallery.innerHTML = `
    <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-indicators">${indicators}</div>
      <div class="carousel-inner">${slides}</div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>`;
}

/**
 * Show/hide reservation panel based on availability
 */
function conditionalRenderingOfReservationPanel(adventure) {
  const soldOutEl = document.getElementById("reservation-panel-sold-out");
  const availEl = document.getElementById("reservation-panel-available");
  const perHeadEl = document.getElementById("reservation-person-cost");

  if (!adventure || !soldOutEl || !availEl) return;

  const remaining = getRemaining(adventure);

  // Backward-compat: if backend still sends available/reserved, prefer capacity truth
  const isAvailable = remaining > 0;

  if (isAvailable) {
    availEl.style.display = "block";
    soldOutEl.style.display = "none";
    if (perHeadEl) perHeadEl.textContent = String(adventure.costPerHead ?? 0);

    // UI: show seats left
    const personInput = document.querySelector('input[name="person"]');
    const seatsInfo = ensureSiblingAfter(
      personInput?.closest(".d-flex") || personInput,
      "seats-left",
      "text-muted mt-1"
    );
    if (seatsInfo) {
      seatsInfo.textContent = `${remaining} seat(s) left`;
      seatsInfo.style.fontSize = "0.9rem";
    }

    // Clamp input max to remaining; ensure min is 1
    if (personInput) {
      personInput.min = "1";
      personInput.max = String(remaining);
      // If current value exceeds remaining, bring it down
      const num = Number(personInput.value || 0);
      if (num > remaining) personInput.value = String(remaining);
      if (num < 1) personInput.value = "1";
    }

    // Enable reserve button
    const reserveBtn = document.querySelector(".reserve-button");
    if (reserveBtn) reserveBtn.disabled = false;
  } else {
    soldOutEl.style.display = "block";
    availEl.style.display = "none";
  }
}

/**
 * Calculate total cost based on number of persons
 */
function calculateReservationCostAndUpdateDOM(adventure, persons) {
  const totalEl = document.getElementById("reservation-cost");
  if (!totalEl || !adventure) return;

  const remaining = getRemaining(adventure);
  const countRaw = Math.max(0, Number(persons) || 0);
  const count = Math.min(countRaw, remaining); // clamp to remaining
  const perHead = Number(adventure.costPerHead) || 0;

  totalEl.textContent = String(perHead * count);
}

//Implementation of reservation form submission
function captureFormSubmit(adventure) {
  const form = document.getElementById("myForm");
  if (!form || !adventure?.id) return;

  const dateInput = form.querySelector('input[name="date"]');

  // inline error containers (date + seats)
  let dateError = form.querySelector("#date-error");
  if (!dateError) {
    dateError = document.createElement("div");
    dateError.id = "date-error";
    dateError.className = "invalid-feedback";
    dateInput?.parentNode?.insertBefore(dateError, dateInput.nextSibling);
  }

  const personInput = form.querySelector('input[name="person"]');
  const seatsError = ensureSiblingAfter(
    personInput,
    "seats-error",
    "invalid-feedback"
  );

  // Set date min (local)
  if (dateInput) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    dateInput.min = local.toISOString().split("T")[0];
  }

  function isPastDate(yyyyMmDd) {
    if (!yyyyMmDd) return true;
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const selected = new Date(y, m - 1, d, 0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }

  function showFieldError(input, el, msg) {
    if (!input || !el) return;
    input.classList.add("is-invalid");
    el.textContent = msg;
  }
  function clearFieldError(input, el) {
    if (!input || !el) return;
    input.classList.remove("is-invalid");
    el.textContent = "";
  }

  // live validations
  dateInput?.addEventListener("input", () => {
    if (isPastDate(dateInput.value)) {
      showFieldError(dateInput, dateError, "You can’t select a past date.");
    } else {
      clearFieldError(dateInput, dateError);
    }
  });

  personInput?.addEventListener("input", () => {
    const remaining = getRemaining(adventure);
    let val = Math.max(0, Number(personInput.value) || 0);
    if (val > remaining) {
      showFieldError(
        personInput,
        seatsError,
        `Only ${remaining} seat(s) left.`
      );
    } else if (val < 1) {
      showFieldError(personInput, seatsError, "Minimum 1 person.");
    } else {
      clearFieldError(personInput, seatsError);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = `${config.backendEndpoint}/reservations/new`;
    const name = form.elements?.["name"]?.value?.trim();
    const date = form.elements?.["date"]?.value; // YYYY-MM-DD
    let person = Number(form.elements?.["person"]?.value);

    // Base validations
    if (!name || !date || !Number.isFinite(person) || person <= 0) {
      alert("Please fill all fields correctly.");
      return;
    }
    if (isPastDate(date)) {
      showFieldError(dateInput, dateError, "You can’t select a past date.");
      dateInput?.focus();
      return;
    }

    // Capacity validation (client-side)
    const remaining = getRemaining(adventure);
    if (remaining <= 0) {
      showFieldError(personInput, seatsError, "Sold out.");
      return;
    }
    if (person > remaining) {
      person = remaining; // clamp
      form.elements["person"].value = String(remaining);
      showFieldError(
        personInput,
        seatsError,
        `Only ${remaining} seat(s) left.`
      );
      // also update total immediately
      calculateReservationCostAndUpdateDOM(adventure, remaining);
      return; // let user confirm and submit again if they want
    } else {
      clearFieldError(personInput, seatsError);
    }

    const payload = { name, date, person, adventure: adventure.id };

    try {
      const resp = await fetch(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
          Accept: "application/json",
        },
      });

      if (resp.ok) {
        alert("Success! Reservation confirmed.");
        window.location.reload();
        return;
      }

      // Show server-side seat messages: { message: "Only 2 seat(s) left.", remaining: 2 }
      let msg = "Failed! Please try again.";
      try {
        const data = await resp.json();
        if (data?.remaining != null && personInput && seatsError) {
          showFieldError(
            personInput,
            seatsError,
            data.message || `Only ${data.remaining} seat(s) left.`
          );
        }
        if (data?.message) msg = `Failed! ${data.message}`;
      } catch {}
      alert(msg);
    } catch {
      alert("Failed! Network or server error.");
    }
  });
}

/** Show reserved success banner if already reserved */
function showBannerIfAlreadyReserved(adventure) {
  const banner = document.getElementById("reserved-banner");
  if (!banner) return;
  banner.hidden = !Boolean(adventure?.reserved);
}

function getRemaining(adventure) {
  const cap = Number(adventure?.capacity ?? 0) || 0;
  const booked = Number(adventure?.booked ?? 0) || 0;
  return Math.max(0, cap - booked);
}

// create or return an element right after target
function ensureSiblingAfter(targetEl, id, className = "") {
  let el = document.getElementById(id);
  if (!el && targetEl?.parentNode) {
    el = document.createElement("div");
    el.id = id;
    if (className) el.className = className;
    targetEl.parentNode.insertBefore(el, targetEl.nextSibling);
  }
  return el;
}

export {
  getAdventureIdFromURL,
  fetchAdventureDetails,
  addAdventureDetailsToDOM,
  addBootstrapPhotoGallery,
  conditionalRenderingOfReservationPanel,
  captureFormSubmit,
  calculateReservationCostAndUpdateDOM,
  showBannerIfAlreadyReserved,
};
