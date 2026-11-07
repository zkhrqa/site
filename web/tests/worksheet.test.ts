import test from "node:test";
import assert from "node:assert/strict";
import { worksheetTasks } from "../src/content/lesson-01-worksheet";
import {
  checkTask,
  emptyWorksheetAnswers,
  resetTask,
  toggleChoice,
} from "../src/features/worksheet";

test("eight worksheet tasks have stable unique IDs and the original order", () => {
  assert.deepEqual(
    worksheetTasks.map((task) => task.number),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(new Set(worksheetTasks.map((task) => task.id)).size, 8);
  assert.deepEqual(
    worksheetTasks.map((task) => task.source.section),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});
test("underlining accepts any source option without grading and can be undone independently", () => {
  const task = worksheetTasks[0];
  assert.ok(task.type === "underline");
  const state = emptyWorksheetAnswers();
  state.words = [2, 4];
  assert.equal(checkTask(task, state), null);
  for (const option of task.options) {
    state.selections[task.id] = toggleChoice(
      state.selections[task.id] ?? [],
      option.id,
    );
    assert.equal(checkTask(task, state), null);
  }
  assert.equal(state.selections[task.id].length, 5);
  state.selections[task.id] = toggleChoice(
    state.selections[task.id],
    "sports-ground",
  );
  assert.equal(state.selections[task.id].length, 4);
  assert.equal(checkTask(task, state), null);
  const reset = resetTask(task, state);
  assert.deepEqual(reset.selections[task.id], []);
  assert.deepEqual(reset.words, [2, 4]);
});
test("the second task accepts all six situations from the worksheet", () => {
  const state = emptyWorksheetAnswers();
  state.selections.situations = [
    "school",
    "library",
    "museum",
    "station",
    "notice",
    "conversation",
  ];
  assert.equal(checkTask(worksheetTasks[1], state)?.correct, true);
});
test("verdicts require four independent choices and accept the document's rule", () => {
  const state = emptyWorksheetAnswers();
  state.verdicts = {
    "state-language": true,
    "only-russian": false,
    understanding: true,
  };
  assert.equal(checkTask(worksheetTasks[2], state)?.complete, false);
  state.verdicts["cultural-wealth"] = true;
  assert.deepEqual(checkTask(worksheetTasks[2], state), {
    complete: true,
    correct: true,
  });
  state.verdicts["only-russian"] = true;
  assert.equal(checkTask(worksheetTasks[2], state)?.correct, false);
});
test("word assembly rejects missing, duplicated or misplaced words", () => {
  const state = emptyWorksheetAnswers();
  state.words = [2, 4, 1, 0, 3, 5];
  assert.equal(checkTask(worksheetTasks[3], state)?.correct, true);
  state.words = [2, 4, 1, 0, 3, 3];
  assert.equal(checkTask(worksheetTasks[3], state)?.complete, false);
  state.words = [2, 4, 0, 1, 3, 5];
  assert.equal(checkTask(worksheetTasks[3], state)?.correct, false);
});
test("matching uses the author's confirmed key and rejects unknown categories", () => {
  const state = emptyWorksheetAnswers();
  state.matches = {
    tales: "art",
    proverbs: "wisdom",
    "matryoshka-maslenitsa": "traditions",
  };
  assert.deepEqual(checkTask(worksheetTasks[4], state), {
    complete: true,
    correct: true,
  });
  state.matches.tales = "wisdom";
  assert.equal(checkTask(worksheetTasks[4], state)?.correct, false);
  state.matches.tales = "unknown";
  assert.equal(checkTask(worksheetTasks[4], state)?.complete, false);
});
test("oral tasks and self-assessment are not graded; reset preserves other tasks", () => {
  const state = emptyWorksheetAnswers();
  state.words = [2, 4, 1];
  state.selections.situations = ["museum"];
  for (const index of [5, 6, 7])
    assert.equal(checkTask(worksheetTasks[index], state), null);
  const reset = resetTask(worksheetTasks[3], state);
  assert.deepEqual(reset.words, []);
  assert.deepEqual(reset.selections.situations, ["museum"]);
  assert.deepEqual(state.words, [2, 4, 1]);
  assert.deepEqual(toggleChoice(["a", "b"], "a"), ["b"]);
});

test("Aydar classification is independent, rejects a mismatched text, and resets only its own choices", async () => {
  const { aydarTasks } = await import("../src/content/lesson-02-worksheet");
  const task = aydarTasks[1];
  assert.ok(task.type === "classify");
  const state = emptyWorksheetAnswers();
  state.classifications["clues-story"] = "what-happened";
  state.underlines["clues-story"] = ["0", "4"];
  assert.equal(checkTask(task, state)?.complete, false);
  state.classifications = {
    ...state.classifications,
    "page-a": "narrative",
    "page-b": "description",
    "page-c": "reasoning",
  };
  assert.deepEqual(checkTask(task, state), { complete: true, correct: true });
  state.classifications["page-b"] = "narrative";
  assert.equal(checkTask(task, state)?.correct, false);
  const reset = resetTask(task, state);
  assert.equal(checkTask(task, reset)?.complete, false);
  assert.equal(reset.classifications["clues-story"], "what-happened");
  assert.deepEqual(reset.underlines["clues-story"], ["0", "4"]);
});

test("Amina's sentence variations, punctuation and oral rule are never graded against a single invented answer", async () => {
  const { aminaTasks } = await import("../src/content/lesson-03-worksheet");
  const state = emptyWorksheetAnswers();
  state.compositions.bees = { order: [2, 1, 0], capital: true, ending: "!" };
  state.endings["saw-kurai"] = "!";
  for (const task of aminaTasks) assert.equal(checkTask(task, state), null);
  assert.equal(aminaTasks.at(-1)?.finalReview, true);
});
