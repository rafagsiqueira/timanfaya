import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBRL, parseBRL, splitTwoWays } from "./money.ts";

test("parseBRL handles pt-BR and plain formats", () => {
  assert.equal(parseBRL("1.500,50"), 150050);
  assert.equal(parseBRL("R$ 2.000"), 200000);
  assert.equal(parseBRL("1500"), 150000);
  assert.equal(parseBRL("1500.5"), 150050);
  assert.equal(parseBRL("1.500"), 150000);
  assert.equal(parseBRL("0,99"), 99);
  assert.equal(parseBRL(""), null);
  assert.equal(parseBRL("abc"), null);
  assert.equal(parseBRL("-5"), null);
});

test("splitTwoWays always sums to the total", () => {
  for (const total of [1, 99, 10000, 333333, 1000001]) {
    for (const pct of [0, 1, 33, 50, 66.6, 100]) {
      const [a, b] = splitTwoWays(total, pct);
      assert.equal(a + b, total);
      assert.ok(a >= 0 && b >= 0);
    }
  }
  assert.deepEqual(splitTwoWays(100000, 60), [60000, 40000]);
  assert.deepEqual(splitTwoWays(100000, 150), [100000, 0]); // clamped
});

test("formatBRL", () => {
  assert.match(formatBRL(77599), /775,99/);
});
