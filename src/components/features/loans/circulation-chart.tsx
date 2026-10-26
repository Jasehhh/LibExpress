"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "~/trpc/react";

const MIN_HEIGHT = 250;
const PAD = { top: 20, right: 12, bottom: 32, left: 32 };
const TOOLTIP = { width: 132, height: 58 };

const SERIES = [
  {
    key: "checkouts",
    label: "Checkouts",
    line: "stroke-chart-out",
    fill: "fill-chart-out",
    swatch: "bg-chart-out",
  },
  {
    key: "returns",
    label: "Returns",
    line: "stroke-chart-back",
    fill: "fill-chart-back",
    swatch: "bg-chart-back",
  },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

const monthShort = new Intl.DateTimeFormat("en-PH", { month: "short" });
const monthLong = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
});

// Round the top of the axis up to 1, 2 or 5 × 10ⁿ per step, five steps.
function niceTicks(max: number) {
  const raw = Math.max(max, 5) / 5;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].find((m) => m * power >= raw)! * power;
  return Array.from({ length: 6 }, (_, i) => i * step);
}

// Monotone cubic curve: smooth like the reference, but it never overshoots
// below zero or above a month's real value.
function smoothPath(points: [number, number][]) {
  if (points.length < 2) return "";
  const n = points.length;
  const dx = points.slice(1).map(([x], i) => x - points[i]![0]);
  const slopes = points
    .slice(1)
    .map(([, y], i) => (y - points[i]![1]) / dx[i]!);
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0]!;
    if (i === n - 1) return slopes[n - 2]!;
    const a = slopes[i - 1]!;
    const b = slopes[i]!;
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });

  let d = `M${points[0]![0]},${points[0]![1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!;
    const [x1, y1] = points[i + 1]!;
    const third = dx[i]! / 3;
    d += `C${x0 + third},${y0 + tangents[i]! * third} ${x1 - third},${y1 - tangents[i + 1]! * third} ${x1},${y1}`;
  }
  return d;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 640, height: MIN_HEIGHT });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height: Math.max(height, MIN_HEIGHT) });
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

export function CirculationChart() {
  const [months] = api.dashboard.circulation.useSuspenseQuery(undefined, {
    refetchInterval: 60_000,
  });
  // The plot fills whatever height the row gives it, so the card matches
  // the live activity card beside it.
  const [ref, { width, height: HEIGHT }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const last = months.length - 1;
  const ticks = niceTicks(
    Math.max(...months.map((m) => Math.max(m.checkouts, m.returns))),
  );
  const top = ticks[ticks.length - 1]!;
  const innerW = Math.max(width - PAD.left - PAD.right, 1);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const step = innerW / Math.max(last, 1);
  const x = (i: number) => PAD.left + i * step;
  const y = (value: number) => PAD.top + innerH - (value / top) * innerH;

  const points = (key: SeriesKey) =>
    months.map((m, i) => [x(i), y(m[key])] as [number, number]);
  const area = (key: SeriesKey) =>
    `${smoothPath(points(key))}L${x(last)},${y(0)}L${x(0)},${y(0)}Z`;

  // The tooltip pins above the busier of the two lines at that month.
  const active = hover === null ? null : months[hover]!;
  const tipX =
    hover === null
      ? 0
      : Math.min(
          Math.max(x(hover) - TOOLTIP.width / 2, PAD.left),
          width - PAD.right - TOOLTIP.width,
        );
  const tipY = active
    ? Math.max(
        y(Math.max(active.checkouts, active.returns)) - TOOLTIP.height - 14,
        0,
      )
    : 0;
  const empty = months.every((m) => m.checkouts + m.returns === 0);

  return (
    <section
      aria-labelledby="circulation-heading"
      className="border-navy-light bg-surface flex flex-col rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="circulation-heading" className="text-navy font-semibold">
          Circulation over the last {months.length} months
        </h2>
        <ul className="flex gap-5 text-sm">
          {SERIES.map((series) => (
            <li key={series.key} className="text-muted flex items-center gap-2">
              <span
                aria-hidden
                className={`size-2 rounded-full ${series.swatch}`}
              />
              {series.label}
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={ref}
        className="relative mt-5 min-h-[250px] flex-1"
        onMouseLeave={() => setHover(null)}
      >
        <svg
          width={width}
          height={HEIGHT}
          aria-hidden
          className="absolute inset-0 block"
        >
          {ticks.map((tick) => (
            <text
              key={tick}
              x={PAD.left - 12}
              y={y(tick)}
              dy="0.32em"
              textAnchor="end"
              className="fill-muted text-[11px] tabular-nums"
            >
              {tick}
            </text>
          ))}
          <line
            x1={PAD.left}
            x2={PAD.left}
            y1={PAD.top}
            y2={y(0)}
            className="stroke-border"
          />
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(0)}
            y2={y(0)}
            className="stroke-border"
          />
          {months.map((m, i) => (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
              className={`text-[12px] ${hover === i ? "fill-navy font-semibold" : "fill-info"}`}
            >
              {monthShort.format(m.month)}
            </text>
          ))}

          <path
            d={area("checkouts")}
            className="fill-chart-out opacity-[0.07]"
          />
          {SERIES.map((series) => (
            <path
              key={series.key}
              d={smoothPath(points(series.key))}
              fill="none"
              className={series.line}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}

          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={y(0)}
                className="stroke-navy/20"
              />
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={x(hover)}
                  cy={y(months[hover]![series.key])}
                  r={5}
                  className={`stroke-surface ${series.fill}`}
                  strokeWidth={2.5}
                />
              ))}
            </>
          )}

          {months.map((_, i) => (
            <rect
              key={i}
              x={x(i) - step / 2}
              y={0}
              width={step}
              height={HEIGHT - PAD.bottom}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}

          {active && (
            <foreignObject
              x={tipX}
              y={tipY}
              width={TOOLTIP.width}
              height={TOOLTIP.height}
              className="pointer-events-none"
            >
              <div className="bg-navy h-full rounded-xl px-3 py-2 text-xs text-white shadow-lg">
                <p className="text-on-navy-muted">
                  {monthLong.format(active.month)}
                </p>
                <p className="mt-1 flex gap-3 font-semibold tabular-nums">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-chart-out size-1.5 rounded-full" />
                    {active.checkouts} out
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-chart-back size-1.5 rounded-full" />
                    {active.returns} in
                  </span>
                </p>
              </div>
            </foreignObject>
          )}
        </svg>

        {empty && (
          <p className="text-muted absolute inset-x-0 top-1/3 text-center text-sm">
            No checkouts or returns in this period yet.
          </p>
        )}
      </div>

      <table className="sr-only">
        <caption>Checkouts and returns by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Checkouts</th>
            <th scope="col">Returns</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m, i) => (
            <tr key={i}>
              <th scope="row">{monthLong.format(m.month)}</th>
              <td>{m.checkouts}</td>
              <td>{m.returns}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
