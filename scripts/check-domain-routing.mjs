import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";

function request(path, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const transport = url.protocol === "https:" ? https : http;
    const outgoing = transport.get(url, { headers }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () =>
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body,
        }),
      );
    });
    outgoing.setTimeout(30_000, () =>
      outgoing.destroy(new Error(`Timeout: ${path}`)),
    );
    outgoing.on("error", reject);
  });
}

const base = process.env.ROUTING_TEST_BASE || "http://127.0.0.1:3100";
const cases = [
  ["www.orangeshift.net", "/", 200, null],
  ["orangeshift.net", "/", 307, "https://www.orangeshift.net/"],
  ["www.orangeshift.net", "/landing", 307, "https://www.orangeshift.net/"],
  ["www.orangeshift.net", "/start", 307, "https://app.orangeshift.net/start"],
  [
    "www.orangeshift.net",
    "/login?from=%2Fcampaigns",
    307,
    "https://app.orangeshift.net/login?from=%2Fcampaigns",
  ],
  ["www.orangeshift.net", "/signup", 307, "https://app.orangeshift.net/signup"],
  [
    "www.orangeshift.net",
    "/auth/callback?code=example",
    307,
    "https://app.orangeshift.net/auth/callback?code=example",
  ],
  [
    "www.orangeshift.net",
    "/api/competitors?limit=3",
    307,
    "https://app.orangeshift.net/api/competitors?limit=3",
  ],
  ["app.orangeshift.net", "/landing", 307, "https://www.orangeshift.net/"],
  [
    "app.orangeshift.net",
    "/",
    307,
    "https://app.orangeshift.net/login?from=%2F",
  ],
  ["app.orangeshift.net", "/start", 307, "https://app.orangeshift.net/signup"],
  [
    "app.orangeshift.net",
    "/start",
    307,
    "https://app.orangeshift.net/login",
    "oshift_returning_browser=1",
  ],
  [
    "app.orangeshift.net",
    "/campaigns",
    307,
    "https://app.orangeshift.net/login?from=%2Fcampaigns",
    "oshift_returning_browser=1",
  ],
  ["app.orangeshift.net", "/login", 200, null],
  ["app.orangeshift.net", "/signup", 200, null],
  ["www.orangeshift.net", "/robots.txt", 200, null],
  ["app.orangeshift.net", "/robots.txt", 200, null],
  ["www.orangeshift.net", "/sitemap.xml", 200, null],
];
for (const [host, path, status, location, cookie] of cases) {
  const response = await request(path, {
    host,
    "x-oshift-surface": "marketing",
    ...(cookie ? { cookie } : {}),
  });
  assert.equal(response.status, status, `${host}${path}: status`);
  assert.equal(
    response.headers.location ?? null,
    location,
    `${host}${path}: redirect`,
  );
  const body = response.body;
  if (host === "www.orangeshift.net" && path === "/") {
    assert.match(body, /OrangeShift/);
    assert.match(body, /Smart Village/);
    assert.match(body, /href="\/start"/);
    assert.match(body, /rel="canonical" href="https:\/\/www\.orangeshift\.net/);
    assert.doesNotMatch(body, /47f06336-88eb-4101-a65b-5ea1c04f6848/);
  }
  if (host === "app.orangeshift.net" && path !== "/landing") {
    assert.equal(response.headers["x-robots-tag"], "noindex, nofollow");
  }
  if (host === "app.orangeshift.net" && path === "/robots.txt")
    assert.match(body, /Disallow: \/\s/);
  if (host === "www.orangeshift.net" && path === "/sitemap.xml")
    assert.match(body, /<loc>https:\/\/www\.orangeshift\.net<\/loc>/);
  console.log(`PASS ${host}${path}${cookie ? " (returning browser)" : ""}`);
}
console.log(
  `${cases.length} domain-routing checks passed. No credentials used.`,
);
