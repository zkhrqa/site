import test from "node:test";
import assert from "node:assert/strict";
import { publicAsset } from "../src/features/public-assets";
import { lessons } from "../src/content/lessons";

test("all lesson illustrations and downloads stay under the selected static host base", () => {
  for (const base of ["/", "/site/", "/preview/album/"]) {
    for (const lesson of lessons) {
      for (const path of [
        lesson.heroImage,
        ...lesson.downloads.map((file) => file.href),
      ]) {
        const url = new URL(publicAsset(path, base), "https://example.test");
        assert.equal(url.pathname, base + path.slice(1));
        assert.equal(url.origin, "https://example.test");
      }
    }
  }
});

test("base paths without a trailing slash and relative assets are supported", () => {
  assert.equal(
    publicAsset("media/album.webp", "/site"),
    "/site/media/album.webp",
  );
  assert.equal(publicAsset("/media/album.webp", "/"), "/media/album.webp");
});
