import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { geoConicConformal, geoPath } from "d3-geo";
const root = new URL("../../", import.meta.url);
const out = new URL("../public/media/", import.meta.url);
await mkdir(out, { recursive: true });
const images = [
  ["assets/brand/book-rowan-v1.png", "brand.webp", 200],
  [
    "assets/illustrations/russia-story-map-v2.png",
    "russia-story-map.webp",
    1800,
  ],
  ["assets/textures/paper-ivory-v1.png", "paper.webp", 700],
  ["assets/illustrations/egor-folk-v2.png", "egor.webp", 650],
  ["assets/illustrations/aydar-folk-v2.png", "aydar.webp", 420],
  ["assets/illustrations/amina-folk-v2.png", "amina.webp", 420],
  ["assets/illustrations/album-spread-v1.png", "album.webp", 1672],
  ["assets/illustrations/rowan-corner-v1.png", "rowan.webp", 600],
  ["assets/illustrations/egor-museum-v1.png", "museum.webp", 1200],
  [
    "assets/illustrations/museum-background-v1.png",
    "museum-background.webp",
    1000,
  ],
  ["assets/illustrations/landscape-watercolor-v1.png", "landscape.webp", 1400],
];
for (const [source, name, width] of images) {
  try {
    await sharp(await readFile(new URL(source, root)))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(new URL(name, out).pathname);
  } catch (error) {
    if (name === "landscape.webp" && error.code === "ENOENT") continue;
    throw error;
  }
}
// Genuine sourced geometry; the antimeridian-aware projection keeps eastern Russia contiguous.
const geo = JSON.parse(
  await readFile(
    new URL("assets/map/derived/russia-natural-earth-50m.geojson", root),
    "utf8",
  ),
);
const projection = geoConicConformal()
  .parallels([50, 70])
  .rotate([-100, 0])
  .center([0, 60])
  .fitExtent(
    [
      [16, 16],
      [1384, 664],
    ],
    geo,
  );
await writeFile(
  new URL("../src/content/map-path.json", import.meta.url),
  JSON.stringify({
    path: geoPath(projection)(geo),
    width: 1400,
    height: 680,
    source: "Natural Earth 1:50m v5.1.1 · public domain",
  }),
);
console.log("WebP assets and sourced geographic path prepared.");
