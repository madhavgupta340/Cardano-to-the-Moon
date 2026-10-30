// Shared components. Invoice and email text is untrusted, so it only ever reaches the page as text.

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  setProps(el, props);
  el.append(...kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false));
  return el;
}

function setProps(el, props) {
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key === "class") el.setAttribute("class", value);
    else if (key === "value" || key === "checked" || key === "selected" || key === "disabled") el[key] = value;
    else el.setAttribute(key, value === true ? "" : value);
  }
}

const SVG = "http://www.w3.org/2000/svg";
export function s(tag, props = {}, ...kids) {
  const el = document.createElementNS(SVG, tag);
  setProps(el, props);
  el.append(...kids.flat(Infinity).filter(Boolean));
  return el;
}

const ICONS = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  users: "M16 20v-2a4 4 0 0 0-8 0v2M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 20v-1a3 3 0 0 0-3-3M4 20v-1a3 3 0 0 1 3-3",
  box: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  spark: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z",
  chart: "M4 20V10M10 20V4M16 20v-7M21 20H3",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .4-1.4-1.4L17 5l-3-1-1 2h-2L10 4 7 5l.4 2L6 8.4 4 8l-1 3 2 1v0l-2 1 1 3 2-.4L7.4 17 7 19l3 1 1-2h2l1 2 3-1-.4-2 1.4-1.4 2 .4 1-3z",
  bell: "M6 10a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 21h4",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.5-4.5",
  upload: "M12 16V5M7 9l5-4 5 4M5 19h14",
  menu: "M4 7h16M4 12h16M4 17h16",
  check: "M5 12l5 5 9-10",
  x: "M6 6l12 12M18 6L6 18",
  alert: "M12 4l9 16H3zM12 10v4M12 17v.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  pause: "M9 5v14M15 5v14",
  moon: "M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  coins: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9h4.5a2 2 0 0 1 0 4H9h5a2 2 0 0 1 0 4H9M11 7v2M11 17v2",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.500-1-8-4-8-9V6z",
  send: "M4 12l16-8-6 16-3-6z",
  link: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
};

export const icon = (name, size = 16) =>
  s("svg", { viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", class: "icon" },
    s("path", { d: ICONS[name] }));

export const money = (n) => (n === null || n === undefined ? "—"
  : `${n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
export const tusdm = (n) => (n === null || n === undefined ? "—" : `${money(n)} tUSDM`);
export const compact = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString("en", { maximumFractionDigits: 1 })}k` : String(n));
export const date = (d) => (d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const when = (d) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const TONES = {
  Verified: ["good", "check"], Blocked: ["bad", "x"], "Requires approval": ["warn", "clock"], Pending: ["info", "clock"],
  "Paid (demo)": ["neutral", "check"], Paid: ["good", "check"], Ready: ["good", "check"], Held: ["bad", "pause"],
  "Awaiting approval": ["warn", "clock"], Rejected: ["bad", "x"], "On hold": ["warn", "pause"], "Not started": ["info", "clock"],
  "Queued, not sent": ["info", "clock"], "Waiting on supplier": ["warn", "clock"], "Approved, not paid": ["good", "check"],
  Failed: ["bad", "x"], Unclear: ["bad", "alert"], High: ["bad", "alert"], Medium: ["warn", "alert"], Low: ["good", "check"],
  "Under review": ["warn", "clock"], "Not connected": ["neutral", "x"], "Demo data": ["info", "doc"],
};

export function badge(label) {
  const [tone, ic] = TONES[label] ?? ["neutral", null];
  return h("span", { class: `badge ${tone}` }, ic ? icon(ic, 12) : null, label);
}

export const card = (props, ...kids) => h("section", { ...props, class: `card ${props.class ?? ""}` }, kids);

export const cardHead = (title, sub, action) =>
  h("div", { class: "card-head" }, h("div", {}, h("h3", {}, title), sub ? h("p", { class: "muted small" }, sub) : null), action ?? null);

export const pageHead = (title, sub, action) =>
  h("div", { class: "page-head" }, h("div", {}, h("h1", {}, title), sub ? h("p", { class: "muted" }, sub) : null), action ?? null);

export const button = (label, onclick, cls = "", ic = null, extra = {}) =>
  h("button", { type: "button", class: `btn ${cls}`, onclick, ...extra }, ic ? icon(ic, 15) : null, label);

export const link = (href, ...kids) => h("a", { href }, kids);

export const empty = (title, detail) =>
  h("div", { class: "empty" }, icon("doc", 22), h("strong", {}, title), detail ? h("p", { class: "muted small" }, detail) : null);

export const notice = (text, tone = "warn") => h("p", { class: `notice ${tone}` }, text);

export const kv = (rows) => h("dl", { class: "kv" }, rows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v ?? "—")]));

// Sortable table. Columns: { key, label, sort?: value fn, render: row => node, align? }.
export function table({ columns, rows, onRow, emptyText = "Nothing to show", initialSort = null, label }) {
  let sort = initialSort;
  const wrap = h("div", { class: "table-wrap" });
  const draw = () => {
    const col = columns.find((c) => c.key === sort?.key);
    const sorted = col?.sort
      ? [...rows].sort((a, b) => {
          const [x, y] = [col.sort(a), col.sort(b)];
          const order = x < y ? -1 : x > y ? 1 : 0;
          return sort.dir === "asc" ? order : -order;
        })
      : rows;
    if (sorted.length === 0) {
      wrap.replaceChildren(empty(emptyText));
      return;
    }
    const head = h("tr", {}, columns.map((c) => {
      const active = sort?.key === c.key;
      const th = h("th", { class: c.align === "right" ? "right" : "", scope: "col", "aria-sort": active ? (sort.dir === "asc" ? "ascending" : "descending") : null },
        c.sort
          ? h("button", {
              type: "button", class: "th-btn",
              onclick: () => {
                sort = { key: c.key, dir: active && sort.dir === "asc" ? "desc" : "asc" };
                draw();
              },
            }, c.label, active ? icon(sort.dir === "asc" ? "arrowUp" : "arrowDown", 11) : null)
          : c.label);
      return th;
    }));
    const body = sorted.map((row) =>
      h("tr", { class: onRow ? "clickable" : "", onclick: onRow ? (e) => { if (!e.target.closest("a,button")) onRow(row); } : null },
        columns.map((c) => h("td", { class: c.align === "right" ? "right num" : "", "data-label": c.label }, c.render(row)))));
    wrap.replaceChildren(h("table", { "aria-label": label ?? null }, h("thead", {}, head), h("tbody", {}, body)));
  };
  draw();
  return wrap;
}

let toastTimer;
export function toast(text, tone = "info") {
  const el = document.getElementById("toast");
  el.textContent = text;
  el.className = `toast show ${tone}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = "toast"; }, 3600);
}

export function modal(title, body, actions) {
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    previous?.focus();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  const previous = document.activeElement;
  const box = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": title },
    h("div", { class: "modal-head" }, h("h3", {}, title), h("button", { type: "button", class: "icon-btn", "aria-label": "Close", onclick: close }, icon("x"))),
    h("div", { class: "modal-body" }, body),
    actions ? h("div", { class: "modal-foot" }, actions(close)) : null);
  const overlay = h("div", { class: "overlay", onclick: (e) => { if (e.target === overlay) close(); } }, box);
  document.body.append(overlay);
  document.addEventListener("keydown", onKey);
  box.querySelector("button, textarea, input")?.focus();
  return close;
}
