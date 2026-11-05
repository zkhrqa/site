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
test("multiple selection distinguishes omitted choices, distractors and a complete answer", () => {
  const state = emptyWorksheetAnswers();
  assert.deepEqual(checkTask(worksheetTasks[0], state), {
    complete: false,
    correct: false,
  });
  state.selections.communication = ["signs", "schedule", "guide"];
  assert.equal(checkTask(worksheetTasks[0], state)?.correct, false);
  state.selections.communication.push("museum");
  assert.equal(checkTask(worksheetTasks[0], state)?.correct, true);
  state.selections.communication.push("sports");
  assert.equal(checkTask(worksheetTasks[0], state)?.correct, false);
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
  state.selections.communication = ["museum"];
  state.creative = "three-sentences";
  for (const index of [5, 6, 7])
    assert.equal(checkTask(worksheetTasks[index], state), null);
  const reset = resetTask(worksheetTasks[3], state);
  assert.deepEqual(reset.words, []);
  assert.deepEqual(reset.selections.communication, ["museum"]);
  assert.equal(reset.creative, "three-sentences");
  assert.deepEqual(state.words, [2, 4, 1]);
  assert.deepEqual(toggleChoice(["a", "b"], "a"), ["b"]);
});
