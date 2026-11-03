import test from "node:test";
import assert from "node:assert/strict";
import { journeyStops } from "../src/content/journey-stops";
import { groupStops, clampPan } from "../src/features/map-layout";

test("all 20 discoveries survive clustering at every supported screen width and zoom", () => {
  for (const width of [288, 358, 650, 1100]) {
    for (const zoom of [1, 1.5, 2.5, 3.5]) {
      const groups = groupStops(journeyStops, width, zoom);
      const ids = groups.flatMap((group) => group.stops.map((stop) => stop.id));
      assert.equal(ids.length, 20);
      assert.equal(new Set(ids).size, 20);
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          assert.ok(
            ((Math.hypot(groups[i].x - groups[j].x, groups[i].y - groups[j].y) *
              width) /
              1400) *
              zoom >=
              53,
          );
        }
      }
    }
  }
});
test("desktop overview exposes every stop while a phone groups close touch targets", () => {
  assert.equal(groupStops(journeyStops, 1100, 1).length, 20);
  assert.ok(groupStops(journeyStops, 288, 1).length < 20);
  assert.equal(groupStops(journeyStops, 288, 3.5).length, 20);
  assert.equal(journeyStops.filter((stop) => stop.lessonId).length, 1);
});
test("panning cannot lose the map and reset returns the same overview", () => {
  assert.deepEqual(clampPan({ x: 900, y: -900 }, 350, 1), { x: 0, y: -0 });
  const edge = clampPan({ x: 99999, y: -99999 }, 350, 2);
  assert.equal(edge.x, 175);
  assert.ok(Math.abs(edge.y) <= 85);
});
