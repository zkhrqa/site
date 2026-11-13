export type Option = { id: string; text: string };
type BaseTask = {
  id: string;
  number: number;
  title: string;
  instruction: string;
  sourceInstruction?: string;
  source: {
    document: `lesson-${string}-worksheet.docx`;
    section: number | string;
  };
  finalReview?: boolean;
  closing?: string;
  discussion?: string[];
  onPaper?: boolean;
  hint?: string;
};
export type WorksheetTask = BaseTask &
  (
    | {
        type: "multiple";
        options: Option[];
        correct: string[];
      }
    | {
        type: "underline";
        passage: string;
        prompt: string;
        options: Option[];
      }
    | {
        type: "verdicts";
        items: { id: string; text: string; answer: boolean }[];
      }
    | { type: "words"; words: string[]; answer: string[] }
    | {
        type: "matching";
        categories: Option[];
        items: { id: string; text: string; answer: string }[];
        answerSource: string;
      }
    | { type: "creative"; options: Option[] }
    | { type: "discussion" }
    | { type: "self-review"; options: Option[] }
    | {
        type: "reference";
        entries: { title: string; question: string; description: string }[];
        sourceNote: string;
      }
    | {
        type: "classify";
        options: Option[];
        items: {
          id: string;
          label?: string;
          text: string;
          answer: string;
          options?: Option[];
          explanation?: string;
        }[];
      }
    | {
        type: "mark-words";
        items: { id: string; text: string; correct: number[] }[];
      }
    | {
        type: "short-answers";
        items: { id: string; text: string; accepted?: string[] }[];
      }
    | {
        type: "text-clues";
        options: Option[];
        items: { id: string; text: string }[];
      }
    | {
        type: "sentence-groups";
        items: {
          id: string;
          words: string[];
          footnote?: { term: string; definition: string };
        }[];
      }
    | {
        type: "punctuation" | "edit-sentences";
        items: { id: string; text: string }[];
      }
    | { type: "self-rating"; items: Option[]; options: Option[] }
  );
