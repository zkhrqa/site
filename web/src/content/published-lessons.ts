import { lessons } from "./lessons";
export const publishedLessons: Record<
  string,
  {
    id: string;
    number: number;
    title: string;
    href: string;
    heroName: string;
    heroImage: string;
    greeting: string;
  }
> = Object.fromEntries(
  lessons.map((lesson) => [
    lesson.id,
    {
      id: lesson.id,
      number: lesson.number,
      title: lesson.title,
      href: `#/lesson/${lesson.number}`,
      heroName: lesson.heroName,
      heroImage: lesson.heroImage,
      greeting: lesson.greeting,
    },
  ]),
);
