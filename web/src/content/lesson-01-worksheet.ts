import { lesson } from "./lesson-01";

export type Option = { id: string; text: string };
type ReadingPart =
  | { text: string }
  | { id: string; text: string; punctuation: string };
type BaseTask = {
  id: string;
  number: number;
  title: string;
  instruction: string;
  source: { document: "lesson-01-worksheet.docx"; section: number };
  discussion?: string[];
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
        parts: ReadingPart[];
        prompt: string;
        correct: string[];
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
  );

const source = (section: number) => ({
  document: "lesson-01-worksheet.docx" as const,
  section,
});
const readingParts: ReadingPart[] = lesson.story
  .split(/(\s+)/)
  .map((part, index) => {
    const word = /^([\p{L}-]+)(.*)$/u.exec(part);
    return word
      ? { id: String(index), text: word[1], punctuation: word[2] }
      : { text: part };
  });
const readingAnswers = new Set([
  "музее",
  "указатели",
  "расписание",
  "экскурсовод",
]);

export const worksheetTasks: WorksheetTask[] = [
  {
    id: "communication",
    number: 1,
    type: "underline",
    title: "Язык для общения",
    instruction: "Прочитай текст.",
    source: source(1),
    parts: readingParts,
    prompt:
      "а) Где Егор встретил русский язык? Подчеркни все подходящие варианты.",
    correct: readingParts.flatMap((part) =>
      "id" in part && readingAnswers.has(part.text.toLowerCase())
        ? [part.id]
        : [],
    ),
    discussion: [`б) ${lesson.question}`],
  },
  {
    id: "situations",
    number: 2,
    type: "multiple",
    title: "Где помогает русский язык?",
    instruction:
      "Отметь ✓ места и ситуации, где русский язык помогает людям получать информацию и общаться.",
    source: source(2),
    options: [
      { id: "school", text: "В школе - прочитать задание учителя." },
      { id: "library", text: "В библиотеке - узнать о выставке." },
      { id: "museum", text: "В музее - прочитать указатель." },
      { id: "station", text: "На вокзале - понять расписание." },
      {
        id: "notice",
        text: "В официальном объявлении - узнать важную информацию.",
      },
      {
        id: "conversation",
        text: "При разговоре с человеком из другого региона России.",
      },
    ],
    correct: [
      "school",
      "library",
      "museum",
      "station",
      "notice",
      "conversation",
    ],
  },
  {
    id: "true-false",
    number: 3,
    type: "verdicts",
    title: "Верно или неверно?",
    instruction:
      "Поставь рядом с каждым предложением «В» (верно) или «Н» (неверно).",
    source: source(3),
    items: [
      {
        id: "state-language",
        text: "Русский язык является государственным языком Российской Федерации.",
        answer: true,
      },
      {
        id: "only-russian",
        text: "В России все люди говорят только на русском языке.",
        answer: false,
      },
      {
        id: "understanding",
        text: "Русский язык помогает людям из разных регионов понимать друг друга.",
        answer: true,
      },
      {
        id: "cultural-wealth",
        text: "Языки и традиции народов России — часть культурного богатства страны.",
        answer: true,
      },
    ],
  },
  {
    id: "friendship-message",
    number: 4,
    type: "words",
    title: lesson.exercise.title,
    instruction: lesson.exercise.instruction,
    source: source(4),
    words: lesson.exercise.words,
    answer: lesson.exercise.answer,
    discussion: [lesson.exercise.reflection],
  },
  {
    id: "culture",
    number: 5,
    type: "matching",
    title: "Страницы альбома: культура России",
    instruction: "Соедини пример с тем, что он помогает нам узнавать.",
    source: source(5),
    categories: [
      { id: "art", text: "предмет народного искусства" },
      { id: "traditions", text: "народные традиции и праздники" },
      { id: "wisdom", text: "народная мудрость и меткие выражения" },
    ],
    items: [
      { id: "tales", text: "Русские народные сказки", answer: "art" },
      { id: "proverbs", text: "Пословицы", answer: "wisdom" },
      {
        id: "matryoshka-maslenitsa",
        text: "Матрёшка и Масленица",
        answer: "traditions",
      },
    ],
    answerSource:
      "Соответствия подтверждены автором в чате 3 ноября 2026: сказки — искусство; пословицы — мудрость; матрёшка и Масленица — народные традиции.",
    discussion: [
      "Назови или опиши ещё один знакомый тебе пример русской культуры.",
    ],
  },
  {
    id: "my-page",
    number: 6,
    type: "creative",
    title: "Моя страница альбома",
    instruction: "Выбери ОДНО задание и выполни его.",
    source: source(6),
    options: [
      {
        id: "three-sentences",
        text: "Напиши 3 предложения на тему «Где мне помогает русский язык?».",
      },
      {
        id: "describe-culture",
        text: "Опиши русскую народную традицию или предмет культуры (сказку, матрёшку или Масленицу).",
      },
      {
        id: "finish-sentence",
        text: "Закончи предложение: «Русский язык является государственным языком Российской Федерации, потому что…»",
      },
    ],
  },
  {
    id: "respect",
    number: 7,
    type: "discussion",
    title: "Подумай и ответь",
    instruction: "",
    source: source(7),
    discussion: [
      "Значит ли то, что русский язык - государственный, что другие языки не важны? Почему?",
      "Закончи фразу: «Я уважаю языки других людей, потому что…»",
    ],
  },
  {
    id: "self-review",
    number: 8,
    type: "self-review",
    title: "Проверь себя",
    instruction: "Отметь, что теперь ты умеешь.",
    source: source(8),
    options: [
      {
        id: "explain",
        text: "Могу объяснить, что русский язык - государственный язык Российской Федерации.",
      },
      {
        id: "examples",
        text: "Могу привести примеры, где русский язык помогает людям общаться.",
      },
      {
        id: "respect",
        text: "Понимаю, почему важно уважать языки и традиции народов России.",
      },
    ],
    discussion: ["Сегодня я узнал(а):"],
  },
];
