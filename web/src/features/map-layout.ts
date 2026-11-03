import type { JourneyStop } from "../content/journey-stops";

export type StopGroup = { stops: JourneyStop[]; x: number; y: number };

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
