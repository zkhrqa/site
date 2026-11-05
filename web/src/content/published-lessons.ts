import { lesson } from "./lesson-01";

export const publishedLessons: Record<
  string,
  {
    id: string;
    title: string;
    href: string;
    heroName: string;
    heroImage: string;
    greeting: string;
  }
> = {
  [lesson.id]: {
    id: lesson.id,
    title: lesson.title,
    href: "#/lesson/1",
    heroName: "Егор",
    heroImage: "/media/egor.webp",
    greeting: "Привет! Я Егор. Поможешь мне заполнить альбом дружбы?",
  },
};
