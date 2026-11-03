import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowRight,
  CaretDown,
  Check,
  CornersOut,
  Hand,
  Minus,
  Plus,
  QuestionMark,
  Star,
  X,
} from "@phosphor-icons/react";
import geography from "./content/map-path.json";
import { journeyStops, type JourneyStop } from "./content/journey-stops";
import { clampPan, groupStops, type StopGroup } from "./features/map-layout";
import { publishedLessons } from "./content/published-lessons";
import "./journey-map.css";

export function JourneyMap({
  completedLessonIds,
  celebrate,
}: {
  completedLessonIds: readonly string[];
  celebrate: boolean;
}) {
  const [selected, setSelected] = useState<JourneyStop | null>(null);
  const selectedLesson = selected?.lessonId
    ? publishedLessons[selected.lessonId]
    : undefined;
  const done = Boolean(
    selectedLesson && completedLessonIds.includes(selectedLesson.id),
  );
  const isPublished = (stop: JourneyStop) =>
    Boolean(stop.lessonId && publishedLessons[stop.lessonId]);
  const isDone = (stop: JourneyStop) =>
    Boolean(stop.lessonId && completedLessonIds.includes(stop.lessonId));
  const readyStops = journeyStops.filter(isPublished);
  const markedCount = journeyStops.filter(isDone).length;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(1100);
  const [listOpen, setListOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  useEffect(() => {
    if (location.hash !== "#/map") return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById("map")
        ?.scrollIntoView({ behavior: "instant", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  const groups = useMemo(
    () => groupStops(journeyStops, width, zoom),
    [width, zoom],
  );
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry.contentRect.width;
      setWidth(nextWidth);
      setPan((current) => clampPan(current, nextWidth, zoom));
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [zoom]);
  useEffect(() => {
    if (!selected) return;
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [selected]);

  function selectStop(stop: JourneyStop) {
    if (!panel.current?.contains(document.activeElement))
      previousFocus.current = document.activeElement as HTMLElement;
    setSelected(stop);
  }
  function closePanel() {
    setSelected(null);
    if (previousFocus.current?.isConnected) previousFocus.current.focus();
    else viewport.current?.focus({ preventScroll: true });
  }
  function changeZoom(value: number) {
    const next = Math.max(1, Math.min(3.5, Math.round(value * 10) / 10));
    setZoom(next);
    setPan((current) => clampPan(current, width, next));
  }
  function revealGroup(group: StopGroup) {
    if (group.stops.length === 1) {
      selectStop(group.stops[0]);
      return;
    }
    const next = Math.min(3.5, zoom * 1.8);
    setZoom(next);
    setPan(
      clampPan(
        {
          x: ((700 - group.x) / 1400) * width * next,
          y: ((340 - group.y) / 1400) * width * next,
        },
        width,
        next,
      ),
    );
    viewport.current?.focus({ preventScroll: true });
  }
  function selectFromList(stop: JourneyStop) {
    selectStop(stop);
    const next = Math.max(zoom, width < 600 ? 2.5 : 1);
    setZoom(next);
    setPan(
      clampPan(
        {
          x: ((700 - stop.x) / 1400) * width * next,
          y: ((340 - stop.y) / 1400) * width * next,
        },
        width,
        next,
      ),
    );
  }

  return (
    <section
      id="map"
      className="journey-section wrap"
      aria-labelledby="journey-title"
    >
      <header className="journey-heading">
        <p className="journey-count">
          20 знакомств ·{" "}
          {markedCount
            ? `${markedCount} ${markedCount === 1 ? "отметка" : "отметки"} на карте`
            : "Начни с любой точки"}
        </p>
        <h2 id="journey-title">Карта нашего путешествия</h2>
        <p>Выбери неизвестную точку — открой новую историю.</p>
      </header>
      <div className="journey-atlas">
        <img
          className="journey-book"
          src="/media/album.webp"
          alt=""
          loading="lazy"
        />
        <div
          ref={viewport}
          className={`journey-viewport ${zoom > 1 ? "can-pan" : ""} ${dragging ? "is-dragging" : ""}`}
          tabIndex={0}
          role="group"
          aria-label="Карта России. При увеличении перемещайте карту стрелками или перетаскиванием."
          style={{ touchAction: zoom > 1 ? "none" : "pan-y" }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closePanel();
            if (zoom <= 1) return;
            const directions: Record<string, [number, number]> = {
              ArrowLeft: [65, 0],
              ArrowRight: [-65, 0],
              ArrowUp: [0, 65],
              ArrowDown: [0, -65],
            };
            const delta = directions[e.key];
            if (delta) {
              e.preventDefault();
              setPan((current) =>
                clampPan(
                  { x: current.x + delta[0], y: current.y + delta[1] },
                  width,
                  zoom,
                ),
              );
            }
          }}
          onPointerDown={(e) => {
            if (
              zoom <= 1 ||
              !e.isPrimary ||
              e.button !== 0 ||
              (e.target as HTMLElement).closest("button")
            )
              return;
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              panX: pan.x,
              panY: pan.y,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setPan(
              clampPan(
                {
                  x: drag.current.panX + e.clientX - drag.current.x,
                  y: drag.current.panY + e.clientY - drag.current.y,
                },
                width,
                zoom,
              ),
            );
          }}
          onPointerUp={() => {
            drag.current = null;
            setDragging(false);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
        >
          <div
            className="journey-plane"
            style={
              {
                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                "--map-zoom": zoom,
              } as CSSProperties
            }
          >
            <svg
              viewBox="0 0 1400 680"
              className="journey-geography"
              role="img"
              aria-label="Рисованная карта России с лесами, горами и животными"
            >
              <defs>
                <clipPath id="russia-geographic-clip">
                  <path d={geography.path ?? ""} />
                </clipPath>
              </defs>
              <path d={geography.path ?? ""} fill="#d9dfb1" />
              <image
                href="/media/russia-story-map.webp"
                width="1400"
                height="680"
                preserveAspectRatio="none"
                clipPath="url(#russia-geographic-clip)"
              />
              <path
                d={geography.path ?? ""}
                fill="none"
                stroke="#859358"
                strokeWidth="1.2"
              />
            </svg>
            <div className="journey-points" aria-label="Точки знакомств">
              {groups.map((group) => {
                const stop = group.stops[0],
                  isGroup = group.stops.length > 1;
                const completed = !isGroup && isDone(stop);
                const available = !isGroup && isPublished(stop);
                const groupHasLesson = isGroup && group.stops.some(isPublished);
                const active =
                  selected &&
                  group.stops.some((item) => item.id === selected.id);
                const label = isGroup
                  ? `Увеличить группу: ${group.stops.length} ${group.stops.length < 5 ? "знакомства" : "знакомств"}${groupHasLesson ? ". Есть доступный урок" : ""}`
                  : `Знакомство ${stop.number}. ${completed ? "Отмечено" : available ? "Урок доступен" : "Урок готовится"}`;
                return (
                  <button
                    key={group.stops.map((item) => item.id).join("-")}
                    className={`journey-point ${isGroup ? "is-group" : ""} ${groupHasLesson ? "has-ready-lesson" : ""} ${available ? "is-available" : ""} ${completed ? "is-completed" : ""} ${active ? "is-selected" : ""} ${completed && celebrate ? "is-new-mark" : ""}`}
                    style={{
                      left: `${group.x / 14}%`,
                      top: `${group.y / 6.8}%`,
                    }}
                    aria-label={label}
                    aria-pressed={Boolean(active)}
                    aria-controls={selected ? "journey-selection" : undefined}
                    title={label}
                    onClick={() => revealGroup(group)}
                  >
                    <span className="journey-point-face">
                      {isGroup ? (
                        <>
                          {group.stops.length}
                          {group.stops.some(isDone) && (
                            <Star size={12} weight="fill" />
                          )}
                        </>
                      ) : completed ? (
                        <Star size={22} weight="fill" />
                      ) : (
                        <QuestionMark size={20} weight="bold" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="journey-map-bottom">
        <div className="journey-legend" aria-label="Условные обозначения">
          <span>
            <QuestionMark size={19} />
            Урок доступен
          </span>
          <span>
            <span className="legend-pending">
              <QuestionMark size={17} />
            </span>
            Готовится
          </span>
          <span>
            <Star size={19} weight="fill" />
            Познакомились
          </span>
        </div>
        <div
          className="journey-controls"
          role="group"
          aria-label="Масштаб карты"
        >
          <button
            className="icon-button"
            aria-label="Уменьшить карту"
            disabled={zoom <= 1}
            onClick={() => changeZoom(zoom - 0.5)}
          >
            <Minus size={23} />
          </button>
          <output aria-label="Текущий масштаб">
            {Math.round(zoom * 100)}%
          </output>
          <button
            className="icon-button"
            aria-label="Увеличить карту"
            disabled={zoom >= 3.5}
            onClick={() => changeZoom(zoom + 0.5)}
          >
            <Plus size={23} />
          </button>
          <button
            className="button outline journey-fit"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <CornersOut size={22} />
            Вся карта
          </button>
        </div>
      </div>
      <p className="journey-touch-help">
        <Hand size={18} />
        {zoom > 1
          ? "Перемещай карту пальцем, мышью или стрелками клавиатуры."
          : groups.some((group) => group.stops.length > 1)
            ? "Нажми на группу точек, чтобы рассмотреть знакомства ближе."
            : "Каждый вопрос — новое знакомство. Нажми, чтобы узнать больше."}
      </p>
      {selected && (
        <div
          className={`journey-selection ${selectedLesson ? "has-lesson" : ""}`}
          id="journey-selection"
          ref={panel}
          tabIndex={-1}
          role="region"
          aria-labelledby="journey-selection-title"
          onKeyDown={(e) => {
            if (e.key === "Escape") closePanel();
          }}
        >
          <button
            className="icon-button journey-close"
            aria-label="Закрыть карточку знакомства"
            onClick={closePanel}
          >
            <X size={24} />
          </button>
          {selectedLesson ? (
            <>
              <img
                className="journey-guide"
                src={selectedLesson.heroImage}
                alt={selectedLesson.heroName}
              />
              <div>
                <p className="journey-panel-meta">
                  Знакомство {selected.number} · {selectedLesson.grade} класс ·{" "}
                  {selectedLesson.culture}
                </p>
                <h3 id="journey-selection-title">{selectedLesson.title}</h3>
                <p>{selectedLesson.greeting}</p>
                {done && (
                  <p className="journey-already-done">
                    <Check size={19} />
                    Это знакомство уже отмечено на карте
                  </p>
                )}
                <a className="button primary" href={selectedLesson.href}>
                  {done ? "Вернуться к уроку" : "Открыть урок"}
                  <ArrowRight size={22} />
                </a>
              </div>
            </>
          ) : (
            <div className="journey-coming">
              <p className="journey-panel-meta">
                Знакомство {selected.number} из 20
              </p>
              <h3 id="journey-selection-title">Новое знакомство готовится</h3>
              <p>
                Здесь появятся герой, история и задания. Пока можно начать
                путешествие с уже доступного урока.
              </p>
              <button
                className="text-link text-button"
                onClick={() => selectFromList(readyStops[0])}
              >
                Найти доступный урок <ArrowRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
      <div className="journey-list">
        <button
          className="journey-list-toggle"
          aria-expanded={listOpen}
          aria-controls="journey-stop-list"
          onClick={() => setListOpen(!listOpen)}
        >
          <span>
            Все знакомства{" "}
            <span className="journey-list-count">
              {readyStops.length}{" "}
              {readyStops.length === 1 ? "урок доступен" : "урока доступны"} ·
              ещё {journeyStops.length - readyStops.length} готовятся
            </span>
          </span>
          <CaretDown
            size={23}
            style={{ transform: listOpen ? "rotate(180deg)" : undefined }}
          />
        </button>
        {listOpen && (
          <ol id="journey-stop-list" className="journey-stop-list">
            {journeyStops.map((stop) => (
              <li key={stop.id}>
                <button
                  aria-label={`Выбрать знакомство ${stop.number}. ${isPublished(stop) ? (isDone(stop) ? "Отмечено" : "Урок доступен") : "Готовится"}`}
                  aria-pressed={selected?.id === stop.id}
                  onClick={() => selectFromList(stop)}
                >
                  <span>{stop.number}</span>
                  {isDone(stop) ? (
                    <Star size={21} weight="fill" />
                  ) : (
                    <QuestionMark size={20} />
                  )}
                  <span className="journey-list-status">
                    {isPublished(stop)
                      ? isDone(stop)
                        ? "Отмечено"
                        : "Доступно"
                      : "Готовится"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="journey-position-note">
        Точки будущих знакомств расположены условно. Народы России живут в
        разных регионах страны.
      </p>
    </section>
  );
}
