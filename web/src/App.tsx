import { publicAsset } from "./features/public-assets";
import {
  Fragment,
  lazy,
  Suspense,
  useCallback,
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
  removeLesson,
  emptyProgress,
  mergeProgress,
  parseProgress,
  readProgress,
  STORAGE_KEY,
  writeProgress,
  type Progress,
} from "./features/progress";
import { lessonByNumber, type LessonContent } from "./content/lessons";
import { publishedLessons } from "./content/published-lessons";
import { parseLessonLocation } from "./features/routes";
const JourneyMap = lazy(() =>
  import("./JourneyMap").then((module) => ({ default: module.JourneyMap })),
);

function scrollSection(id: string, behavior: ScrollBehavior) {
  document.getElementById(id)?.scrollIntoView({ behavior });
}

const Worksheet = lazy(() =>
  import("./Worksheet").then((module) => ({ default: module.Worksheet })),
);

const media = (name: string) => publicAsset(`media/${name}.webp`);
type HomeSection = "map" | "lessons" | "about";
type HomeNavigation = { section: HomeSection | null; behavior: ScrollBehavior };

function homeNavigationFromHash(): HomeNavigation {
  const section = location.hash.slice(2);
  return {
    section:
      section === "map" || section === "lessons" || section === "about"
        ? section
        : null,
    behavior: "instant",
  };
}

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
  const [lessonLocation, setLessonLocation] = useState(() =>
    parseLessonLocation(location.hash),
  );
  const { route, number: lessonNumber } = lessonLocation;
  const lesson = lessonByNumber(lessonNumber)!;
  const [homeNavigation, setHomeNavigation] = useState(homeNavigationFromHash);
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
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const done = progress.completedLessonIds.includes(lesson.id);
  useEffect(() => {
    if (route !== "home") setCelebrate(null);
  }, [route]);
  const endCelebration = useCallback(() => setCelebrate(null), []);
  useEffect(() => {
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
      const nextLocation = parseLessonLocation(location.hash);
      const nextRoute = nextLocation.route;
      setLessonLocation(nextLocation);
      setMenuOpen(false);
      setProjector(location.hash.endsWith("?projector"));
      if (nextRoute === "home") setHomeNavigation(homeNavigationFromHash());
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
      route === "home" ? "Альбом дружбы" : `${lesson.title} · Альбом дружбы`;
    const frame = requestAnimationFrame(() => {
      document.getElementById("main")?.focus({ preventScroll: true });
      if (route !== "home") window.scrollTo({ top: 0, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [route, lesson.id, lesson.title]);
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
        location.hash = location.hash.replace("?projector", "");
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
    setCelebrate(done ? null : lesson.id);
    setToast(
      saved
        ? "Урок пройден! Отметка сохранена в этом браузере."
        : "Урок отмечен как пройденный на этой странице. Сохраните путешествие в файл.",
    );
    location.hash = "/map";
  }
  function goSection(id: HomeSection) {
    const hash = `#/${id}`;
    setMenuOpen(false);
    if (route !== "home") {
      location.hash = `/${id}`;
      return;
    }
    // Same-page navigation owns its scroll. A hashchange would cancel it
    // with the instant positioning used for history and direct links.
    if (location.hash !== hash) history.pushState(null, "", hash);
    setHomeNavigation({
      section: id,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
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
            {progress.completedLessonIds.length > 0 && (
              <Check size={19} weight="bold" />
            )}
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
            onCelebrationEnd={endCelebration}
            navigation={homeNavigation}
            onSection={goSection}
          />
        )}
        {route === "lesson" && <Lesson lesson={lesson} />}
        {route === "not-found" && (
          <section className="wrap missing-lesson">
            <h1>Урок не найден</h1>
            <a className="button primary" href="#/lessons">
              Все уроки
            </a>
          </section>
        )}
        {(route === "interactive" || route === "activity") && (
          <Suspense
            fallback={
              <div className="wrap journey-loading" aria-live="polite">
                <h1>Загружаем урок {lesson.number}</h1>
                <p>Загружаем задания…</p>
              </div>
            }
          >
            <Worksheet
              key={lesson.id}
              lesson={lesson}
              done={done}
              projector={projector}
              setProjector={(value) => {
                setProjector(value);
                const path = `/lesson/${lesson.number}/${route === "activity" ? "activity" : "interactive"}`;
                location.hash = value ? `${path}?projector` : path;
              }}
              onFinish={finish}
            />
          </Suspense>
        )}
      </main>
      {!projector && (
        <footer className="footer wrap">
          <a className="footer-brand" href="#/">
            Альбом дружбы
          </a>
          <p className="small">© 2026 · Авторский образовательный проект</p>
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
  onCelebrationEnd,
  navigation,
  onSection,
}: {
  completedLessonIds: readonly string[];
  celebrate: string | null;
  onCelebrationEnd: () => void;
  navigation: HomeNavigation;
  onSection: (id: HomeSection) => void;
}) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useCallback((element: HTMLElement | null) => {
    setMapReady(element !== null);
  }, []);
  const canScroll = mapReady || navigation.section === null;
  useEffect(() => {
    if (!canScroll) return;
    if (navigation.section)
      scrollSection(navigation.section, navigation.behavior);
    else window.scrollTo({ top: 0, behavior: "instant" });
  }, [canScroll, navigation]);

  return (
    <>
      <section className="home-hero wrap" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Авторский образовательный проект</p>
          <h1 id="home-title">Альбом дружбы</h1>
          <p className="hero-subtitle">
            Интерактивные уроки русского языка с героями народов России.
          </p>
          <div className="author-note">
            <strong>Медведева Екатерина Ивановна</strong>
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
            <a
              className="button outline"
              href="#/about"
              onClick={(e) => {
                e.preventDefault();
                onSection("about");
              }}
            >
              Как устроен курс
            </a>
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
          <section className="wrap journey-loading" aria-live="polite">
            <h2>Карта нашего путешествия</h2>
            <p>Загружаем карту…</p>
          </section>
        }
      >
        <JourneyMap
          completedLessonIds={completedLessonIds}
          celebrate={celebrate}
          onCelebrationEnd={onCelebrationEnd}
          sectionRef={mapRef}
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
            «Альбом дружбы» — авторский образовательный проект, посвящённый Году
            единства народов России. Он объединяет уроки русского языка для
            учеников начальных классов. На каждом уроке дети знакомятся с
            культурой, традициями и историей одного из народов нашей страны.
            Через увлекательные задания и путешествия с героями школьники не
            только осваивают русский язык, но и учатся понимать и ценить
            культурное многообразие России.
          </p>
          <p>
            Проект создан в помощь учителям начальных классов. Здесь можно
            познакомиться с методикой, подготовиться к занятиям, открыть
            интерактивные уроки для показа на проекторе, скачать рабочие листы и
            готовые материалы. После каждого занятия класс может сохранить
            результаты своего путешествия в общем «Альбоме дружбы», постепенно
            создавая собственную историю знакомства с народами России.
          </p>
          <p className="small">
            Проект развивается и пополняется новыми материалами. Уже сейчас
            можно познакомиться с первыми уроками и отправиться в путешествие
            вместе с его героями.
          </p>
          <a className="text-link" href="#/lesson/1">
            Познакомиться с первым уроком <ArrowRight size={21} />
          </a>
        </div>
      </section>
    </>
  );
}

function Lesson({ lesson }: { lesson: LessonContent }) {
  return (
    <div className="lesson-page preparation-page wrap">
      <div className="breadcrumbs">
        <a href="#/lessons">Все уроки</a>
        <span>/</span>
        <span>Подготовка к уроку {lesson.number}</span>
      </div>
      <section className="lesson-hero" aria-labelledby="lesson-title">
        <div>
          <h1 id="lesson-title">
            {lesson.number === 1 ? (
              <>
                Русский язык —<br />
                государственный
                <br className="desktop-only" /> язык России
              </>
            ) : (
              lesson.title
            )}
          </h1>
          <p className="lesson-subtitle">Урок {lesson.number}</p>
          <p className="preparation-intro">{lesson.preparation.plot}</p>
        </div>
        <div
          className={`lesson-hero-art ${lesson.number !== 1 ? "family-lesson-art" : ""}`}
        >
          <img
            className="museum-backdrop"
            src={media("museum-background")}
            alt=""
          />
          <img
            className="egor-hero"
            src={publicAsset(lesson.heroImage)}
            alt={lesson.heroAlt}
          />
          <p className="egor-greeting">
            {lesson.number === 1 ? (
              <>
                Привет! Я Егор.
                <br />
                Поможешь мне
                <br />
                заполнить альбом дружбы?
              </>
            ) : (
              lesson.greeting
            )}
          </p>
        </div>
      </section>
      <section
        className="preparation-route"
        aria-labelledby="lesson-route-title"
      >
        <h2 id="lesson-route-title">Как пройдёт урок</h2>
        <div className="preparation-copy">
          <p>
            {lesson.preparation.opening}{" "}
            {lesson.preparation.trials.map((trial, index, trials) => {
              const last = index === trials.length - 1;
              return (
                <Fragment key={trial.title}>
                  {trial.leadIn}
                  <strong>«{trial.title}»</strong> {trial.description}
                  {last ? "." : ", "}
                </Fragment>
              );
            })}
          </p>
          <p>{lesson.preparation.closing}</p>
        </div>
      </section>
      <section
        className="materials-section"
        id="materials"
        aria-labelledby="materials-title"
      >
        <h2 id="materials-title">Подготовка к занятию</h2>
        <p className="preparation-copy">{lesson.preparation.materials}</p>
        {lesson.preparation.teacherNotes && (
          <details className="teacher-notes">
            <summary>Рекомендации учителю</summary>
            {lesson.preparation.teacherNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </details>
        )}
        {lesson.downloads.map((file) => (
          <a
            key={file.href}
            className="download-row"
            href={publicAsset(file.href)}
            download
          >
            <FileDoc size={32} weight="light" aria-hidden="true" />
            <span>
              <strong>{file.title}</strong>
              <span className="small">{file.detail}</span>
            </span>
            <span className="download-label">
              Скачать {file.format}{" "}
              <DownloadSimple size={22} aria-hidden="true" />
            </span>
          </a>
        ))}
        <div className="preparation-actions">
          <a
            className="button primary"
            href={`#/lesson/${lesson.number}/interactive`}
          >
            Начать урок <ArrowRight size={22} />
          </a>
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
        {count ? `Пройдено уроков: ${count}` : "Альбом ждёт первой отметки"}
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
        {progress.completedLessonIds.map((id) => {
          const completed = publishedLessons[id];
          return (
            <div className="completed-lesson-row" key={id}>
              <p>
                Урок {completed.number} · {completed.title}
              </p>
              <button
                className="text-button"
                aria-label={`Убрать отметку урока ${completed.number}`}
                onClick={() => {
                  const saved = save(removeLesson(progress, id));
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
          );
        })}
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
