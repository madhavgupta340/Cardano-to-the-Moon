// Small SVG charts: one hue for magnitude, status colours only for status. Every mark has a hover tooltip.
import { h, s, compact, money } from "./ui.js";

function tooltip(target, html) {
  const tip = document.getElementById("tip");
  const move = (e) => {
    tip.style.left = `${Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8)}px`;
    tip.style.top = `${e.clientY - tip.offsetHeight - 10}px`;
  };
  target.addEventListener("pointerenter", (e) => {
    tip.replaceChildren(...html());
    tip.classList.add("show");
    move(e);
  });
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerleave", () => tip.classList.remove("show"));
}

const tipLines = (title, value) => [h("strong", {}, title), h("div", {}, value)];

// Bars growing from a baseline, with a 4px rounded top.
export function columns(data, { height = 220, format = (v) => `${money(v)} tUSDM`, highlight } = {}) {
  const W = 640;
  const pad = { l: 44, r: 8, t: 12, b: 26 };
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const y = (v) => pad.t + (1 - v / top) * (height - pad.t - pad.b);
  const band = (W - pad.l - pad.r) / data.length;
  const barW = Math.min(band - 4, 34);
  const grid = [];
  for (let v = 0; v <= top; v += step) {
    grid.push(s("line", { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: "grid" }));
    grid.push(textEl(pad.l - 8, y(v) + 4, compact(v), "end"));
  }
  const bars = data.map((d, i) => {
    const x = pad.l + band * i + (band - barW) / 2;
    const yTop = y(d.value);
    const base = y(0);
    const r = Math.min(4, (base - yTop) / 2);
    const path = `M${x} ${base}V${yTop + r}Q${x} ${yTop} ${x + r} ${yTop}H${x + barW - r}Q${x + barW} ${yTop} ${x + barW} ${yTop + r}V${base}Z`;
    const hit = s("rect", { x: pad.l + band * i, y: pad.t, width: band, height: height - pad.t - pad.b, fill: "transparent" });
    const g = s("g", { class: "bar-group" },
      s("path", { d: path, class: highlight?.(d) ? "bar strong" : "bar" }),
      hit,
      data.length <= 14 ? textEl(x + barW / 2, height - 8, d.label, "middle") : null);
    tooltip(g, () => tipLines(d.title ?? d.label, format(d.value)));
    return g;
  });
  return s("svg", { viewBox: `0 0 ${W} ${height}`, class: "chart", role: "img", "aria-label": data.map((d) => `${d.label}: ${format(d.value)}`).join(", ") }, grid, bars);
}

function textEl(x, y, text, anchor) {
  const el = s("text", { x, y, "text-anchor": anchor, class: "tick" });
  el.textContent = text;
  return el;
}

function niceStep(max) {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

export function hbars(data, { format = (v) => `${money(v)} tUSDM`, href } = {}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return h("div", { class: "hbars" }, data.map((d) => {
    const row = h(href ? "a" : "div", { class: "hbar", href: href?.(d) ?? null },
      h("span", { class: "hbar-label" }, d.label),
      h("span", { class: "hbar-track" }, h("span", { class: "hbar-fill", style: `width:${(d.value / max) * 100}%` })),
      h("span", { class: "hbar-value num" }, compact(Math.round(d.value))));
    tooltip(row, () => tipLines(d.label, `${format(d.value)} · ${total ? Math.round((d.value / total) * 100) : 0}%`));
    return row;
  }));
}

// A single stacked bar for status shares. Labels keep it readable without colour.
export function statusBar(parts, { href } = {}) {
  const total = parts.reduce((sum, p) => sum + p.value, 0) || 1;
  const present = parts.filter((p) => p.value > 0);
  return h("div", {},
    h("div", { class: "stack", role: "img", "aria-label": present.map((p) => `${p.label}: ${p.value}`).join(", ") },
      present.map((p) => {
        const seg = h("a", { class: `stack-seg ${p.tone}`, style: `flex:${p.value}`, href: href?.(p) ?? null, "aria-label": `${p.label}: ${p.value}` });
        tooltip(seg, () => tipLines(p.label, `${p.value} invoices · ${Math.round((p.value / total) * 100)}%`));
        return seg;
      })),
    h("ul", { class: "legend" }, parts.map((p) =>
      h("li", {}, h("a", { href: href?.(p) ?? null },
        h("span", { class: `dot ${p.tone}` }), h("span", {}, p.label), h("strong", { class: "num" }, String(p.value)))))));
}

export function sparkline(values) {
  if (values.length < 2) return null;
  const W = 72;
  const H = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - 3 - ((v - min) / (max - min || 1)) * (H - 6)}`);
  return s("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "spark", "aria-hidden": "true" },
    s("polyline", { points: pts.join(" "), fill: "none" }));
}
