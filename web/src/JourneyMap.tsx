import { publicAsset } from "./features/public-assets";
import {
  useEffect,
  useLayoutEffect,
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
import {
  clampPan,
  groupStops,
  mapLabelOffsets,
  zoomAround,
  type MapView,
  type StopGroup,
} from "./features/map-layout";
import { publishedLessons } from "./content/published-lessons";
import "./journey-map.css";

export function JourneyMap({
  completedLessonIds,
  celebrate,
  onCelebrationEnd,
  sectionRef,
}: {
  completedLessonIds: readonly string[];
  celebrate: string | null;
  onCelebrationEnd: () => void;
  sectionRef: (section: HTMLElement | null) => void;
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

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(1100);
  const [catalogueExpanded, setCatalogueExpanded] = useState(false);
  const [mobileCatalogue, setMobileCatalogue] = useState(
    () => matchMedia("(max-width: 600px)").matches,
  );
  const previewCount = mobileCatalogue ? 4 : 5;
  const catalogue = useRef<HTMLElement>(null);
  const catalogueFrame = useRef<HTMLDivElement>(null);
  const catalogueList = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const query = matchMedia("(max-width: 600px)");
    const update = () => setMobileCatalogue(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useLayoutEffect(() => {
    const frame = catalogueFrame.current;
    const list = catalogueList.current;
    const lastPreview =
      list?.children[Math.min(previewCount, journeyStops.length) - 1];
    if (!frame || !list || !lastPreview) return;

    const measure = () => {
      const bounds = list.getBoundingClientRect();
      const padding = parseFloat(getComputedStyle(list).paddingBottom);
      const previewHeight =
        lastPreview.getBoundingClientRect().bottom - bounds.top + padding;
      frame.style.setProperty(
        "--catalogue-preview-height",
        `${previewHeight}px`,
      );
      frame.style.setProperty("--catalogue-full-height", `${bounds.height}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(lastPreview);
    return () => observer.disconnect();
  }, [previewCount]);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const view = useRef({ zoom, pan, width });
  view.current = { zoom, pan, width };
  const suppressClickUntil = useRef(0);
  const [gesturing, setGesturing] = useState(false);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    type Gesture = {
      start: MapView;
      anchor: { x: number; y: number };
      distance: number;
      fingers: number;
    };
    let gesture: Gesture | null = null;
    let moved = false;
    const position = (touches: TouchList) => {
      const rect = element.getBoundingClientRect();
      const a = touches[0],
        b = touches[1] ?? a;
      return {
        x: (a.clientX + b.clientX) / 2 - rect.left - rect.width / 2,
        y: (a.clientY + b.clientY) / 2 - rect.top - rect.height / 2,
        distance: Math.max(
          1,
          Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        ),
      };
    };
    const begin = (event: TouchEvent) => {
      const fingers = event.touches.length;
      if (!fingers || (fingers === 1 && view.current.zoom <= 1)) {
        gesture = null;
        setGesturing(false);
        return;
      }
      const point = position(event.touches);
      gesture = {
        start: view.current,
        anchor: point,
        distance: point.distance,
        fingers,
      };
      setGesturing(true);
      if (fingers > 1 && event.cancelable) event.preventDefault();
    };
    const move = (event: TouchEvent) => {
      if (!gesture || gesture.fingers !== event.touches.length) return;
      const midpoint = position(event.touches);
      if (event.cancelable) event.preventDefault();
      if (
        Math.hypot(
          midpoint.x - gesture.anchor.x,
          midpoint.y - gesture.anchor.y,
        ) > 5 ||
        Math.abs(midpoint.distance - gesture.distance) > 3
      )
        moved = true;
      if (moved) suppressClickUntil.current = Date.now() + 400;
      const next = zoomAround(
        gesture.start,
        gesture.start.zoom *
          (gesture.fingers > 1 ? midpoint.distance / gesture.distance : 1),
        gesture.anchor,
        midpoint,
        view.current.width,
      );
      view.current = { ...view.current, ...next };
      setZoom(next.zoom);
      setPan(next.pan);
    };
    const end = (event: TouchEvent) => {
      if (moved) suppressClickUntil.current = Date.now() + 400;
      if (event.touches.length) begin(event);
      else {
        gesture = null;
        moved = false;
        setGesturing(false);
      }
    };
    const cancel = () => {
      gesture = null;
      moved = false;
      setGesturing(false);
    };
    element.addEventListener("touchstart", begin, { passive: false });
    element.addEventListener("touchmove", move, { passive: false });
    element.addEventListener("touchend", end);
    element.addEventListener("touchcancel", cancel);
    return () => {
      element.removeEventListener("touchstart", begin);
      element.removeEventListener("touchmove", move);
      element.removeEventListener("touchend", end);
      element.removeEventListener("touchcancel", cancel);
    };
  }, []);
  const panel = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const groups = useMemo(
    () => groupStops(journeyStops, width, zoom),
    [width, zoom],
  );
  const labelOffsets = useMemo(
    () => mapLabelOffsets(groups, (width / 1400) * zoom),
    [groups, width, zoom],
  );
  const celebrationPoint = useRef<HTMLButtonElement>(null);
  const [stamping, setStamping] = useState(false);
  useEffect(() => {
    if (!celebrate) {
      setStamping(false);
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCelebrationEnd();
      return;
    }
    const point = celebrationPoint.current;
    if (!point) return;
    // Wait for the lazy map and the navigation scroll, so the stamp is seen.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setStamping(true);
          observer.disconnect();
        }
      },
      { threshold: 1 },
    );
    observer.observe(point);
    return () => observer.disconnect();
  }, [celebrate, groups, onCelebrationEnd]);
  const selectedPoint = selected
    ? (groups.find((group) => group.stops.includes(selected)) ?? selected)
    : null;
  const selectionOffset = selectedPoint
    ? {
        x: ((selectedPoint.x - 700) / 1400) * width * zoom + pan.x,
        y: ((selectedPoint.y - 340) / 1400) * width * zoom + pan.y,
      }
    : null;
  useEffect(() => {
    if (!viewport.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const nextWidth = entry.contentRect.width;
      setWidth(nextWidth);
      setPan((current) => clampPan(current, nextWidth, view.current.zoom));
    });
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!selected) return;
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({
      block: "nearest",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [selected]);

  function selectStop(stop: JourneyStop, trigger?: HTMLElement) {
    if (trigger) previousFocus.current = trigger;
    if (stop === selected) panel.current?.focus();
    setSelected(stop);
  }
  function closePanel() {
    setSelected(null);
    if (previousFocus.current?.getClientRects().length)
      previousFocus.current.focus();
    else viewport.current?.focus({ preventScroll: true });
  }
  function changeZoom(value: number) {
    const next = Math.max(1, Math.min(3.5, Math.round(value * 100) / 100));
    setZoom(next);
    setPan((current) => clampPan(current, width, next));
  }
  function revealGroup(group: StopGroup, trigger: HTMLButtonElement) {
    if (group.stops.length === 1) {
      selectStop(group.stops[0], trigger);
      return;
    }
    const next = Math.min(3.5, zoom + 0.4);
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
  function selectFromList(stop: JourneyStop, trigger?: HTMLButtonElement) {
    selectStop(stop, trigger);
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

  function renderCatalogueStop(stop: JourneyStop, index: number) {
    const ready = stop.lessonId ? publishedLessons[stop.lessonId] : undefined;
    const completed = isDone(stop);
    const info = ready ?? stop.introduction;
    const description = info
      ? ` ${info.heroName}. ${ready ? `${ready.people}. ` : ""}${info.title}.`
      : "";
    const contents = (
      <>
        <span className="journey-stop-meta">
          <span>Урок {stop.number}</span>
          <span className="journey-list-status">
            {completed ? (
              <>
                <Star size={15} weight="fill" />
                Пройден
              </>
            ) : ready ? (
              "Доступно"
            ) : (
              "Готовится"
            )}
          </span>
        </span>
        <strong className="journey-stop-name">
          {info?.heroName ?? "Новый урок"}
        </strong>
        {ready && <span className="journey-stop-people">{ready.people}</span>}
        <span className="journey-stop-topic">
          {info?.title ?? "Тема урока появится позже"}
        </span>
        {ready && (
          <span className="journey-stop-action">
            К подготовке <ArrowRight size={18} />
          </span>
        )}
      </>
    );
    return (
      <li
        key={stop.id}
        data-extra={index >= previewCount || undefined}
        inert={!catalogueExpanded && index >= previewCount}
      >
        {ready ? (
          <a
            className={`journey-stop-card ${completed ? "is-done" : "is-ready"}`}
            href={ready.href}
            aria-label={`Урок ${stop.number}.${description} ${completed ? "Пройден. " : ""}Открыть подготовку к уроку`}
          >
            {contents}
          </a>
        ) : (
          <button
            className="journey-stop-card"
            aria-label={`Выбрать урок ${stop.number}.${description} Готовится`}
            aria-pressed={selected?.id === stop.id}
            aria-controls={
              selected?.id === stop.id ? "journey-selection" : undefined
            }
            onClick={(e) => selectFromList(stop, e.currentTarget)}
          >
            {contents}
          </button>
        )}
      </li>
    );
  }

  return (
    <section
      id="map"
      className="journey-section wrap"
      ref={sectionRef}
      aria-labelledby="journey-title"
    >
      <header className="journey-heading">
        <h2 id="journey-title">Карта нашего путешествия</h2>
        <p>Выбери неизвестную точку — открой новую историю.</p>
      </header>
      <div className="journey-map-stack">
        <div className="journey-atlas">
          <img
            className="journey-book"
            src={publicAsset("media/album.webp")}
            alt=""
            loading="lazy"
          />
          <div
            ref={viewport}
            className={`journey-viewport ${zoom > 1 ? "can-pan" : ""} ${dragging ? "is-dragging" : ""} ${gesturing ? "is-gesturing" : ""}`}
            tabIndex={0}
            role="group"
            aria-label="Карта России. При увеличении перемещайте карту стрелками или перетаскиванием."
            style={
              {
                touchAction: zoom > 1 ? "none" : "pan-y",
                "--map-zoom": zoom,
                "--map-pan-x": `${pan.x}px`,
                "--map-pan-y": `${pan.y}px`,
              } as CSSProperties
            }
            onClickCapture={(e) => {
              if (Date.now() < suppressClickUntil.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && selected) closePanel();
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
                e.pointerType === "touch" ||
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
              if (e.pointerType === "touch" || !drag.current) return;
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
            <div className="journey-plane">
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
                  href={publicAsset("media/russia-story-map.webp")}
                  width="1400"
                  height="680"
                  preserveAspectRatio="none"
                  clipPath="url(#russia-geographic-clip)"
                />
                <path
                  d={geography.path ?? ""}
                  fill="none"
                  className="journey-coastline"
                  stroke="#859358"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <div className="journey-points" aria-label="Уроки на карте">
              {groups.map((group) => {
                const stop = group.stops[0],
                  isGroup = group.stops.length > 1;
                const completed = !isGroup && isDone(stop);
                const lesson =
                  !isGroup && stop.lessonId
                    ? publishedLessons[stop.lessonId]
                    : undefined;
                const available = Boolean(lesson);
                const labelOffset = labelOffsets.get(stop.id);
                const groupHasLesson =
                  isGroup &&
                  group.stops.some(
                    (item) => isPublished(item) && !isDone(item),
                  );
                const groupHasCompletion = isGroup && group.stops.some(isDone);
                const active =
                  selected &&
                  group.stops.some((item) => item.id === selected.id);
                const label = isGroup
                  ? `Увеличить группу уроков (${group.stops.length})${groupHasLesson ? ". Есть доступный урок" : ""}${groupHasCompletion ? ". Есть пройденный урок" : ""}`
                  : `Урок ${stop.number}. ${lesson ? `${lesson.people}. ` : ""}${completed ? "Пройден" : available ? "Доступен" : "Готовится"}`;
                return (
                  <button
                    key={group.stops.map((item) => item.id).join("-")}
                    ref={
                      group.stops.some((item) => item.lessonId === celebrate)
                        ? celebrationPoint
                        : undefined
                    }
                    className={`journey-point ${isGroup ? "is-group" : ""} ${groupHasLesson ? "has-ready-lesson" : ""} ${groupHasCompletion ? "has-completed-lesson" : ""} ${available ? "is-available" : ""} ${completed ? "is-completed" : ""} ${active ? "is-selected" : ""} ${stamping && celebrate && group.stops.some((item) => item.lessonId === celebrate) ? "is-new-mark" : ""}`}
                    style={
                      {
                        "--point-x": `${((group.x - 700) / 1400) * 100}%`,
                        "--point-y": `${((group.y - 340) / 1400) * width}px`,
                      } as CSSProperties
                    }
                    aria-label={label}
                    aria-pressed={Boolean(active)}
                    aria-controls={active ? "journey-selection" : undefined}
                    title={label}
                    onClick={(e) => revealGroup(group, e.currentTarget)}
                  >
                    <span
                      className="journey-point-face"
                      onAnimationEnd={(event) => {
                        if (event.animationName === "discovery-stamp")
                          onCelebrationEnd();
                      }}
                    >
                      {isGroup ? (
                        <>
                          {group.stops.length}
                          {groupHasCompletion && (
                            <Star size={12} weight="fill" />
                          )}
                        </>
                      ) : completed ? (
                        <Star size={22} weight="fill" />
                      ) : (
                        <QuestionMark size={20} weight="bold" />
                      )}
                    </span>
                    {lesson && labelOffset !== undefined && (
                      <span
                        className="journey-point-label"
                        style={{ marginLeft: labelOffset }}
                      >
                        {lesson.people}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {selected && selectionOffset && (
          <div
            key={selected.id}
            className={`journey-selection ${selectedLesson ? "has-lesson" : ""}`}
            id="journey-selection"
            data-side={selectionOffset.x <= 0 ? "right" : "left"}
            style={
              {
                "--journey-point-x": `${selectionOffset.x}px`,
                "--journey-card-top": `${Math.min(width * 0.6, Math.max(100, width / 3 + selectionOffset.y + 25))}px`,
              } as CSSProperties
            }
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
              aria-label="Закрыть карточку урока"
              onClick={closePanel}
            >
              <X size={24} />
            </button>
            {selectedLesson ? (
              <>
                <img
                  className="journey-guide"
                  src={publicAsset(selectedLesson.heroImage)}
                  alt={selectedLesson.heroName}
                />
                <div>
                  <p className="journey-panel-meta">
                    Урок {selected.number} · {selectedLesson.people}
                  </p>
                  <h3 id="journey-selection-title">{selectedLesson.title}</h3>
                  <p>{selectedLesson.greeting}</p>
                  {done && (
                    <p className="journey-already-done">
                      <Check size={19} />
                      Этот урок уже отмечен как пройденный
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
                  Урок {selected.number}
                  {selected.introduction &&
                    ` · ${selected.introduction.heroName}`}
                </p>
                <h3 id="journey-selection-title">
                  {selected.introduction?.title ?? "Новый урок готовится"}
                </h3>
                <p>
                  Здесь появятся история, задания и материалы урока. Пока можно
                  начать путешествие с уже доступного урока.
                </p>
                {readyStops.length > 0 && (
                  <button
                    className="text-link text-button"
                    onClick={() => selectFromList(readyStops[0])}
                  >
                    Найти доступный урок <ArrowRight size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="journey-map-bottom">
        <div className="journey-legend" aria-label="Условные обозначения">
          <span className="journey-legend-available">
            <span className="legend-available">
              <QuestionMark size={17} weight="bold" />
            </span>
            Урок доступен
          </span>
          <span>
            <span className="legend-pending">
              <QuestionMark size={17} />
            </span>
            Готовится
          </span>
          <span className="journey-legend-completed">
            <Star size={19} weight="fill" />
            Урок пройден
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
            onClick={() => changeZoom(zoom - 0.25)}
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
            onClick={() => changeZoom(zoom + 0.25)}
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
            ? "Нажми на группу точек, чтобы увидеть отдельные уроки."
            : "Нажми на точку, чтобы узнать об уроке."}
      </p>
      <p className="journey-position-note">
        Точки уроков расположены условно. Народы России живут в разных регионах
        страны.
      </p>
      <section
        className="journey-list"
        id="lessons"
        ref={catalogue}
        aria-labelledby="journey-list-title"
      >
        <div className="journey-list-heading">
          <h3 id="journey-list-title">Все уроки</h3>
          <p className="journey-list-count">
            {readyStops.length}{" "}
            {readyStops.length === 1
              ? "урок доступен"
              : readyStops.length >= 2 && readyStops.length <= 4
                ? "урока доступны"
                : "уроков доступны"}
            {readyStops.length < journeyStops.length &&
              " · остальные уроки в разработке"}
          </p>
        </div>
        <div
          className="journey-catalogue-frame"
          data-expanded={catalogueExpanded}
          ref={catalogueFrame}
          id="journey-catalogue-items"
        >
          <ol className="journey-stop-list" ref={catalogueList} role="list">
            {journeyStops.map(renderCatalogueStop)}
          </ol>
        </div>
        {journeyStops.length > previewCount && (
          <button
            type="button"
            className="button outline journey-list-toggle"
            aria-expanded={catalogueExpanded}
            aria-controls="journey-catalogue-items"
            onClick={(event) => {
              setCatalogueExpanded(!catalogueExpanded);
              if (catalogueExpanded) {
                event.currentTarget.focus({ preventScroll: true });
                if ((catalogue.current?.getBoundingClientRect().top ?? 0) < 0) {
                  catalogue.current?.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                  });
                }
              } else if (event.detail === 0) {
                requestAnimationFrame(() => {
                  catalogueList.current?.children[previewCount]
                    ?.querySelector<HTMLElement>("a, button")
                    ?.focus({ preventScroll: true });
                });
              }
            }}
          >
            {catalogueExpanded ? "Свернуть список" : "Показать все уроки"}
            <CaretDown size={19} aria-hidden="true" />
          </button>
        )}
      </section>
    </section>
  );
}
