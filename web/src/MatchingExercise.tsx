import { useId, useLayoutEffect, useRef, useState } from "react";
import type { Option } from "./content/lesson-01-worksheet";

type Props = {
  items: Option[];
  categories: Option[];
  matches: Record<string, string>;
  onMatch: (itemId: string, categoryId: string) => void;
};
type Connection = { id: string; target: string; path: string };

export function MatchingExercise({
  items,
  categories,
  matches,
  onMatch,
}: Props) {
  const helpId = useId();
  const [active, setActive] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [lines, setLines] = useState<Connection[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const itemButtons = useRef(new Map<string, HTMLButtonElement>());
  const categoryButtons = useRef(new Map<string, HTMLButtonElement>());

  useLayoutEffect(() => {
    const root = board.current;
    if (!root) return;
    function measure() {
      const bounds = root!.getBoundingClientRect();
      setLines(
        items.flatMap((item) => {
          const from = itemButtons.current
            .get(item.id)
            ?.getBoundingClientRect();
          const to = categoryButtons.current
            .get(matches[item.id])
            ?.getBoundingClientRect();
          if (!from || !to) return [];
          const x1 = from.right - bounds.left;
          const y1 = from.top + from.height / 2 - bounds.top;
          const x2 = to.left - bounds.left;
          const y2 = to.top + to.height / 2 - bounds.top;
          const bend = (x2 - x1) * 0.55;
          return [
            {
              id: item.id,
              target: matches[item.id],
              path:
                Math.abs(y2 - y1) < 1
                  ? `M ${x1} ${y1} L ${x2} ${y2}`
                  : `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
            },
          ];
        }),
      );
    }
    measure();
    if (!Object.keys(matches).length) {
      setActive(null);
      setNotice("");
    }
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const button of [
      ...itemButtons.current.values(),
      ...categoryButtons.current.values(),
    ])
      observer.observe(button);
    return () => observer.disconnect();
  }, [items, categories, matches]);

  return (
    <div className="worksheet-matching">
      <p id={helpId} className="worksheet-match-help">
        Выбери пример слева, затем подходящий вариант справа. Чтобы изменить
        связь, выбери эту пару заново.
      </p>
      <div
        className="worksheet-match-board"
        ref={board}
        aria-describedby={helpId}
      >
        <svg className="worksheet-match-lines" aria-hidden="true">
          {lines.map((line) => (
            <path
              className="worksheet-match-line"
              key={`${line.id}-${line.target}`}
              d={line.path}
              pathLength={1}
            />
          ))}
        </svg>
        <div
          className="worksheet-match-column"
          role="group"
          aria-label="Примеры культуры"
        >
          {items.map((item, index) => {
            const category = categories.find(
              (option) => option.id === matches[item.id],
            );
            return (
              <button
                key={item.id}
                ref={(button) => {
                  if (button) itemButtons.current.set(item.id, button);
                  else itemButtons.current.delete(item.id);
                }}
                type="button"
                className="worksheet-match-option"
                aria-pressed={active === item.id}
                aria-label={`${item.text}${category ? `. Соединено: ${category.text}` : ". Без соответствия"}`}
                onClick={() => {
                  setActive(active === item.id ? null : item.id);
                  setNotice("");
                }}
              >
                <span className="worksheet-pair-number" aria-hidden="true">
                  {index + 1}
                </span>
                <span>{item.text}</span>
              </button>
            );
          })}
        </div>
        <div
          className="worksheet-match-column"
          role="group"
          aria-label="Что помогают узнавать примеры"
        >
          {categories.map((category) => {
            const pairedNumbers = items.flatMap((item, index) =>
              matches[item.id] === category.id ? [index + 1] : [],
            );
            return (
              <button
                key={category.id}
                ref={(button) => {
                  if (button) categoryButtons.current.set(category.id, button);
                  else categoryButtons.current.delete(category.id);
                }}
                type="button"
                className="worksheet-match-option"
                aria-label={`${category.text}${pairedNumbers.length ? `. Соединено с примерами: ${pairedNumbers.join(", ")}` : ""}`}
                onClick={() => {
                  if (!active) {
                    setNotice("Сначала выбери пример слева.");
                    return;
                  }
                  onMatch(active, category.id);
                  setNotice(
                    `${items.find((item) => item.id === active)?.text} — ${category.text}.`,
                  );
                  setActive(null);
                }}
              >
                <span>{category.text}</span>
                {!!pairedNumbers.length && (
                  <span className="worksheet-pair-number" aria-hidden="true">
                    {pairedNumbers.join(", ")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="worksheet-match-status" role="status">
        {active
          ? `«${items.find((item) => item.id === active)?.text}»: выбери соответствие справа.`
          : notice}
      </p>
    </div>
  );
}
