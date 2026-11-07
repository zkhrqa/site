import { publicAsset } from "./features/public-assets";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  Check,
  CheckCircle,
  ChatsCircle,
  Info,
  ProjectorScreen,
  Star,
  X,
} from "@phosphor-icons/react";
import type { Option, WorksheetTask } from "./content/worksheet-types";
import type { LessonContent } from "./content/lessons";
import { AdditionalTasks } from "./AdditionalTasks";
import {
  checkTask,
  emptyWorksheetAnswers,
  resetTask,
  toggleChoice,
} from "./features/worksheet";
import { MatchingExercise } from "./MatchingExercise";
import "./worksheet.css";

type Props = {
  lesson: LessonContent;
  done: boolean;
  projector: boolean;
  setProjector: (value: boolean) => void;
  onFinish: () => void;
};
function Choice({
  option,
  checked,
  onChange,
  radio = false,
  name,
}: {
  option: Option;
  checked: boolean;
  onChange: () => void;
  radio?: boolean;
  name?: string;
}) {
  return (
    <label className={`worksheet-choice ${checked ? "is-chosen" : ""}`}>
      <input
        type={radio ? "radio" : "checkbox"}
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span>{option.text}</span>
    </label>
  );
}
function Subtask({ prompt }: { prompt: string }) {
  const part = /^([аб])\) (.+)$/u.exec(prompt);
  if (!part) return prompt.replace(/_{2,}/g, "…");

  return (
    <span className="worksheet-subtask">
      <span className="worksheet-subtask-letter">{part[1]}</span>{" "}
      <span>{part[2]}</span>
    </span>
  );
}
function Discussion({ prompts }: { prompts: string[] }) {
  return (
    <section className="worksheet-discussion" aria-label="Обсудите в классе">
      <h2>
        <ChatsCircle size={23} aria-hidden="true" />
        Обсудите в классе
      </h2>
      {prompts.map((prompt) => (
        <p key={prompt}>
          <Subtask prompt={prompt} />
        </p>
      ))}
    </section>
  );
}
export function Worksheet({
  lesson,
  done,
  projector,
  setProjector,
  onFinish,
}: Props) {
  const worksheetTasks = lesson.tasks;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(emptyWorksheetAnswers);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const title = useRef<HTMLHeadingElement>(null);
  const task = worksheetTasks[step];
  const result = checkTask(task, answers);
  const checked = checkedIds.includes(task.id);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);
  const editing = () =>
    setCheckedIds((ids) => ids.filter((id) => id !== task.id));
  function toggleSelection(id: string) {
    setAnswers((state) => ({
      ...state,
      selections: {
        ...state.selections,
        [task.id]: toggleChoice(state.selections[task.id] ?? [], id),
      },
    }));
    editing();
  }
  function content(current: WorksheetTask) {
    switch (current.type) {
      case "underline": {
        const selected = answers.selections[current.id] ?? [];
        return (
          <>
            <p className="worksheet-reading">{current.passage}</p>
            <fieldset className="worksheet-reading-group">
              <legend>
                <Subtask prompt={current.prompt} />
              </legend>
              <div className="worksheet-reading-options">
                {current.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="worksheet-reading-word"
                    data-option-id={option.id}
                    aria-pressed={selected.includes(option.id)}
                    onClick={() => toggleSelection(option.id)}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
              <p className="worksheet-reading-help">
                Нажми на вариант, чтобы подчеркнуть его. Повторное нажатие
                снимает подчёркивание.
              </p>
            </fieldset>
          </>
        );
      }
      case "multiple":
        return (
          <fieldset className="worksheet-options">
            <legend>Выбери все подходящие варианты</legend>
            {current.options.map((option) => (
              <Choice
                key={option.id}
                option={option}
                checked={(answers.selections[current.id] ?? []).includes(
                  option.id,
                )}
                onChange={() => toggleSelection(option.id)}
              />
            ))}
          </fieldset>
        );
      case "verdicts":
        return (
          <div className="worksheet-verdicts">
            {current.items.map((item) => (
              <fieldset className="worksheet-verdict-row" key={item.id}>
                <legend>{item.text}</legend>
                <div>
                  {[true, false].map((value) => (
                    <label
                      key={String(value)}
                      className={
                        answers.verdicts[item.id] === value ? "is-chosen" : ""
                      }
                    >
                      <input
                        type="radio"
                        name={item.id}
                        checked={answers.verdicts[item.id] === value}
                        onChange={() => {
                          setAnswers((state) => ({
                            ...state,
                            verdicts: { ...state.verdicts, [item.id]: value },
                          }));
                          editing();
                        }}
                      />
                      {value ? "Верно" : "Неверно"}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        );
      case "words":
        return (
          <>
            <div className="sentence" aria-label="Твоё предложение">
              <p className="sentence-caption">Твоё послание</p>
              <div className="sentence-words">
                {!answers.words.length ? (
                  <span className="empty-sentence">
                    Выбирай слова по порядку
                  </span>
                ) : (
                  answers.words.map((index, position) => (
                    <button
                      key={index}
                      className="word selected-word"
                      aria-label={`Убрать слово «${current.words[index]}», позиция ${position + 1}`}
                      onClick={() => {
                        setAnswers((state) => ({
                          ...state,
                          words: state.words.filter((id) => id !== index),
                        }));
                        editing();
                      }}
                    >
                      {current.words[index]}
                      {position === current.words.length - 1 && "."}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="word-bank" aria-label="Слова для предложения">
              {current.words.map((word, index) => (
                <button
                  key={index}
                  className="word"
                  disabled={answers.words.includes(index)}
                  onClick={() => {
                    setAnswers((state) => ({
                      ...state,
                      words: [...state.words, index],
                    }));
                    editing();
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
            <p className="word-help">
              Нажми на слово, чтобы добавить его. Нажми на слово в послании,
              чтобы убрать.
            </p>
          </>
        );
      case "matching":
        return (
          <MatchingExercise
            key={current.id}
            items={current.items}
            categories={current.categories}
            matches={answers.matches}
            onMatch={(itemId, categoryId) => {
              setAnswers((state) => ({
                ...state,
                matches: { ...state.matches, [itemId]: categoryId },
              }));
              editing();
            }}
          />
        );
      case "creative":
        return (
          <section
            className="worksheet-discussion"
            aria-label="Обсудите в классе"
          >
            <h2>
              <ChatsCircle size={23} aria-hidden="true" />
              Обсудите в классе
            </h2>
            <ul className="worksheet-creative-list">
              {current.options.map((option) => (
                <li key={option.id}>{option.text}</li>
              ))}
            </ul>
          </section>
        );
      case "self-review":
        return (
          <fieldset className="worksheet-options">
            <legend>Что теперь получается?</legend>
            {current.options.map((option) => (
              <Choice
                key={option.id}
                option={option}
                checked={answers.selfReview.includes(option.id)}
                onChange={() =>
                  setAnswers((state) => ({
                    ...state,
                    selfReview: toggleChoice(state.selfReview, option.id),
                  }))
                }
              />
            ))}
          </fieldset>
        );
      case "discussion":
        return null;
      default:
        return (
          <AdditionalTasks
            task={current}
            answers={answers}
            setAnswers={setAnswers}
            editing={editing}
            checked={checked}
          />
        );
    }
  }
  return (
    <div className="activity-page worksheet-page wrap">
      <div className="activity-toolbar">
        <a className="text-link" href={`#/lesson/${lesson.number}`}>
          <ArrowLeft size={20} />К подготовке учителя
        </a>
        <button
          className="button outline"
          aria-pressed={projector}
          onClick={() => setProjector(!projector)}
        >
          {projector ? <X size={22} /> : <ProjectorScreen size={22} />}
          {projector ? "Выйти из режима проектора" : "Режим проектора"}
        </button>
      </div>
      <header className="activity-heading worksheet-heading">
        <p className="worksheet-position">
          {task.finalReview
            ? "Итог урока"
            : `Задание ${task.number} из ${worksheetTasks.filter((item) => !item.finalReview).length}`}
        </p>
        <h1 ref={title} tabIndex={-1}>
          {task.title}
        </h1>
        {task.instruction && (
          <p className="worksheet-instruction">{task.instruction}</p>
        )}
      </header>
      <div className="activity-stage worksheet-stage">
        <aside className="guide worksheet-guide">
          <img src={publicAsset(lesson.heroImage)} alt={lesson.heroAlt} />
          <p>
            Выполняй задания
            <br />
            по порядку
          </p>
        </aside>
        <section
          className="worksheet-paper"
          aria-label={`Рабочий лист, ${task.finalReview ? "итог урока" : `задание ${task.number}`}`}
        >
          {content(task)}
          {result && (
            <>
              <div className="exercise-actions">
                <button
                  className="button primary"
                  disabled={!result.complete}
                  onClick={() =>
                    setCheckedIds((ids) =>
                      ids.includes(task.id) ? ids : [...ids, task.id],
                    )
                  }
                >
                  Проверить <Check size={22} />
                </button>
                <button
                  className="text-button reset-button"
                  onClick={() => {
                    setAnswers((state) => resetTask(task, state));
                    editing();
                  }}
                >
                  <ArrowCounterClockwise size={21} />
                  Начать заново
                </button>
              </div>
              <div
                className={`worksheet-feedback ${checked && result.correct ? "success" : ""}`}
                role="status"
              >
                {checked &&
                  (result.correct ? (
                    <>
                      <CheckCircle size={24} />
                      <span>
                        Верно!{" "}
                        {task.type === "words"
                          ? "Русский язык помогает понимать друг друга."
                          : "Можно переходить дальше."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Info size={24} />
                      <span>
                        Есть неточности. Прочитай задание ещё раз и проверь свой
                        выбор.
                      </span>
                    </>
                  ))}
              </div>
            </>
          )}
          {task.discussion && <Discussion prompts={task.discussion} />}
          {task.closing && (
            <p className="worksheet-rule-note">{task.closing}</p>
          )}
        </section>
      </div>
      <nav
        className="worksheet-navigation"
        aria-label="Переходы между заданиями"
      >
        <button
          className="button outline"
          disabled={step === 0}
          onClick={() => setStep((value) => value - 1)}
        >
          <ArrowLeft size={21} />
          Назад
        </button>
        {step < worksheetTasks.length - 1 ? (
          <button
            className="button primary"
            onClick={() => setStep((value) => value + 1)}
          >
            Далее <ArrowRight size={21} />
          </button>
        ) : (
          <button className="button primary" onClick={onFinish}>
            {done ? "Вернуться к отметке" : "Завершить урок"}
            <Star size={22} weight={done ? "fill" : "regular"} />
          </button>
        )}
      </nav>
    </div>
  );
}
