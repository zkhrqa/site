import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowCounterClockwise,
  BookOpen,
  Camera,
  Check,
  CheckCircle,
  DownloadSimple,
  FileDoc,
  Info,
  List,
  MapTrifold,
  ProjectorScreen,
  Star,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import {
  completeLesson,
  emptyProgress,
  mergeProgress,
  parseProgress,
  readProgress,
  STORAGE_KEY,
  writeProgress,
  type Progress,
} from "./features/progress";
import { lesson } from "./content/lesson-01";
const JourneyMap = lazy(() =>
  import("./JourneyMap").then((module) => ({ default: module.JourneyMap })),
);

function scrollSection(id: string, behavior: ScrollBehavior) {
  const target = document.getElementById(id);
  if (target instanceof HTMLDetailsElement) target.open = true;
  target?.scrollIntoView({ behavior });
}

const media = (name: string) => `/media/${name}.webp`;
type Route = "home" | "lesson" | "interactive" | "activity";
const routeFromHash = (): Route =>
  location.hash.startsWith("#/lesson/1/activity")
    ? "activity"
    : location.hash.startsWith("#/lesson/1/interactive")
      ? "interactive"
      : location.hash.startsWith("#/lesson/1")
        ? "lesson"
        : "home";

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="paper-dialog"
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Закрыть" onClick={onClose}>
          <X size={25} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function App() {
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [storageError, setStorageError] = useState("");
  const [preserveStoredProgress, setPreserveStoredProgress] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavigation, setMobileNavigation] = useState(
    () => matchMedia("(max-width: 600px)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(max-width: 600px)");
    const update = () => setMobileNavigation(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node))
        setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);
  const [toast, setToast] = useState("");
  const [projector, setProjector] = useState(
    location.hash.endsWith("?projector"),
  );
  const [celebrate, setCelebrate] = useState(false);
  const done = progress.completedLessonIds.includes(lesson.id);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 1000);
    return () => clearTimeout(timer);
  }, [celebrate]);
  useEffect(() => {
    history.scrollRestoration = "manual";
    try {
      const result = readProgress(localStorage);
      setProgress(result.progress);
      setStorageError(result.error ?? "");
      setPreserveStoredProgress(Boolean(result.writeBlocked));
    } catch {
      setPreserveStoredProgress(true);
      setStorageError(
        "Браузер не разрешает сохранение. Отметки доступны до закрытия страницы; сохраните путешествие в файл.",
      );
    }
    const onHash = () => {
      setRoute(routeFromHash());
      setMenuOpen(false);
      setProjector(location.hash.endsWith("?projector"));
      requestAnimationFrame(() => {
        const id = location.hash.slice(2);
        if (["map", "lessons", "about"].includes(id))
          scrollSection(id, "instant");
        else if (!id) window.scrollTo({ top: 0, behavior: "instant" });
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        try {
          const r = readProgress(localStorage);
          setProgress(r.progress);
          setStorageError(r.error ?? "");
          setPreserveStoredProgress(Boolean(r.writeBlocked));
        } catch {
          /* Session remains usable. */
        }
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  useEffect(() => {
    document.title =
      route === "home"
        ? "Альбом дружбы — русский язык объединяет"
        : `${route === "activity" ? lesson.exercise.title : lesson.title} · Альбом дружбы`;
    requestAnimationFrame(() => {
      document.getElementById("main")?.focus({ preventScroll: true });
      const anchor =
        location.hash === "#/map"
          ? "map"
          : location.hash === "#/lessons"
            ? "lessons"
            : location.hash === "#/about"
              ? "about"
              : "";
      if (anchor) scrollSection(anchor, "instant");
      else window.scrollTo({ top: 0, behavior: "instant" });
    });
  }, [route]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!projector) return;
    const leave = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProjector(false);
        location.hash = "/lesson/1/activity";
      }
    };
    window.addEventListener("keydown", leave);
    return () => window.removeEventListener("keydown", leave);
  }, [projector]);
  function save(next: Progress, force = false) {
    setProgress(next);
    let saved = false;
    try {
      if (!preserveStoredProgress || force)
        saved = writeProgress(localStorage, next);
    } catch {
      /* blocked localStorage getter */
    }
    if (saved) setPreserveStoredProgress(false);
    setStorageError(
      saved
        ? ""
        : "Не удалось сохранить отметки в браузере. Сейчас они доступны до закрытия страницы. Сохраните путешествие в файл.",
    );
    return saved;
  }
  function finish() {
    const saved = save(completeLesson(progress, lesson.id));
    setCelebrate(true);
    setToast(
      saved
        ? "Первое знакомство отмечено! Путешествие сохранено в этом браузере."
        : "Знакомство отмечено на этой странице. Сохраните путешествие в файл.",
    );
    location.hash = "/map";
  }
  function goSection(id: string) {
    const hash = `#/${id}`;
    setMenuOpen(false);
    if (route !== "home") {
      location.hash = `/${id}`;
      return;
    }
    // Same-page navigation owns its scroll. A hashchange would cancel it
    // with the instant positioning used for history and direct links.
    if (location.hash !== hash) history.pushState(null, "", hash);
    scrollSection(
      id,
      matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    );
  }
  return (
    <div className={projector ? "site projector" : "site"}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        К содержанию
      </a>
      {!projector && (
        <header className="header wrap" ref={headerRef}>
          <a href="#/" className="brand" aria-label="Альбом дружбы — главная">
            <img src={media("brand")} alt="" width="80" height="60" />
            <span>
              Альбом
              <br />
              дружбы
            </span>
          </a>
          <nav
            id="main-navigation"
            inert={mobileNavigation && !menuOpen}
            aria-label="Главная навигация"
            className={menuOpen ? "navigation is-open" : "navigation"}
          >
            <a
              href="#/map"
              onClick={(e) => {
                e.preventDefault();
                goSection("map");
              }}
            >
              Карта
            </a>
            <a
              href="#/lessons"
              onClick={(e) => {
                e.preventDefault();
                goSection("lessons");
              }}
            >
              Уроки
            </a>
            <a
              href="#/about"
              onClick={(e) => {
                e.preventDefault();
                goSection("about");
              }}
            >
              О проекте
            </a>
          </nav>
          <button
            className="button outline journey-button"
            aria-label="Моё путешествие"
            onClick={() => {
              setMenuOpen(false);
              setProgressOpen(true);
            }}
          >
            <MapTrifold size={23} />
            <span>Моё путешествие</span>
            {done && <Check size={19} weight="bold" />}
          </button>
          <button
            className="icon-button menu-button"
            ref={menuButtonRef}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={26} /> : <List size={26} />}
          </button>
        </header>
      )}
      {storageError && (
        <div className="storage-warning wrap" role="status">
          <Info size={22} />
          <span>
            {storageError}{" "}
            <button
              className="text-button"
              onClick={() => setProgressOpen(true)}
            >
              Открыть путешествие
            </button>
          </span>
        </div>
      )}
      <main id="main" tabIndex={-1}>
        {route === "home" && (
          <Home
            completedLessonIds={progress.completedLessonIds}
            celebrate={celebrate}
            onSection={goSection}
          />
        )}
        {route === "lesson" && <Lesson />}
        {route === "interactive" && <InteractiveIntro />}
        {route === "activity" && (
          <Activity
            done={done}
            projector={projector}
            setProjector={(value) => {
              setProjector(value);
              location.hash = value
                ? "/lesson/1/activity?projector"
                : "/lesson/1/activity";
            }}
            onFinish={finish}
          />
        )}
      </main>
      {!projector && (
        <footer className="footer wrap">
          <a className="footer-brand" href="#/">
            Альбом дружбы
          </a>
          <p>Русский язык. Разные культуры. Общая история.</p>
          <p className="small">
            Географическая основа:{" "}
            <a
              href="https://www.naturalearthdata.com/about/terms-of-use/"
              target="_blank"
              rel="noreferrer"
            >
              Natural Earth
            </a>{" "}
            · Иллюстрации созданы для проекта
          </p>
        </footer>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={25} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Скрыть уведомление"
            onClick={() => setToast("")}
          >
            <X size={20} />
          </button>
        </div>
      )}
      {progressOpen && (
        <ProgressDialog
          progress={progress}
          storageError={storageError}
          save={save}
          close={() => setProgressOpen(false)}
          notify={setToast}
        />
      )}
    </div>
  );
}

function Home({
  completedLessonIds,
  celebrate,
  onSection,
}: {
  completedLessonIds: readonly string[];
  celebrate: boolean;
  onSection: (id: string) => void;
}) {
  return (
    <>
      <section className="home-hero wrap" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Авторский образовательный проект</p>
          <h1 id="home-title">
            Русский язык
            <br />
            объединяет
          </h1>
          <p className="hero-subtitle">
            20 интерактивных уроков о традициях и народах России
          </p>
          <div className="author-note">
            <strong>[Имя Фамилия Автора]</strong>
            <span>Учитель начальных классов, методист</span>
          </div>
          <div className="actions">
            <a
              className="button primary"
              href="#/map"
              onClick={(e) => {
                e.preventDefault();
                onSection("map");
              }}
            >
              Начать путешествие <ArrowRight size={23} />
            </a>
            <button
              className="button outline"
              onClick={() => onSection("about")}
            >
              Как устроен курс
            </button>
          </div>
        </div>
        <div className="author-art">
          <img className="hero-rowan" src={media("rowan")} alt="" />
          <img
            className="hero-landscape"
            src={media("landscape")}
            alt="Акварельный пейзаж с рекой и лесом"
          />
          <div className="portrait-placeholder">
            <Camera size={39} weight="light" />
            <p>
              Здесь будет
              <br />
              фотография автора
            </p>
          </div>
        </div>
      </section>
      <Suspense
        fallback={
          <section id="map" className="wrap journey-loading" aria-live="polite">
            <h2>Карта нашего путешествия</h2>
            <p>Загружаем карту…</p>
          </section>
        }
      >
        <JourneyMap
          completedLessonIds={completedLessonIds}
          celebrate={celebrate}
        />
      </Suspense>
      <section
        className="about-section wrap"
        id="about"
        aria-labelledby="about-title"
      >
        <img src={media("brand")} alt="" />
        <div>
          <h2 id="about-title">Один язык — много историй</h2>
          <p>
            «Альбом дружбы» — цикл уроков русского языка для третьеклассников.
            Вместе с героями дети изучают язык и знакомятся с культурой народов
            России.
          </p>
          <p>
            Учитель может открыть урок на проекторе, скачать рабочий лист для
            печати и после занятия оставить отметку в общем альбоме класса.
          </p>
          <p className="small">
            Сейчас доступна первая интерактивная часть урока с Егором. Полный
            сценарий и рабочий лист — на странице урока. Цикл продолжает расти.
          </p>
          <a className="text-link" href="#/lesson/1">
            Познакомиться с первым уроком <ArrowRight size={21} />
          </a>
        </div>
      </section>
    </>
  );
}

function Lesson() {
  return (
    <div className="lesson-page preparation-page wrap">
      <div className="breadcrumbs">
        <a href="#/lessons">Все уроки</a>
        <span>/</span>
        <span>Подготовка к уроку 1</span>
      </div>
      <section className="lesson-hero" aria-labelledby="lesson-title">
        <div>
          <h1 id="lesson-title">
            Русский язык —<br />
            государственный
            <br className="desktop-only" /> язык России
          </h1>
          <p className="lesson-subtitle">Урок 1 · 3 класс · Русская культура</p>
          <p className="full-topic">Тема: {lesson.fullTitle}</p>
          <p className="preparation-intro">{lesson.preparation.plot}</p>
          <a
            className="text-link materials-link"
            href="#materials"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("materials")?.scrollIntoView({
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
              });
            }}
          >
            Скачать материалы <DownloadSimple size={20} />
          </a>
        </div>
        <div className="lesson-hero-art">
          <img
            className="museum-backdrop"
            src={media("museum-background")}
            alt=""
          />
          <img
            className="egor-hero"
            src={media("egor")}
            alt="Егор держит альбом дружбы"
          />
          <p className="egor-greeting">
            Привет! Я Егор.
            <br />
            Поможешь мне
            <br />
            заполнить альбом дружбы?
          </p>
        </div>
      </section>
      <section
        className="preparation-overview"
        aria-labelledby="preparation-title"
      >
        <h2 id="preparation-title">О чём урок</h2>
        <div className="preparation-columns">
          <div>
            <h3>Цель</h3>
            <p>{lesson.preparation.goal}</p>
          </div>
          <div>
            <h3>Что смогут объяснить дети</h3>
            <p>{lesson.preparation.result}</p>
          </div>
        </div>
      </section>
      <section
        className="materials-section"
        id="materials"
        aria-labelledby="materials-title"
      >
        <h2 id="materials-title">Подготовиться к занятию</h2>
        {lesson.downloads.map((file) => (
          <a key={file.href} className="download-row" href={file.href} download>
            <FileDoc size={32} weight="light" />
            <span>
              <strong>{file.title}</strong>
              <span className="small">{file.detail}</span>
            </span>
            <span className="download-label">
              Скачать <DownloadSimple size={22} />
            </span>
          </a>
        ))}
      </section>
      <section className="interactive-launch" aria-labelledby="launch-title">
        <div>
          <h2 id="launch-title">Готовы начать с классом?</h2>
          <p>Откройте историю Егора, обсудите её и соберите послание дружбы.</p>
          <p className="small">
            На сайте — история из задания 1 и интерактивное задание 4 рабочего
            листа. Все остальные задания и полный сценарий занятия — в
            материалах выше.
          </p>
        </div>
        <a className="button primary" href="#/lesson/1/interactive">
          Запустить интерактивную часть <ArrowRight size={22} />
        </a>
      </section>
    </div>
  );
}

function InteractiveIntro() {
  return (
    <div className="lesson-page interactive-intro wrap">
      <div className="breadcrumbs">
        <a href="#/lesson/1">К подготовке учителя</a>
        <span>/</span>
        <span>Урок 1</span>
      </div>
      <header className="interactive-heading">
        <h1>Русский язык объединяет</h1>
        <p>История Егора · Рабочий лист, задание 1</p>
      </header>
      <section
        className="story-section"
        id="story"
        aria-labelledby="story-title"
      >
        <h2 id="story-title">
          <span className="chapter-number">1</span>Почему мы понимаем друг
          друга?
        </h2>
        <div className="story-grid">
          <img
            src={media("museum")}
            alt="Егор и другие ребята слушают экскурсовода в музее"
          />
          <div>
            <p>{lesson.story}</p>
            <blockquote>{lesson.question}</blockquote>
            <p className="small">
              Обсудите в классе, а затем соберите послание дружбы.
            </p>
            <a className="button primary" href="#/lesson/1/activity">
              К посланию дружбы <ArrowRight size={22} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Activity({
  done,
  projector,
  setProjector,
  onFinish,
}: {
  done: boolean;
  projector: boolean;
  setProjector: (state: boolean) => void;
  onFinish: () => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [reflection, setReflection] = useState("");
  const words = lesson.exercise.words;
  const correct =
    selected.length === words.length &&
    selected.every((id, i) => words[id] === lesson.exercise.answer[i]);
  function reset() {
    setSelected([]);
    setChecked(false);
  }
  return (
    <div className="activity-page wrap">
      <div className="activity-toolbar">
        <a className="text-link" href="#/lesson/1">
          <ArrowLeft size={20} />К уроку
        </a>
        <button
          className="button outline"
          aria-pressed={projector}
          onClick={() => setProjector(!projector)}
        >
          {projector ? <X size={22} /> : <ProjectorScreen size={22} />}{" "}
          {projector ? "Выйти из режима проектора" : "На проектор"}
        </button>
      </div>
      <div className="activity-heading">
        <img className="activity-rowan left" src={media("rowan")} alt="" />
        <img className="activity-rowan right" src={media("rowan")} alt="" />
        <p className="eyebrow">{lesson.exercise.source}</p>
        <h1>{lesson.exercise.title}</h1>
        <p>{lesson.exercise.instruction}</p>
      </div>
      <div className="activity-stage">
        <aside className="guide">
          <img src={media("egor")} alt="Егор с альбомом" />
          <p>
            Давай соберём
            <br />
            важные слова вместе!
          </p>
        </aside>
        <section className="exercise-paper" aria-label="Сборка предложения">
          <div className="sentence" aria-label="Твоё предложение">
            <p className="sentence-caption">Твоё послание</p>
            <div className="sentence-words">
              {selected.length === 0 ? (
                <span className="empty-sentence">Выбирай слова по порядку</span>
              ) : (
                selected.map((id, i) => (
                  <button
                    key={id}
                    className={`word selected-word ${checked && correct ? "correct-word" : ""}`}
                    aria-label={`Убрать слово «${words[id]}», позиция ${i + 1}`}
                    onClick={() => {
                      setSelected(selected.filter((item) => item !== id));
                      setChecked(false);
                    }}
                  >
                    {words[id]}
                    {i === words.length - 1 && "."}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="word-bank" aria-label="Слова для предложения">
            {words.map((word, id) => (
              <button
                key={id}
                className="word"
                disabled={selected.includes(id)}
                onClick={() => {
                  setSelected([...selected, id]);
                  setChecked(false);
                }}
              >
                {word}
              </button>
            ))}
          </div>
          <p className="word-help">
            Нажми на слово, чтобы добавить его. Нажми ещё раз в послании, чтобы
            убрать.
          </p>
          <div className="exercise-actions">
            <button
              className="button primary"
              disabled={selected.length !== words.length}
              onClick={() => setChecked(true)}
            >
              Проверить <Check size={22} />
            </button>
            <button
              className="text-button reset-button"
              onClick={reset}
              disabled={!selected.length}
            >
              <ArrowCounterClockwise size={21} />
              Начать заново
            </button>
          </div>
          <div
            className={`exercise-feedback ${checked && correct ? "success" : ""}`}
            aria-live="polite"
          >
            {checked &&
              (correct ? (
                <>
                  <CheckCircle size={25} weight="fill" />
                  <span>
                    Получилось! Русский язык помогает понимать друг друга.
                  </span>
                </>
              ) : (
                <>
                  <Info size={25} />
                  <span>
                    Прочитай предложение вслух. Начни со слов «Русский язык» и
                    попробуй ещё раз.
                  </span>
                </>
              ))}
          </div>
        </section>
      </div>
      <section
        className="reflection-section"
        aria-labelledby="reflection-title"
      >
        <div>
          <h2 id="reflection-title">Поговорим о послании</h2>
          <label htmlFor="reflection">{lesson.exercise.reflection}</label>
          <p className="small">
            Можно ответить устно, в рабочем листе или записать мысль здесь.
          </p>
          <textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Я думаю, что…"
          />
          <p className="small">Запись остаётся только на этом экране.</p>
        </div>
        <div className="finish-note">
          <BookOpen size={42} weight="light" />
          <h3>Новая страница альбома</h3>
          <p>
            Когда знакомство завершено, учитель или ученик может оставить
            отметку на карте.
          </p>
          <button className="button primary" onClick={onFinish}>
            {done ? "Вернуться к отметке" : "Отметить знакомство"}
            <Star size={23} weight={done ? "fill" : "regular"} />
          </button>
          <p className="small">Отметка не зависит от результата задания.</p>
        </div>
      </section>
    </div>
  );
}

function ProgressDialog({
  progress,
  storageError,
  save,
  close,
  notify,
}: {
  progress: Progress;
  storageError: string;
  save: (p: Progress, force?: boolean) => boolean;
  close: () => void;
  notify: (s: string) => void;
}) {
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const count = progress.completedLessonIds.length;
  function exportFile() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(progress, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "album-druzhby-progress.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFile(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 100_000)
        throw new Error("Файл слишком большой. Максимум 100 КБ.");
      const incoming = parseProgress(await file.text());
      const saved = save(mergeProgress(progress, incoming));
      notify(
        saved
          ? "Отметки из файла добавлены к путешествию."
          : "Отметки добавлены на эту страницу. Браузер не разрешил их сохранить.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось открыть файл.");
    }
  }
  return (
    <Modal title="Моё путешествие" onClose={close}>
      <p className="progress-count">
        <Star size={28} weight={count ? "fill" : "regular"} />
        {count ? "Первое знакомство отмечено" : "Альбом ждёт первой отметки"}
      </p>
      <p>
        Отметки хранятся в этом браузере на этом устройстве. Чтобы перенести их
        на другой компьютер или сохранить копию, скачайте файл путешествия.
      </p>
      {storageError && (
        <p className="form-error" role="alert">
          {storageError}
        </p>
      )}
      <div className="progress-controls">
        <button className="button primary" onClick={exportFile}>
          <DownloadSimple size={22} />
          Сохранить в файл
        </button>
        <label className="button outline import-control">
          <UploadSimple size={22} />
          Загрузить из файла
          <input
            type="file"
            accept=".json,application/json"
            aria-label="Загрузить путешествие из файла JSON"
            onChange={(e) => {
              void importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="small">
        JSON до 100 КБ. Загруженные отметки добавляются к существующим.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="reset-progress">
        {count > 0 && (
          <div className="completed-lesson-row">
            <p>Урок 1 · Знакомство с Егором</p>
            <button
              className="text-button"
              onClick={() => {
                const saved = save(emptyProgress());
                notify(
                  saved
                    ? "Отметка урока убрана."
                    : "Отметка убрана на этой странице. Сохранение браузера изменить не удалось.",
                );
              }}
            >
              Убрать отметку
            </button>
          </div>
        )}
        {confirmReset ? (
          <>
            <p>
              Сбросить все отметки в этом браузере? Перед этим можно сохранить
              файл.
            </p>
            <div className="actions">
              <button
                className="button danger"
                onClick={() => {
                  const saved = save(emptyProgress(), true);
                  setConfirmReset(false);
                  notify(
                    saved
                      ? "Отметки в этом браузере сброшены."
                      : "Отметки убраны на этой странице. Сохранённую копию браузера изменить не удалось.",
                  );
                }}
              >
                Сбросить отметки
              </button>
              <button
                className="button outline"
                onClick={() => setConfirmReset(false)}
              >
                Отмена
              </button>
            </div>
          </>
        ) : (
          <button
            className="text-button"
            disabled={!count && !storageError}
            onClick={() => setConfirmReset(true)}
          >
            <ArrowCounterClockwise size={20} />
            Сбросить путешествие
          </button>
        )}
      </div>
    </Modal>
  );
}
