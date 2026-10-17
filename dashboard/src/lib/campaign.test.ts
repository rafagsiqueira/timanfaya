import assert from "node:assert/strict";
import { test } from "node:test";
import { checkChannelBudget, daysInclusive, plannedCents, trackedUrl } from "./campaign.ts";

test("daysInclusive counts both ends", () => {
  assert.equal(daysInclusive("2026-10-20", "2026-10-20"), 1);
  assert.equal(daysInclusive("2026-10-20", "2026-10-26"), 7);
  assert.equal(daysInclusive("2026-12-30", "2027-01-02"), 4);
});

test("plannedCents = daily budget x days, 0 when incomplete", () => {
  assert.equal(plannedCents({ dailyBudgetCents: 5000, startsOn: "2026-10-20", endsOn: "2026-10-29" }), 50000);
  assert.equal(plannedCents({ dailyBudgetCents: 5000, startsOn: "2026-10-20", endsOn: null }), 0);
  assert.equal(plannedCents({ dailyBudgetCents: 5000, startsOn: "2026-10-29", endsOn: "2026-10-20" }), 0);
});

test("trackedUrl adds UTMs and keeps existing params", () => {
  const u = new URL(trackedUrl("https://x.github.io/timanfaya/?a=1", "instagram", "Stories · vista para o mar"));
  assert.equal(u.searchParams.get("a"), "1");
  assert.equal(u.searchParams.get("utm_source"), "instagram");
  assert.equal(u.searchParams.get("utm_campaign"), "stories-vista-para-o-mar");
});

test("checkChannelBudget", () => {
  assert.deepEqual(checkChannelBudget(100000, 60000, 30000), { ok: true, remaining: 40000, over: 0 });
  assert.deepEqual(checkChannelBudget(100000, 60000, 50000), { ok: false, remaining: 40000, over: 10000 });
});
