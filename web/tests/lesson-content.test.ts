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

test("teacher goals and published lesson texts match the source documents", () => {
  const teacher = paragraphs("../../references/lessons/lesson-01-teacher.docx");
  assert.ok(teacher.includes(lesson.preparation.goal));
  assert.ok(teacher.includes(lesson.preparation.result));
  for (const file of ["lesson-01-teacher.docx", "lesson-01-worksheet.docx"]) {
    assert.deepEqual(
      paragraphs(`../public/downloads/${file}`),
      paragraphs(`../../references/lessons/${file}`),
    );
  }
});
