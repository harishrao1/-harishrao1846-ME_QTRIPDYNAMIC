import config from "../conf/index.js";

// --- API ---
export async function fetchReservations() {
  try {
    const res = await fetch(`${config.backendEndpoint}/reservations`, {
      method: "GET",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// --- Date/Time helpers (IST) ---
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

function fmtDateYMD(str) {
  const d = new Date(str);
  return isNaN(d) ? "" : dateFmt.format(d); // dd/mm/yyyy
}

function fmtFullDateTime(str) {
  const d = new Date(str);
  return isNaN(d) ? "" : timeFmt.format(d); // "04 November 2020, 09:32:31 pm"
}

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// --- Empty state toggle ---
function toggleEmptyState(hasData) {
  const noBanner = document.getElementById("no-reservation-banner");
  const tableParent = document.getElementById("reservation-table-parent");
  if (!noBanner || !tableParent) return;
  noBanner.hidden = hasData;
  tableParent.hidden = !hasData;
}

// --- Render ---
export function addReservationToTable(reservations = []) {
  const tbody = document.getElementById("reservation-table");
  if (!tbody) return;

  // clear existing
  tbody.textContent = "";

  // normalize + sort latest first
  const list = (Array.isArray(reservations) ? reservations : [])
    .slice()
    .sort((a, b) => {
      const ta = new Date(a?.time || 0).getTime();
      const tb = new Date(b?.time || 0).getTime();
      return tb - ta;
    });

  toggleEmptyState(list.length > 0);
  if (!list.length) return;

  const frag = document.createDocumentFragment();

  list.forEach((r) => {
    const tr = document.createElement("tr");

    const tdTxn = document.createElement("th");
    tdTxn.scope = "row";
    tdTxn.textContent = r?.id ?? "";
    tr.appendChild(tdTxn);

    const tdName = document.createElement("td");
    tdName.textContent = r?.name ?? "";
    tr.appendChild(tdName);

    const tdAdv = document.createElement("td");
    tdAdv.textContent = r?.adventureName || r?.adventure || "";
    tr.appendChild(tdAdv);

    const tdPersons = document.createElement("td");
    tdPersons.textContent = String(r?.person ?? "");
    tr.appendChild(tdPersons);

    const tdDate = document.createElement("td");
    tdDate.textContent = r?.date ? fmtDateYMD(r.date) : "";
    tr.appendChild(tdDate);

    const tdPrice = document.createElement("td");
    tdPrice.textContent = inrFmt.format(Number(r?.price || 0));
    tr.appendChild(tdPrice);

    const tdTime = document.createElement("td");
    tdTime.textContent = r?.time ? fmtFullDateTime(r.time) : "";
    tr.appendChild(tdTime);

    const tdAction = document.createElement("td");
    const a = document.createElement("a");
    a.className = "reservation-visit-button btn btn-sm btn-primary";
    a.id = r?.id ?? "";
    a.href = `../detail/?adventure=${encodeURIComponent(r?.adventure || "")}`;
    a.textContent = "Visit Adventure";
    tdAction.appendChild(a);
    tr.appendChild(tdAction);

    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}
