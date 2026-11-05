import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  CaretDown,
  Check,
  CheckCircle,
  ChatsCircle,
  Info,
  ProjectorScreen,
  Star,
  X,
} from "@phosphor-icons/react";
import {
  worksheetTasks,
  type Option,
  type WorksheetTask,
} from "./content/lesson-01-worksheet";
import {
  checkTask,
  emptyWorksheetAnswers,
  resetTask,
  toggleChoice,
} from "./features/worksheet";
import "./worksheet.css";

type Props = {
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
function MatchPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const choices = [{ id: "", text: "Выбери соответствие" }, ...options];
  const selectedIndex = Math.max(
    0,
    choices.findIndex((item) => item.id === value),
  );
  useEffect(() => {
    if (open)
      (
        list.current?.children[selectedIndex] as HTMLButtonElement | undefined
      )?.focus({ preventScroll: true });
  }, [open, selectedIndex]);

  function close() {
    trigger.current?.focus({ preventScroll: true });
    setOpen(false);
  }

  return (
    <div
      className="worksheet-picker"
      onMouseDown={(event) => {
        if (open && (event.target as Element).closest("button"))
          event.preventDefault();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.stopPropagation();
          close();
          return;
        }
        const direction =
          event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
        if (!direction && (!open || !["Home", "End"].includes(event.key)))
          return;
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        const items = Array.from(
          list.current?.children ?? [],
        ) as HTMLButtonElement[];
        const current = items.indexOf(event.target as HTMLButtonElement);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (current + direction + items.length) % items.length;
        items[next]?.focus();
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="worksheet-picker-trigger"
        aria-label={`${label}. ${choices[selectedIndex].text}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span>{choices[selectedIndex].text}</span>
        <CaretDown size={18} aria-hidden="true" />
      </button>
      <div className="disclosure" data-open={open} inert={!open}>
        <div className="disclosure-clip">
          <div
            className="worksheet-picker-options"
            ref={list}
            id={id}
            role="listbox"
            aria-label={label}
          >
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                role="option"
                aria-selected={choice.id === value}
                tabIndex={-1}
                onClick={() => {
                  onChange(choice.id);
                  close();
                }}
              >
                {choice.text}
                {choice.id === value && <Check size={18} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function Subtask({ prompt }: { prompt: string }) {
  const part = /^([аб])\) (.+)$/u.exec(prompt);
  if (!part) return prompt;

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
export function Worksheet({ done, projector, setProjector, onFinish }: Props) {
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
        const isSelected = (part?: (typeof current.parts)[number]) =>
          part !== undefined && "id" in part && selected.includes(part.id);

        return (
          <fieldset className="worksheet-reading-group">
            <legend>
              <Subtask prompt={current.prompt} />
            </legend>
            <p className="worksheet-reading-help">
              Нажми на слово в тексте, чтобы подчеркнуть его. Нажми ещё раз,
              чтобы снять подчёркивание.
            </p>
            <p className="worksheet-reading">
              {current.parts.map((part, index, parts) => {
                if (!("id" in part)) {
                  return isSelected(parts[index - 1]) &&
                    isSelected(parts[index + 1]) ? (
                    <span className="worksheet-reading-join" key={index}>
                      {part.text}
                    </span>
                  ) : (
                    part.text
                  );
                }

                const pressed = isSelected(part);
                return (
                  <span className="worksheet-reading-token" key={part.id}>
                    <button
                      type="button"
                      className="worksheet-reading-word"
                      aria-pressed={pressed}
                      onClick={() => toggleSelection(part.id)}
                    >
                      {part.text}
                    </button>
                    {part.punctuation &&
                      (pressed && isSelected(parts[index + 2]) ? (
                        <span className="worksheet-reading-join">
                          {part.punctuation}
                        </span>
                      ) : (
                        part.punctuation
                      ))}
                  </span>
                );
              })}
            </p>
          </fieldset>
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
                      {value ? "В — верно" : "Н — неверно"}
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
          <div className="worksheet-matching">
            {current.items.map((item) => (
              <div className="worksheet-match-row" key={item.id}>
                <span>{item.text}</span>
                <MatchPicker
                  label={`Соответствие: ${item.text}`}
                  options={current.categories}
                  value={answers.matches[item.id] ?? ""}
                  onChange={(value) => {
                    setAnswers((state) => ({
                      ...state,
                      matches: { ...state.matches, [item.id]: value },
                    }));
                    editing();
                  }}
                />
              </div>
            ))}
          </div>
        );
      case "creative":
        return (
          <>
            <fieldset className="worksheet-options">
              <legend>Выбери одно задание</legend>
              {current.options.map((option) => (
                <Choice
                  key={option.id}
                  option={option}
                  radio
                  name="creative-task"
                  checked={answers.creative === option.id}
                  onChange={() =>
                    setAnswers((state) => ({ ...state, creative: option.id }))
                  }
                />
              ))}
            </fieldset>
            <section
              className="worksheet-discussion"
              aria-label="Обсудите в классе"
            >
              <h2>
                <ChatsCircle size={23} aria-hidden="true" />
                Обсудите в классе
              </h2>
              <p>
                Сформулируйте ответ на выбранное задание устно и обсудите его с
                классом.
              </p>
            </section>
          </>
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
    }
  }
  return (
    <div className="activity-page worksheet-page wrap">
      <div className="activity-toolbar">
        <a className="text-link" href="#/lesson/1">
          <ArrowLeft size={20} />К подготовке учителя
        </a>
        <button
          className="button outline"
          aria-pressed={projector}
          onClick={() => setProjector(!projector)}
        >
          {projector ? <X size={22} /> : <ProjectorScreen size={22} />}
          {projector ? "Выйти из режима проектора" : "На проектор"}
        </button>
      </div>
      <header className="activity-heading worksheet-heading">
        <p className="worksheet-position">
          Задание {task.number} из {worksheetTasks.length}
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
          <img src="/media/egor.webp" alt="Егор с альбомом дружбы" />
          <p>
            Выполняй задания
            <br />
            по порядку
          </p>
        </aside>
        <section
          className="worksheet-paper"
          aria-label={`Рабочий лист, задание ${task.number}`}
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
