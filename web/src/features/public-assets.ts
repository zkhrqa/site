// Keep lesson data independent of the host: Pages uses /site/, REG.RU uses /.
export function publicAsset(
  path: string,
  base = import.meta.env?.BASE_URL ?? "/",
): string {
  return `${base.replace(/\/?$/, "/")}${path.replace(/^\/+/, "")}`;
}
