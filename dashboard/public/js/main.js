// App shell and routes.
import { COMPANY, SUPPLIERS } from "./data.js";
import { assistantPanel } from "./assistant.js";
import { addDocuments, invoices, loadRuns, notifications, runtime, state, subscribe } from "./store.js";
import { runPage } from "./pages-run.js";
import { approvalsPage, documentsPage, invoiceDetail, invoicesPage, overview, paymentsPage } from "./pages-payables.js";
import {
  accountsPage, activityPage, analyticsPage, auditPage, cashflowPage, companyPage, configPage, decisionsPage, grsPage, insightsPage,
  integrationsPage, matchingPage, notificationsPage, permissionsPage, posPage, riskPage, rulesPage, supplierDetail, suppliersPage, teamPage,
  transactionsPage, txDetail, walletPage,
} from "./pages-operations.js";
import { button, empty, h, icon, notice, pageHead, s, toast } from "./ui.js";

const NAV = [
  ["Overview", "home", [["Main dashboard", "#/"], ["Run overview", "#/run"], ["Financial activity", "#/activity"], ["AI insights", "#/insights"]]],
  ["Accounts Payable", "doc", [["All invoices", "#/invoices"], ["Pending verification", "#/invoices?view=pending"], ["Ready for payment", "#/invoices?view=ready"], ["Awaiting approval", "#/approvals"], ["Blocked invoices", "#/invoices?view=blocked"], ["Payment history", "#/payments"], ["Documents", "#/documents"]]],
  ["Suppliers", "users", [["Supplier directory", "#/suppliers"], ["Supplier profiles", `#/supplier/${SUPPLIERS[0].id}`], ["Approved suppliers", "#/suppliers/approved"], ["Supplier risk indicators", "#/suppliers/risk"]]],
  ["Procurement", "box", [["Purchase orders", "#/pos"], ["Goods received", "#/grs"], ["Three-way matching", "#/matching"]]],
  ["AI Agent", "spark", [["Agent activity", "#/agent/activity"], ["Decisions and explanations", "#/agent/decisions"], ["Automation rules", "#/agent/rules"], ["Permissions and spending limits", "#/agent/permissions"], ["Agent configuration", "#/agent/config"], ["Audit trail", "#/agent/audit"]]],
  ["Finance", "chart", [["Transactions", "#/transactions"], ["Cash flow", "#/cashflow"], ["Spending analytics", "#/analytics"], ["Payment accounts", "#/accounts"]]],
  ["Settings", "gear", [["Company profile", "#/settings/company"], ["Team and permissions", "#/settings/team"], ["Integrations", "#/settings/integrations"], ["Cardano wallet configuration", "#/settings/wallet"], ["Notifications", "#/settings/notifications"]]],
];

const ROUTES = {
  "/": overview,
  "/run": runPage,
  "/activity": activityPage(),
  "/insights": insightsPage,
  "/invoices": invoicesPage,
  "/approvals": approvalsPage,
  "/payments": paymentsPage,
  "/documents": documentsPage,
  "/suppliers": suppliersPage("Supplier directory", "Everyone the company pays."),
  "/suppliers/approved": suppliersPage("Approved suppliers", "Verified and allowed to be paid.", (s) => s.status === "Verified"),
  "/suppliers/risk": riskPage,
  "/pos": posPage,
  "/grs": grsPage,
  "/matching": matchingPage,
  "/agent/activity": activityPage("Agent activity", "Every action the agent took, with what it checked and found."),
  "/agent/decisions": decisionsPage,
  "/agent/rules": rulesPage,
  "/agent/permissions": permissionsPage,
  "/agent/config": configPage,
  "/agent/audit": auditPage,
  "/transactions": transactionsPage,
  "/cashflow": cashflowPage,
  "/analytics": analyticsPage,
  "/accounts": accountsPage,
  "/settings/company": companyPage,
  "/settings/team": teamPage,
  "/settings/integrations": integrationsPage,
  "/settings/wallet": walletPage,
  "/settings/notifications": notificationsPage,
};

function parse() {
  const raw = location.hash.slice(1) || "/";
  const [path, query] = raw.split("?");
  return { path, params: new URLSearchParams(query ?? ""), raw: location.hash || "#/" };
}

function resolve({ path, params }) {
  const detail = path.match(/^\/(invoice|supplier|tx)\/(.+)$/);
  if (detail) {
    const id = decodeURIComponent(detail[2]);
    return { invoice: invoiceDetail, supplier: supplierDetail, tx: txDetail }[detail[1]](id);
  }
  const page = ROUTES[path];
  if (!page) return h("div", { class: "page" }, pageHead("Page not found"), empty("That page doesn't exist"), h("a", { href: "#/" }, "Back to the dashboard"));
  return page(params);
}

const collapsed = new Set();
const sidebar = h("nav", { class: "sidebar", id: "sidebar", "aria-label": "Main" });
const main = h("main", { class: "main", id: "main", tabindex: "-1" });
const content = h("div", {});

function isActive(href, raw) {
  if (href === raw) return true;
  if (href === "#/invoices" && raw.startsWith("#/invoice/")) return true;
  if (href === "#/suppliers" && raw.startsWith("#/supplier/") && !NAV[2][2].some(([, target]) => target === raw)) return true;
  if (href === "#/transactions" && raw.startsWith("#/tx/")) return true;
  return false;
}

function drawSidebar(raw) {
  const pendingApprovals = invoices().filter((i) => i.needsPerson).length;
  // The list is rebuilt on every render, so keep the place the person scrolled to.
  const navScroll = sidebar.querySelector(".nav-scroll")?.scrollTop ?? 0;
  sidebar.replaceChildren(
    h("a", { class: "brand", href: "#/" }, s("svg", { class: "brand-mark", viewBox: "0 0 64 64", "aria-hidden": "true" },
      s("path", { class: "mark-a", d: "M6 10H21L33 54H23Z" }),
      s("path", { class: "mark-b", d: "M43 10H58L42 54L35.5 31Z" })), h("span", {}, "Veridano")),
    h("div", { class: "nav-scroll" }, NAV.map(([title, ic, items]) => {
      const closed = collapsed.has(title);
      return h("div", { class: "nav-group" },
        h("button", { type: "button", class: "nav-title", "aria-expanded": String(!closed), onclick: () => { closed ? collapsed.delete(title) : collapsed.add(title); drawSidebar(raw); } }, icon(ic, 15), h("span", { class: "grow" }, title), h("span", { class: `caret ${closed ? "closed" : ""}`, "aria-hidden": "true" }, "▾")),
        closed ? null : h("ul", {}, items.map(([label, href]) => h("li", {}, h("a", {
          href, class: isActive(href, raw) ? "on" : "", "aria-current": isActive(href, raw) ? "page" : null,
          onclick: () => document.body.classList.remove("nav-open"),
        }, h("span", { class: "grow" }, label), label === "Awaiting approval" && pendingApprovals ? h("span", { class: "count" }, String(pendingApprovals)) : null)))));
    })),
    h("a", { class: "profile", href: "#/settings/company" },
      h("span", { class: "avatar" }, COMPANY.user.initials),
      h("span", { class: "grow" }, h("strong", {}, COMPANY.user.name), h("span", { class: "muted tiny block" }, COMPANY.name))));
  sidebar.querySelector(".nav-scroll").scrollTop = navScroll;
}

function searchBox() {
  const results = h("div", { class: "search-results", hidden: true, role: "listbox" });
  const input = h("input", {
    type: "search", placeholder: "Search invoices and suppliers", "aria-label": "Search invoices and suppliers",
    oninput: () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { results.hidden = true; return; }
      const inv = invoices().filter((i) => `${i.number} ${i.supplierName} ${i.item}`.toLowerCase().includes(q)).slice(0, 6)
        .map((i) => ({ text: `${i.number}: ${i.supplierName}`, href: `#/invoice/${encodeURIComponent(i.id)}` }));
      const sup = SUPPLIERS.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4).map((s) => ({ text: s.name, href: `#/supplier/${s.id}` }));
      const all = [...inv, ...sup];
      results.replaceChildren(...(all.length
        ? all.map((r) => h("a", { href: r.href, role: "option", onclick: () => { results.hidden = true; input.value = ""; } }, r.text))
        : [h("p", { class: "muted small pad" }, "No matches")]));
      results.hidden = false;
    },
    onkeydown: (e) => { if (e.key === "Escape") { input.value = ""; results.hidden = true; } },
    onblur: () => setTimeout(() => { results.hidden = true; }, 150),
  });
  return h("label", { class: "top-search" }, icon("search", 15), input, results);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("veridano-theme", theme); } catch { /* storage can be blocked */ }
}

function popover(trigger, build) {
  const menu = h("div", { class: "popover", hidden: true });
  const open = () => {
    menu.replaceChildren(build(() => { menu.hidden = true; }));
    menu.hidden = false;
    setTimeout(() => document.addEventListener("click", away));
  };
  const away = (e) => {
    if (!menu.contains(e.target) || e.target.closest("a,button")) {
      menu.hidden = true;
      document.removeEventListener("click", away);
    }
  };
  trigger.addEventListener("click", () => (menu.hidden ? open() : (menu.hidden = true)));
  return h("div", { class: "popover-wrap" }, trigger, menu);
}

function topbar() {
  const bellCount = h("span", { class: "bell-count" });
  const bell = h("button", { type: "button", class: "icon-btn", "aria-label": "Notifications" }, icon("bell", 17), bellCount);
  const updateBell = () => {
    const unread = notifications().filter((n) => !state.read.includes(n.id)).length;
    bellCount.textContent = unread || "";
    bellCount.hidden = !unread;
  };
  subscribe(updateBell);
  updateBell();
  const notes = popover(bell, () => {
    const items = notifications();
    state.read = items.map((n) => n.id);
    updateBell();
    return h("div", {},
      h("div", { class: "popover-head" }, h("strong", {}, "Notifications"), h("a", { href: "#/settings/notifications" }, "See all")),
      items.slice(0, 7).map((n) => h("a", { class: "popover-item", href: n.href }, n.text)));
  });
  const profile = popover(h("button", { type: "button", class: "avatar-btn", "aria-label": "Profile menu" }, h("span", { class: "avatar" }, COMPANY.user.initials)), () => h("div", {},
    h("div", { class: "popover-head" }, h("div", {}, h("strong", {}, COMPANY.user.name), h("div", { class: "muted tiny" }, COMPANY.user.role))),
    h("a", { class: "popover-item", href: "#/settings/company" }, "Company profile"),
    h("a", { class: "popover-item", href: "#/settings/team" }, "Team and permissions"),
    h("button", { type: "button", class: "popover-item", onclick: () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark") }, "Switch light or dark")));

  const upload = h("input", { type: "file", multiple: true, class: "sr", "aria-label": "Upload invoice", accept: ".pdf,.eml,.png,.jpg", onchange: (e) => {
    addDocuments([...e.target.files], "Invoice");
    toast("Added to Documents. It won't be read until the inbox is connected.");
    location.hash = "#/documents";
    e.target.value = "";
  } });
  return h("header", { class: "topbar" },
    h("button", { type: "button", class: "icon-btn menu", "aria-label": "Open navigation", onclick: () => document.body.classList.toggle("nav-open") }, icon("menu", 18)),
    searchBox(),
    h("span", { class: "env-pill", title: "All data is fictional. Test network only." }, "Demo · Cardano Preprod"),
    notes,
    h("button", { type: "button", class: "icon-btn", "aria-label": "Switch light or dark", onclick: () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark") }, icon("moon", 17)),
    profile,
    h("label", { class: "btn primary upload" }, icon("upload", 15), h("span", {}, "Upload invoice"), upload));
}

let lastRaw = null;

function render() {
  const route = parse();
  drawSidebar(route.raw);
  const scroll = main.scrollTop;
  const banners = [];
  if (runtime.runError) banners.push(notice(`Couldn't load real runs (${runtime.runError}). Showing demo data only.`, "bad"));
  if (runtime.invalidRuns.length) banners.push(notice(`Skipped run files that don't match the contract: ${runtime.invalidRuns.join(", ")}`, "bad"));
  try {
    content.replaceChildren(...banners, resolve(route));
  } catch (error) {
    console.error(error);
    content.replaceChildren(h("div", { class: "page" }, pageHead("Something went wrong"), notice("This page couldn't be displayed.", "bad"), button("Back to the dashboard", () => { location.hash = "#/"; }, "ghost")));
  }
  if (route.raw !== lastRaw) {
    main.scrollTop = 0;
    if (lastRaw !== null) main.focus({ preventScroll: true });
    lastRaw = route.raw;
  } else {
    main.scrollTop = scroll;
  }
}

function boot() {
  const root = document.getElementById("app");
  main.append(topbar(), content);
  root.replaceChildren(sidebar, h("div", { class: "scrim", onclick: () => document.body.classList.remove("nav-open") }), main, ...assistantPanel());
  subscribe(render);
  window.addEventListener("hashchange", render);
  window.addEventListener("veridano:render", render);
  render();
  loadRuns();
}

boot();
