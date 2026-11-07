import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../dist/pages/", import.meta.url));
const exists = (relative) => access(path.join(root, relative));

test("Pages HTML loads its generated scripts and favicon from /site/", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(urls.some((url) => url.startsWith("/site/assets/")));
  assert.ok(urls.includes("/site/media/brand.webp"));
  for (const url of urls) {
    assert.ok(url.startsWith("/site/"), url);
    await exists(url.slice("/site/".length));
  }
});

test("every published CSS image and font URL resolves to a deployed file", async () => {
  const files = (await readdir(path.join(root, "assets"))).filter((file) =>
    file.endsWith(".css"),
  );
  let count = 0;
  for (const file of files) {
    const css = await readFile(path.join(root, "assets", file), "utf8");
    for (const match of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
      const url = match[1];
      if (url.startsWith("data:")) continue;
      assert.ok(url.startsWith("/site/"), `${file}: ${url}`);
      await exists(url.slice("/site/".length));
      count++;
    }
  }
  assert.ok(count > 5);
});

test("Pages publishes the client and prepared Word files, with no server or original source folders", async () => {
  await exists(".nojekyll");
  for (const file of [
    "lesson-01-teacher.docx",
    "lesson-01-worksheet.docx",
    "lesson-02-teacher.doc",
    "lesson-02-worksheet.docx",
    "lesson-03-teacher.docx",
    "lesson-03-worksheet.docx",
  ])
    await exists(`downloads/${file}`);
  const files = await readdir(root);
  for (const name of ["server", "src", "references", "docs", "node_modules"])
    assert.ok(!files.includes(name));
});
