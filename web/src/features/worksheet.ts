import type { WorksheetTask } from "../content/lesson-01-worksheet";

export type WorksheetAnswers = {
  selections: Record<string, string[]>;
  verdicts: Record<string, boolean>;
  words: number[];
  matches: Record<string, string>;
  creative: string | null;
  selfReview: string[];
};
export const emptyWorksheetAnswers = (): WorksheetAnswers => ({
  selections: {},
  verdicts: {},
  words: [],
  matches: {},
  creative: null,
  selfReview: [],
});
export function checkTask(
  task: WorksheetTask,
  answers: WorksheetAnswers,
): { complete: boolean; correct: boolean } | null {
  switch (task.type) {
    case "multiple": {
      const selected = answers.selections[task.id] ?? [];
      return {
        complete: selected.length > 0,
        correct:
          new Set(selected).size === selected.length &&
          selected.length === task.correct.length &&
          selected.every((id) => task.correct.includes(id)),
      };
    }
    case "verdicts":
      return {
        complete: task.items.every(
          (item) => typeof answers.verdicts[item.id] === "boolean",
        ),
        correct: task.items.every(
          (item) => answers.verdicts[item.id] === item.answer,
        ),
      };
    case "words": {
      const order = answers.words;
      const complete =
        order.length === task.words.length &&
        new Set(order).size === order.length &&
        order.every(
          (i) => Number.isInteger(i) && i >= 0 && i < task.words.length,
        );
      return {
        complete,
        correct:
          complete &&
          order.every(
            (index, position) => task.words[index] === task.answer[position],
          ),
      };
    }
    case "matching":
      return {
        complete: task.items.every((item) =>
          task.categories.some(
            (category) => category.id === answers.matches[item.id],
          ),
        ),
        correct: task.items.every(
          (item) => answers.matches[item.id] === item.answer,
        ),
      };
    default:
      return null;
  }
}
export function resetTask(
  task: WorksheetTask,
  answers: WorksheetAnswers,
): WorksheetAnswers {
  switch (task.type) {
    case "multiple":
      return {
        ...answers,
        selections: { ...answers.selections, [task.id]: [] },
      };
    case "verdicts":
      return { ...answers, verdicts: {} };
    case "words":
      return { ...answers, words: [] };
    case "matching":
      return { ...answers, matches: {} };
    case "creative":
      return { ...answers, creative: null };
    case "self-review":
      return { ...answers, selfReview: [] };
    default:
      return answers;
  }
}
export const toggleChoice = (selected: string[], id: string) =>
  selected.includes(id)
    ? selected.filter((item) => item !== id)
    : [...selected, id];
