import type { Dispatch, SetStateAction } from "react";
import type { WorksheetTask, Option } from "./content/worksheet-types";
import { toggleChoice, type WorksheetAnswers } from "./features/worksheet";

type Props = {
  task: WorksheetTask;
  answers: WorksheetAnswers;
  setAnswers: Dispatch<SetStateAction<WorksheetAnswers>>;
  editing: () => void;
  checked: boolean;
};
const endings: Option[] = [
  { id: ".", text: "Точка ." },
  { id: "?", text: "Вопросительный ?" },
  { id: "!", text: "Восклицательный !" },
];
function RadioOptions({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="worksheet-inline-options">
      <legend>{label}</legend>
      {options.map((option) => (
        <label
          key={option.id}
          className={`worksheet-choice ${value === option.id ? "is-chosen" : ""}`}
        >
          <input
            type="radio"
            name={label}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
          />
          <span>{option.text}</span>
        </label>
      ))}
    </fieldset>
  );
}
const uppercaseFirst = (word: string) =>
  word.charAt(0).toLocaleUpperCase("ru") + word.slice(1);
export function AdditionalTasks({
  task,
  answers,
  setAnswers,
  editing,
  checked,
}: Props) {
  function choose(
    group: "classifications" | "endings" | "ratings",
    id: string,
    value: string,
  ) {
    setAnswers((state) => ({
      ...state,
      [group]: { ...state[group], [id]: value },
    }));
    editing();
  }
  switch (task.type) {
    case "reference":
      return (
        <div className="worksheet-reference">
          {task.entries.map((entry) => (
            <section className="worksheet-block" key={entry.title}>
              <h2>{entry.title}</h2>
              <p>
                <strong>{entry.question}</strong>
              </p>
              <p>{entry.description}</p>
            </section>
          ))}
          <p className="worksheet-rule-note">{task.note}</p>
        </div>
      );
    case "classify":
      return (
        <>
          {task.items.map((item) => (
            <section className="worksheet-block" key={item.id}>
              <h2>Текст {item.label}</h2>
              <p className="worksheet-passage">{item.text}</p>
              <RadioOptions
                label={`Тип текста ${item.label}`}
                options={task.options}
                value={answers.classifications[item.id]}
                onChange={(value) => choose("classifications", item.id, value)}
              />
              {checked && answers.classifications[item.id] === item.answer && (
                <p className="worksheet-explanation">{item.explanation}</p>
              )}
            </section>
          ))}
        </>
      );
    case "text-clues":
      return (
        <>
          <p className="worksheet-reading-help">
            Нажимай на слова, чтобы подчеркнуть их. Повторное нажатие снимает
            подчёркивание. После чтения выбери вопрос к тексту.
          </p>
          {task.items.map((item, index) => (
            <section key={item.id} className="worksheet-block">
              <h2>Текст {index + 1}</h2>
              <p className="worksheet-passage worksheet-token-passage">
                {item.text.split(/(\s+)/).map((word, i) =>
                  /^\s+$/.test(word) ? (
                    word
                  ) : (
                    <button
                      type="button"
                      key={i}
                      className="worksheet-reading-word"
                      aria-pressed={(
                        answers.underlines[item.id] ?? []
                      ).includes(String(i))}
                      onClick={() =>
                        setAnswers((state) => ({
                          ...state,
                          underlines: {
                            ...state.underlines,
                            [item.id]: toggleChoice(
                              state.underlines[item.id] ?? [],
                              String(i),
                            ),
                          },
                        }))
                      }
                    >
                      {word}
                    </button>
                  ),
                )}
              </p>
              <RadioOptions
                label={`Вопрос-подсказка к тексту ${index + 1}`}
                options={task.options}
                value={answers.classifications[item.id]}
                onChange={(value) => choose("classifications", item.id, value)}
              />
            </section>
          ))}
        </>
      );
    case "sentence-groups":
      return (
        <>
          <p className="worksheet-reading-help">
            Выбирай слова по порядку. Нажми на слово в предложении, чтобы
            вернуть его. Затем оформи начало и конец.
          </p>
          {task.items.map((item, index) => {
            const composition = answers.compositions[item.id] ?? {
              order: [],
              capital: false,
              ending: "",
            };
            const update = (change: Partial<typeof composition>) =>
              setAnswers((state) => ({
                ...state,
                compositions: {
                  ...state.compositions,
                  [item.id]: {
                    ...(state.compositions[item.id] ?? composition),
                    ...change,
                  },
                },
              }));
            return (
              <section key={item.id} className="worksheet-block">
                <h2>Предложение {index + 1}</h2>
                <p className="worksheet-source-words">
                  {item.words.join(" / ")}
                </p>
                <div
                  className="sentence"
                  aria-label={`Предложение ${index + 1}`}
                >
                  <div className="sentence-words">
                    {!composition.order.length ? (
                      <span className="empty-sentence">
                        Выбирай слова по порядку
                      </span>
                    ) : (
                      composition.order.map((wordIndex, position) => (
                        <button
                          key={wordIndex}
                          type="button"
                          className="word selected-word"
                          aria-label={`Вернуть слово «${item.words[wordIndex]}» из предложения ${index + 1}`}
                          onClick={() =>
                            update({
                              order: composition.order.filter(
                                (id) => id !== wordIndex,
                              ),
                            })
                          }
                        >
                          {position === 0 && composition.capital
                            ? uppercaseFirst(item.words[wordIndex])
                            : item.words[wordIndex]}
                          {position === composition.order.length - 1 &&
                            composition.ending}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div
                  className="word-bank"
                  aria-label={`Слова для предложения ${index + 1}`}
                >
                  {item.words.map((word, i) => (
                    <button
                      type="button"
                      key={i}
                      className="word"
                      disabled={composition.order.includes(i)}
                      onClick={() =>
                        update({ order: [...composition.order, i] })
                      }
                    >
                      {word}
                    </button>
                  ))}
                </div>
                <label
                  className={`worksheet-choice worksheet-capital-choice ${composition.capital ? "is-chosen" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={composition.capital}
                    onChange={() => update({ capital: !composition.capital })}
                  />
                  <span>Начать с заглавной буквы</span>
                </label>
                <RadioOptions
                  label={`Знак в конце предложения ${index + 1}`}
                  options={endings}
                  value={composition.ending}
                  onChange={(ending) => update({ ending })}
                />
              </section>
            );
          })}
        </>
      );
    case "punctuation":
    case "edit-sentences":
      return (
        <>
          {task.type === "edit-sentences" && (
            <p className="worksheet-reading-help">
              Нажми на слово, чтобы изменить первую букву на заглавную.
              Повторное нажатие возвращает строчную букву. Затем выбери знак.
            </p>
          )}
          {task.items.map((item, index) => (
            <section className="worksheet-block" key={item.id}>
              <h2>Запись {index + 1}</h2>
              <p className="worksheet-passage worksheet-token-passage">
                {task.type === "edit-sentences"
                  ? item.text.split(/(\s+)/).map((word, i) =>
                      /^\s+$/.test(word) ? (
                        word
                      ) : (
                        <button
                          type="button"
                          key={i}
                          className="worksheet-reading-word"
                          aria-label={`Изменить первую букву: ${word}`}
                          aria-pressed={(
                            answers.capitals[item.id] ?? []
                          ).includes(String(i))}
                          onClick={() =>
                            setAnswers((state) => ({
                              ...state,
                              capitals: {
                                ...state.capitals,
                                [item.id]: toggleChoice(
                                  state.capitals[item.id] ?? [],
                                  String(i),
                                ),
                              },
                            }))
                          }
                        >
                          {(answers.capitals[item.id] ?? []).includes(String(i))
                            ? uppercaseFirst(word)
                            : word}
                        </button>
                      ),
                    )
                  : item.text}
                {answers.endings[item.id] && (
                  <strong className="worksheet-ending">
                    {answers.endings[item.id]}
                  </strong>
                )}
              </p>
              <RadioOptions
                label={`Знак в конце записи ${index + 1}`}
                options={endings}
                value={answers.endings[item.id]}
                onChange={(value) => choose("endings", item.id, value)}
              />
            </section>
          ))}
        </>
      );
    case "self-rating":
      return (
        <>
          {task.items.map((item) => (
            <section className="worksheet-block" key={item.id}>
              <RadioOptions
                label={item.text}
                options={task.options}
                value={answers.ratings[item.id]}
                onChange={(value) => choose("ratings", item.id, value)}
              />
            </section>
          ))}
        </>
      );
    default:
      return null;
  }
}
