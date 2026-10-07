import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  entryPath,
  hostDestination,
  isMarketingSurface,
} from "./site-routing.ts";

const origins = {
  marketing: new URL("https://www.orangeshift.net"),
  app: new URL("https://app.orangeshift.net"),
};
describe("public website and application routing", () => {
  it("serves the public homepage without moving returning visitors off it", () => {
    const url = new URL("https://www.orangeshift.net/?campaign=launch");
    assert.equal(hostDestination(url, origins), null);
    assert.equal(isMarketingSurface(url, origins), true);
    assert.equal(
      isMarketingSurface(new URL("https://app.orangeshift.net/"), origins),
      false,
    );
  });
  it("canonicalizes the apex and legacy landing address", () => {
    assert.equal(
      hostDestination(
        new URL("https://orangeshift.net/?campaign=launch"),
        origins,
      )?.href,
      "https://www.orangeshift.net/?campaign=launch",
    );
    assert.equal(
      hostDestination(new URL("https://www.orangeshift.net/landing"), origins)
        ?.href,
      "https://www.orangeshift.net/",
    );
    assert.equal(
      hostDestination(new URL("https://app.orangeshift.net/landing"), origins)
        ?.href,
      "https://www.orangeshift.net/",
    );
  });
  it("moves auth, deep links, entry and API traffic to app without losing query strings", () => {
    for (const path of [
      "/login?from=%2Fcampaigns",
      "/signup",
      "/auth/callback?code=example&next=%2Fworkspaces",
      "/api/competitors?limit=3",
      "/campaigns/42",
      "/start",
    ]) {
      assert.equal(
        hostDestination(new URL(`https://www.orangeshift.net${path}`), origins)
          ?.href,
        `https://app.orangeshift.net${path}`,
      );
      assert.equal(
        hostDestination(new URL(`https://app.orangeshift.net${path}`), origins),
        null,
      );
    }
  });
  it("never lets a query string choose the redirect host", () => {
    assert.equal(
      hostDestination(
        new URL(
          "https://www.orangeshift.net/login?next=https://attacker.example",
        ),
        origins,
      )?.origin,
      origins.app.origin,
    );
  });
  it("keeps localhost and deployment previews on their own origin", () => {
    for (const host of [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://preview-example.vercel.app",
    ]) {
      assert.equal(isMarketingSurface(new URL(`${host}/`), origins), true);
      assert.equal(hostDestination(new URL(`${host}/login`), origins), null);
    }
  });
  it("keeps public crawler metadata on the marketing host", () => {
    for (const path of ["/robots.txt", "/sitemap.xml"]) {
      assert.equal(
        hostDestination(new URL(`${origins.marketing.origin}${path}`), origins),
        null,
      );
      assert.equal(
        isMarketingSurface(
          new URL(`${origins.marketing.origin}${path}`),
          origins,
        ),
        true,
      );
    }
  });
});
describe("browser entry choice", () => {
  it("offers signup for a new browser and login for a previously signed-in browser", () => {
    assert.equal(entryPath(false, false), "/signup");
    assert.equal(entryPath(false, true), "/login");
  });
  it("uses a verified live session ahead of any browser-history marker", () => {
    assert.equal(entryPath(true, false), "/workspaces");
    assert.equal(entryPath(true, true), "/workspaces");
  });
});
