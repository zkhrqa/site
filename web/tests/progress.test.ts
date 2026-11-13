import test from "node:test";
import assert from "node:assert/strict";
import {
  completeLesson,
  emptyProgress,
  mergeProgress,
  parseProgress,
  readProgress,
  STORAGE_KEY,
  writeProgress,
} from "../src/features/progress";

test("completion survives serializing and a fresh read without duplicate marks", () => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };
  const completed = completeLesson(
    completeLesson(emptyProgress(), "lesson-01"),
    "lesson-01",
  );
  assert.equal(writeProgress(storage, completed), true);
  assert.deepEqual(readProgress(storage).progress.completedLessonIds, [
    "lesson-01",
  ]);
  assert.ok(memory.has(STORAGE_KEY));
});
test("blocked or corrupt browser storage leaves the lesson usable and exposes an error", () => {
  assert.equal(
    writeProgress(
      {
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      },
      completeLesson(emptyProgress(), "lesson-01"),
    ),
    false,
  );
  assert.ok(
    readProgress({
      getItem: () => {
        throw new Error("disabled");
      },
      setItem: () => {},
    }).error,
  );
  assert.ok(
    readProgress({ getItem: () => "{broken", setItem: () => {} }).error,
  );
});
test("untrusted files reject wrong versions, unknown IDs, oversized and malformed values", () => {
  for (const bad of [
    "null",
    "[]",
    "{}",
    "{bad",
    JSON.stringify({ ...emptyProgress(), schemaVersion: 2 }),
    JSON.stringify({ ...emptyProgress(), completedLessonIds: ["<script>"] }),
    JSON.stringify({ ...emptyProgress(), completedLessonIds: [1] }),
    " ".repeat(100001),
  ])
    assert.throws(() => parseProgress(bad));
});
test("import validates, deduplicates and merges instead of deleting existing progress", () => {
  const incoming = parseProgress(
    JSON.stringify({
      ...emptyProgress(),
      completedLessonIds: ["lesson-01", "lesson-01"],
      unexpected: "<script>",
    }),
  );
  assert.deepEqual(incoming, completeLesson(emptyProgress(), "lesson-01"));
  assert.deepEqual(mergeProgress(incoming, emptyProgress()), incoming);
  assert.throws(() => completeLesson(incoming, "lesson-99"));
});

test("three lesson marks survive import, removing one preserves the others and the old v1 file still works", async () => {
  const { removeLesson } = await import("../src/features/progress");
  const oldFile = JSON.stringify({
    ...emptyProgress(),
    completedLessonIds: ["lesson-01"],
  });
  const current = completeLesson(
    completeLesson(parseProgress(oldFile), "lesson-02"),
    "lesson-03",
  );
  const restored = parseProgress(JSON.stringify(current));
  assert.deepEqual(restored.completedLessonIds, [
    "lesson-01",
    "lesson-02",
    "lesson-03",
  ]);
  const removed = removeLesson(restored, "lesson-02");
  assert.deepEqual(removed.completedLessonIds, ["lesson-01", "lesson-03"]);
  assert.deepEqual(restored.completedLessonIds, [
    "lesson-01",
    "lesson-02",
    "lesson-03",
  ]);
  assert.deepEqual(mergeProgress(removed, parseProgress(oldFile)), removed);
  assert.throws(() =>
    parseProgress(
      JSON.stringify({ ...emptyProgress(), completedLessonIds: ["lesson-20"] }),
    ),
  );
});
