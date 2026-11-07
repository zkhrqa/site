import type { WorksheetTask } from "./worksheet-types";
const source = (section: number | string) => ({
  document: "lesson-03-worksheet.docx" as const,
  section,
});
export const aminaTasks: WorksheetTask[] = [
  {
    id: "build-sentences",
    number: 1,
    type: "sentence-groups",
    title: "Собери слова в предложения",
    instruction:
      "Запиши слова в правильном порядке. Не забудь заглавную букву и знак в конце.",
    source: source(1),
    items: [
      { id: "bees", words: ["пчёлы", "собирают", "мёд"] },
      { id: "kurai", words: ["звучит", "курай"] },
      { id: "amina-pattern", words: ["Амина", "узор", "нарисовала"] },
    ],
    discussion: [
      "Прочитайте составленные предложения. Понятна ли мысль? Проверьте заглавную букву и знак в конце.",
    ],
  },
  {
    id: "restore-punctuation",
    number: 2,
    type: "punctuation",
    title: "Верни знаки препинания",
    instruction:
      "Поставь в конце каждого предложения точку, вопросительный или восклицательный знак.",
    source: source(2),
    items: [
      { id: "ornament", text: "Как красиво украшен башкирский орнамент" },
      { id: "saw-kurai", text: "Амина увидела курай" },
      {
        id: "instrument-question",
        text: "Как называется этот музыкальный инструмент",
      },
    ],
    discussion: [
      "Прочитайте предложения с выбранной интонацией и объясните знак в конце.",
    ],
  },
  {
    id: "restore-capitals",
    number: 3,
    type: "edit-sentences",
    title: "Будь внимателен к буквам",
    instruction:
      "Исправь ошибки в записи: поставь заглавные буквы и нужные знаки препинания.",
    source: source(3),
    items: [
      { id: "bashkortostan", text: "в башкортостане живут гостеприимные люди" },
      { id: "honey", text: "бабушка купила башкирский мёд" },
      { id: "embroidered", text: "как красиво вышит орнамент" },
    ],
    discussion: [
      "Прочитайте исправленные записи и объясните выбор заглавных букв и знаков.",
    ],
  },
  {
    id: "album-page",
    number: 4,
    type: "discussion",
    title: "Создай свою страницу",
    instruction: "",
    source: source(4),
    discussion: [
      "Составь два предложения о природе Башкортостана, башкирском мёде, курае или орнаменте. Одно предложение сделай вопросительным или восклицательным.",
    ],
  },
  {
    id: "my-rule",
    number: 5,
    type: "discussion",
    title: "Моя памятка",
    instruction: "Закончи правило своими словами:",
    source: source(5),
    discussion: [
      "Предложение выражает ______________________________________________ мысль.",
      "Оно начинается с __________________________ буквы, а в конце ставится __________________________ .",
    ],
  },
  {
    id: "amina-review",
    number: 6,
    finalReview: true,
    type: "self-rating",
    title: "Моя проверка",
    instruction: "Отметь ✓",
    source: source("Моя проверка"),
    items: [
      { id: "sentence", text: "Я умею отличать предложение от набора слов." },
      { id: "compose", text: "Я могу составить предложение из слов." },
      { id: "punctuation", text: "Я выбираю подходящий знак в конце." },
    ],
    options: [
      { id: "yes", text: "Да" },
      { id: "learning", text: "Пока тренируюсь" },
    ],
    closing:
      "Ты помог Амине - теперь её альбом рассказывает о родном крае ясно и красиво!",
  },
];
