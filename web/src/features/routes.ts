import { lessonByNumber } from "../content/lessons";
export type Route =
  | "home"
  | "lesson"
  | "interactive"
  | "activity"
  | "not-found";
export function parseLessonLocation(hash: string): {
  route: Route;
  number: number;
} {
  const path = hash.split("?")[0];
  if (!path.startsWith("#/lesson/")) return { route: "home", number: 1 };
  const match = /^#\/lesson\/(\d+)(?:\/(interactive|activity))?$/.exec(path);
  const number = match ? Number(match[1]) : 0;
  if (!lessonByNumber(number)) return { route: "not-found", number: 1 };
  return {
    route: (match?.[2] as "interactive" | "activity" | undefined) ?? "lesson",
    number,
  };
}
