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
    if (task.instruction)
      assert.ok(lines.includes(task.instruction), `instruction ${task.number}`);
    for (const prompt of task.discussion ?? [])
      assert.ok(
        lines.includes(prompt),
        `oral prompt ${task.number}: ${prompt}`,
      );
    if (task.type === "multiple" && task.text) {
      assert.ok(lines.includes(task.text));
      assert.ok(lines.includes(task.choicePrompt!));
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
