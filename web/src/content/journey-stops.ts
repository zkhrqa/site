export type JourneyStop = {
  id: string;
  number: number;
  x: number;
  y: number;
  lessonId?: string;
  introduction?: {
    heroName: string;
    title: string;
    source: string;
  };
};

// Conditional discovery positions, explicitly approved as placeholders by the author.
// These are canvas coordinates, NOT ethnic territories or confirmed lesson locations.
const positions = [
  [190, 375],
  [235, 285],
  [315, 225],
  [390, 335],
  [410, 440],
  [525, 280],
  [570, 415],
  [650, 315],
  [680, 495],
  [755, 240],
  [795, 385],
  [815, 575],
  [890, 490],
  [935, 330],
  [1005, 250],
  [1040, 420],
  [1100, 155],
  [1100, 340],
  [1150, 500],
  [1200, 160],
];

// Герой и тема опубликованного урока берутся из реестра publishedLessons.
const introductions = [
  undefined,
  {
    heroName: "Айдар",
    title: "Типы текстов: повествование, описание, рассуждение",
    source: "lesson-02-teacher.doc, тема и сюжетная линия урока",
  },
  {
    heroName: "Амина",
    title: "Предложение: признаки и связь слов",
    source: "lesson-03-teacher.docx, тема и сюжетная линия урока",
  },
];

export const journeyStops: JourneyStop[] = positions.map(([x, y], index) => ({
  id: `stop-${String(index + 1).padStart(2, "0")}`,
  number: index + 1,
  x,
  y,
  ...(index < 3
    ? { lessonId: `lesson-${String(index + 1).padStart(2, "0")}` }
    : {}),
  ...(introductions[index] ? { introduction: introductions[index] } : {}),
}));
