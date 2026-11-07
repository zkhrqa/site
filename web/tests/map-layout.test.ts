import test from "node:test";
import assert from "node:assert/strict";
import { journeyStops } from "../src/content/journey-stops";
import { groupStops, clampPan, zoomAround } from "../src/features/map-layout";

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
  assert.equal(journeyStops.filter((stop) => stop.lessonId).length, 3);
});
test("panning cannot lose the map and reset returns the same overview", () => {
  assert.deepEqual(clampPan({ x: 900, y: -900 }, 350, 1), { x: 0, y: -0 });
  const edge = clampPan({ x: 99999, y: -99999 }, 350, 2);
  assert.equal(edge.x, 175);
  assert.ok(Math.abs(edge.y) <= 85);
});

test("pinch preserves the point under the fingers and reverses without a jump", () => {
  const start = { zoom: 2, pan: { x: 25, y: -8 } };
  const anchor = { x: 45, y: 12 };
  const midpoint = { x: 62, y: 20 };
  const closer = zoomAround(start, 2.7, anchor, midpoint, 390);
  assert.ok(
    Math.abs(
      (anchor.x - start.pan.x) / start.zoom -
        (midpoint.x - closer.pan.x) / closer.zoom,
    ) < 1e-9,
  );
  assert.ok(
    Math.abs(
      (anchor.y - start.pan.y) / start.zoom -
        (midpoint.y - closer.pan.y) / closer.zoom,
    ) < 1e-9,
  );
  const back = zoomAround(closer, 2, midpoint, anchor, 390);
  assert.ok(Math.abs(back.pan.x - start.pan.x) < 1e-9);
  assert.ok(Math.abs(back.pan.y - start.pan.y) < 1e-9);
});

test("pinch shrinks continuously to overview and remains bounded at both limits", () => {
  const start = { zoom: 2.5, pan: { x: 90, y: 25 } };
  const anchor = { x: 20, y: 10 };
  const smaller = zoomAround(start, 1.237, anchor, anchor, 320);
  assert.equal(smaller.zoom, 1.237);
  const overview = zoomAround(start, 0.1, anchor, anchor, 320);
  assert.equal(overview.zoom, 1);
  assert.equal(Math.abs(overview.pan.x), 0);
  assert.equal(Math.abs(overview.pan.y), 0);
  assert.equal(zoomAround(start, 8, anchor, anchor, 320).zoom, 3.5);
});
