import type { JourneyStop } from "../content/journey-stops";

export type StopGroup = { stops: JourneyStop[]; x: number; y: number };

const labelWidth = 82;
const labelHeight = 33;
const labelTop = 20;

export function mapLabelOffsets(groups: StopGroup[], scale: number) {
  const points = groups.map((group) => ({
    group,
    x: group.x * scale,
    y: group.y * scale,
    radius: group.stops.length > 1 ? 19 : 18,
  }));
  const labels: { x: number; y: number }[] = [];
  const offsets = new Map<string, number>();

  for (const point of points) {
    const [stop] = point.group.stops;
    if (point.group.stops.length !== 1 || !stop.lessonId) continue;

    const y = point.y + labelTop;
    for (const offset of [0, -12, 12]) {
      const x = point.x + offset;
      const overlapsMarker = points.some(
        (other) =>
          Math.abs(x - other.x) < labelWidth / 2 + other.radius &&
          y < other.y + other.radius &&
          y + labelHeight > other.y - other.radius,
      );
      const overlapsLabel = labels.some(
        (label) =>
          Math.abs(x - label.x) < labelWidth + 2 &&
          Math.abs(y - label.y) < labelHeight + 2,
      );
      if (overlapsMarker || overlapsLabel) continue;

      offsets.set(stop.id, offset);
      labels.push({ x, y });
      break;
    }
  }
  return offsets;
}

/** Merge nearby screen-space targets until each group has a distinct touch target. */
export function groupStops(
  stops: JourneyStop[],
  canvasWidth: number,
  zoom: number,
): StopGroup[] {
  const groups = stops.map((stop) => ({ stops: [stop], x: stop.x, y: stop.y }));
  const scale = (Math.max(1, canvasWidth) / 1400) * zoom;
  let joined = true;
  while (joined) {
    joined = false;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i],
          b = groups[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) * scale < 53) {
          const combined = [...a.stops, ...b.stops];
          groups[i] = {
            stops: combined,
            x: combined.reduce((sum, p) => sum + p.x, 0) / combined.length,
            y: combined.reduce((sum, p) => sum + p.y, 0) / combined.length,
          };
          groups.splice(j, 1);
          joined = true;
          break outer;
        }
      }
    }
  }
  return groups;
}

export function clampPan(
  pan: { x: number; y: number },
  width: number,
  zoom: number,
) {
  const maxX = (width * (zoom - 1)) / 2;
  const maxY = (((width * 680) / 1400) * (zoom - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, pan.x)),
    y: Math.max(-maxY, Math.min(maxY, pan.y)),
  };
}

export type MapView = { zoom: number; pan: { x: number; y: number } };
export type MapPoint = { x: number; y: number };

/** Keep the same map position beneath a moving pinch midpoint. */
export function zoomAround(
  start: MapView,
  value: number,
  anchor: MapPoint,
  midpoint: MapPoint,
  width: number,
): MapView {
  const zoom = Math.max(1, Math.min(3.5, value));
  const ratio = zoom / start.zoom;
  return {
    zoom,
    pan: clampPan(
      {
        x: midpoint.x - (anchor.x - start.pan.x) * ratio,
        y: midpoint.y - (anchor.y - start.pan.y) * ratio,
      },
      width,
      zoom,
    ),
  };
}
