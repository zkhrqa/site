import { publishedLessons } from "../content/published-lessons";

export const STORAGE_KEY = "album-druzhby:progress";
export const LESSON_IDS = Object.keys(publishedLessons);
export type Progress = {
  format: "album-druzhby-progress";
  schemaVersion: 1;
  completedLessonIds: string[];
};
export const emptyProgress = (): Progress => ({
  format: "album-druzhby-progress",
  schemaVersion: 1,
  completedLessonIds: [],
});
export type StoragePort = Pick<Storage, "getItem" | "setItem">;

export function parseProgress(raw: string): Progress {
  if (new TextEncoder().encode(raw).length > 100_000)
    throw new Error(
      "Файл слишком большой. Выберите файл путешествия до 100 КБ.",
    );
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "Не удалось прочитать файл. Нужен JSON-файл путешествия из этого альбома.",
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Это не файл путешествия.");
  const p = value as Record<string, unknown>;
  if (
    p.format !== "album-druzhby-progress" ||
    p.schemaVersion !== 1 ||
    !Array.isArray(p.completedLessonIds)
  )
    throw new Error(
      "Формат путешествия не поддерживается. Существующие отметки сохранены.",
    );
  if (
    p.completedLessonIds.length > 100 ||
    p.completedLessonIds.some(
      (id) =>
        typeof id !== "string" ||
        !(LESSON_IDS as readonly string[]).includes(id),
    )
  )
    throw new Error(
      "В файле есть неизвестные уроки. Существующие отметки сохранены.",
    );
  return {
    ...emptyProgress(),
    completedLessonIds: [...new Set(p.completedLessonIds as string[])],
  };
}
export function readProgress(storage: StoragePort): {
  progress: Progress;
  error?: string;
  writeBlocked?: boolean;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { progress: raw === null ? emptyProgress() : parseProgress(raw) };
  } catch {
    return {
      progress: emptyProgress(),
      writeBlocked: true,
      error:
        "Не удалось прочитать сохранённые отметки. Прежние данные не изменены. Можно продолжить урок и сохранить новое путешествие в файл.",
    };
  }
}
export function writeProgress(
  storage: StoragePort,
  progress: Progress,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
export function mergeProgress(current: Progress, incoming: Progress): Progress {
  return {
    ...emptyProgress(),
    completedLessonIds: [
      ...new Set([
        ...current.completedLessonIds,
        ...incoming.completedLessonIds,
      ]),
    ],
  };
}
export function completeLesson(current: Progress, id: string): Progress {
  if (!(LESSON_IDS as readonly string[]).includes(id))
    throw new Error("Неизвестный урок");
  return mergeProgress(current, {
    ...emptyProgress(),
    completedLessonIds: [id],
  });
}
