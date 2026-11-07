import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { lesson } from "../src/content/lesson-01";

const path = (relative: string) =>
  fileURLToPath(new URL(relative, import.meta.url));
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
function paragraphs(relative: string) {
  const xml = execFileSync(
    "unzip",
    ["-p", path(relative), "word/document.xml"],
    { encoding: "utf8" },
  );
  return [...xml.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map((paragraph) =>
    normalize(
      [...paragraph[1].matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map((text) =>
          text[1]
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&"),
        )
        .join(""),
    ),
  );
}

test("interactive wording and word set match task 4 of the actual downloadable worksheet", () => {
  const lines = paragraphs("../public/downloads/lesson-01-worksheet.docx");
  const start = lines.indexOf(`4. ${lesson.exercise.title}`);
  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith("5. "),
  );
  assert.ok(start >= 0 && end > start);
  const exercise = lines.slice(start, end);
  assert.ok(exercise.includes(lesson.exercise.instruction));
  assert.ok(exercise.includes(lesson.exercise.words.join(" ")));
  assert.ok(exercise.includes(lesson.exercise.reflection));
  assert.deepEqual(
    [...lesson.exercise.answer].sort(),
    [...lesson.exercise.words].sort(),
  );
  assert.ok(lines.includes(lesson.story));
  assert.ok(lines.includes(`б) ${lesson.question}`));
});

test("published lesson downloads preserve the original document texts", () => {
  for (const { href } of lesson.downloads) {
    const filename = href.split("/").at(-1);
    assert.deepEqual(
      paragraphs(`../public${href}`),
      paragraphs(`../../references/lessons/${filename}`),
    );
  }
});

test("all eight screens preserve the actual worksheet's instructions, choices and oral prompts", async () => {
  const { worksheetTasks } = await import("../src/content/lesson-01-worksheet");
  const lines = paragraphs("../public/downloads/lesson-01-worksheet.docx").map(
    (line) =>
      line
        .replace(/^[□_]+\s*/, "")
        .replace(/_+$/, "")
        .trim(),
  );
  for (const task of worksheetTasks) {
    assert.ok(
      lines.includes(`${task.number}. ${task.title}`),
      `title ${task.number}`,
    );
    if (task.sourceInstruction || task.instruction)
      assert.ok(
        lines.includes(task.sourceInstruction ?? task.instruction),
        `instruction ${task.number}`,
      );
    for (const prompt of task.discussion ?? [])
      assert.ok(
        lines.includes(prompt),
        `oral prompt ${task.number}: ${prompt}`,
      );
    if (task.type === "underline") {
      assert.ok(lines.includes(task.passage));
      assert.ok(lines.includes(task.prompt));
      assert.ok(
        lines.includes(task.options.map((option) => option.text).join(" ")),
      );
    } else if (
      task.type === "multiple" ||
      task.type === "creative" ||
      task.type === "self-review"
    ) {
      for (const option of task.options)
        assert.ok(
          lines.includes(option.text),
          `option ${task.number}: ${option.text}`,
        );
    } else if (task.type === "verdicts") {
      for (const item of task.items) assert.ok(lines.includes(item.text));
    } else if (task.type === "matching") {
      for (const item of [...task.items, ...task.categories])
        assert.ok(lines.includes(item.text));
    }
  }
});

// These assertions use the actual files offered by the UI, independently of the
// task data, so a copied-but-truncated exercise cannot pass by testing itself.
test("Aydar and Amina retain every worksheet instruction, passage, word set and self-rating", async () => {
  const { lessons } = await import("../src/content/lessons");
  for (const lesson of lessons.slice(1)) {
    const document = normalize(
      paragraphs(
        `../public/downloads/lesson-0${lesson.number}-worksheet.docx`,
      ).join(" "),
    );
    const has = (text: string) =>
      assert.ok(document.includes(normalize(text)), `${lesson.id}: ${text}`);
    for (const task of lesson.tasks) {
      if (task.instruction) has(task.sourceInstruction ?? task.instruction);
      if (task.closing) has(task.closing);
      switch (task.type) {
        case "reference":
          for (const entry of task.entries) {
            has(entry.title.toLocaleUpperCase("ru"));
            has(entry.question);
            has(entry.description);
          }
          has(task.note);
          break;
        case "classify":
        case "text-clues":
        case "punctuation":
        case "edit-sentences":
          for (const item of task.items) has(item.text);
          break;
        case "sentence-groups":
          for (const item of task.items) has(item.words.join(" / "));
          break;
        case "creative":
          for (const option of task.options) has(option.text);
          break;
        case "self-rating":
          for (const item of [...task.items, ...task.options]) has(item.text);
          break;
        case "discussion":
          for (const prompt of task.discussion ?? []) has(prompt);
          break;
      }
    }
    assert.equal(
      new Set(lesson.tasks.map((task) => task.id)).size,
      lesson.tasks.length,
    );
    assert.equal(lesson.tasks.filter((task) => !task.finalReview).length, 5);
  }
});

test("all three lessons expose their own source downloads and distinct routes", async () => {
  const { lessons } = await import("../src/content/lessons");
  const { parseLessonLocation } = await import("../src/features/routes");
  const { readFileSync } = await import("node:fs");
  for (const lesson of lessons) {
    for (const file of lesson.downloads) {
      const filename = file.href.split("/").at(-1);
      if (lesson.number > 1)
        assert.deepEqual(
          readFileSync(path(`../public${file.href}`)),
          readFileSync(path(`../../references/lessons/${filename}`)),
        );
    }
    assert.deepEqual(parseLessonLocation(`#/lesson/${lesson.number}`), {
      route: "lesson",
      number: lesson.number,
    });
    assert.deepEqual(
      parseLessonLocation(`#/lesson/${lesson.number}/interactive?projector`),
      { route: "interactive", number: lesson.number },
    );
  }
  assert.equal(parseLessonLocation("#/lesson/20").route, "not-found");
  assert.equal(
    parseLessonLocation("#/lesson/2/unavailable").route,
    "not-found",
  );
  assert.equal(parseLessonLocation("#/lessons").route, "home");
});
