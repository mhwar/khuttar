import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3000";
const OUT = "docs/assets/shots";
const IDS = {
  booking: "cmqb8upwc007i7d1a8i2hjqpn",
  program: "cmqb8ups0003b7d1agw4mi7t0",
  agent: "cmqb8upo900027d1a217uca0s",
};

const browser = await puppeteer.launch({
  executablePath: "/tmp/chrome-headless-shell-linux64/chrome-headless-shell",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=ar-SA", "--force-color-profile=srgb", "--hide-scrollbars"],
});

async function newPage(width = 1380, height = 880) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1.4 });
  return page;
}

async function settle(page) {
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 600));
}

async function shot(page, path, url, opts = {}) {
  await page.goto(BASE + url, { waitUntil: "networkidle0", timeout: 60000 });
  await settle(page);
  await page.screenshot({ path: `${OUT}/${path}.png`, fullPage: opts.fullPage ?? false });
  console.log("✓", path);
}

async function login(page, email) {
  await page.goto(BASE + "/login", { waitUntil: "networkidle0" });
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', "Khattar123!");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("logged in:", email, "→", page.url());
}

// ── Public ──
let page = await newPage();
await shot(page, "home", "/", { fullPage: true });
await shot(page, "programs", "/programs");
await shot(page, "program-detail", "/programs/istanbul-north-turkey", { fullPage: true });
await shot(page, "destination", "/destinations/saudi-arabia", { fullPage: true });
await shot(page, "study", "/study/london-english-12w", { fullPage: true });
await shot(page, "trip", "/b/KH-CNF005", { fullPage: true });

// mobile landing
const mobile = await newPage(396, 860);
await shot(mobile, "home-mobile", "/");
await mobile.close();

// ── Admin ──
await login(page, "admin@khattar.sa");
await shot(page, "admin-overview", "/admin");
await shot(page, "admin-bookings", "/admin/bookings");
await shot(page, "admin-booking-detail", `/admin/bookings/${IDS.booking}`, { fullPage: true });
await shot(page, "admin-itinerary-builder", `/admin/programs/${IDS.program}/itinerary`, { fullPage: true });
await shot(page, "admin-agent", `/admin/agents/${IDS.agent}`, { fullPage: true });
await shot(page, "admin-destinations", "/admin/destinations");

// ── Agent ──
const agentPage = await newPage();
await login(agentPage, "agent@khattar.sa");
await shot(agentPage, "agent-overview", "/agent", { fullPage: true });
await shot(agentPage, "agent-statement", "/agent/statement");

await browser.close();
console.log("DONE");
