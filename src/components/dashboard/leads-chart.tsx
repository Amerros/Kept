"use client";

import { useState } from "react";
import { formatDay } from "@/lib/format";

/**
 * Leads per day, last 14 days. Single series → no legend (the title names it).
 * Mark specs: bars ≤24px, 4px rounded data-end / square baseline, 2px surface
 * gaps between neighbors, hairline solid gridlines, clean y ticks, per-bar
 * hover tooltip with a full-height hit target.
 */
export function LeadsChart({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 560;
  const H = 170;
  const PAD_L = 26;
  const PAD_B = 22;
  const PAD_T = 12;
  const plotW = W - PAD_L - 8;
  const plotH = H - PAD_T - PAD_B;

  const max = Math.max(...data.map((d) => d.count), 1);
  // Clean tick ceiling: next multiple of 2 or 5.
  const niceMax = max <= 4 ? 4 : max <= 8 ? 8 : Math.ceil(max / 5) * 5;
  const ticks = [0, niceMax / 2, niceMax];

  const slot = plotW / data.length;
  const barW = Math.min(24, slot - 2); // ≤24px, ≥2px gap between neighbors
  const y = (v: number) => PAD_T + plotH * (1 - v / niceMax);
  const baseline = PAD_T + plotH;

  return (
    <div className="relative rounded-2xl border border-hairline bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">New leads · last 14 days</h3>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Bar chart of new leads per day over the last 14 days"
      >
        {/* hairline gridlines + y ticks */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              x2={W - 8}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--grid)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 7}
              y={y(t) + 3.5}
              textAnchor="end"
              fontSize={10.5}
              fill="var(--muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* bars: rounded data-end, square baseline */}
        {data.map((d, i) => {
          const x = PAD_L + slot * i + (slot - barW) / 2;
          const top = y(d.count);
          const r = Math.min(4, barW / 2, Math.max(baseline - top, 0));
          const path =
            d.count === 0
              ? ""
              : `M ${x} ${baseline}
                 L ${x} ${top + r}
                 Q ${x} ${top} ${x + r} ${top}
                 L ${x + barW - r} ${top}
                 Q ${x + barW} ${top} ${x + barW} ${top + r}
                 L ${x + barW} ${baseline} Z`;
          return (
            <g key={d.date}>
              {path && (
                <path
                  d={path}
                  fill="var(--accent)"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {/* full-height hit target for hover */}
              <rect
                x={PAD_L + slot * i}
                y={PAD_T}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {/* x labels: first, middle, last only — recessive axis */}
              {(i === 0 || i === 7 || i === data.length - 1) && (
                <text
                  x={PAD_L + slot * i + slot / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill="var(--muted)"
                >
                  {formatDay(d.date)}
                </text>
              )}
            </g>
          );
        })}

        {/* baseline */}
        <line
          x1={PAD_L}
          x2={W - 8}
          y1={baseline}
          y2={baseline}
          stroke="var(--baseline)"
          strokeWidth={1}
        />
      </svg>

      {/* tooltip */}
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-hairline bg-raised px-3 py-1.5 text-xs shadow-md"
          style={{
            left: `${((PAD_L + slot * hover + slot / 2) / W) * 100}%`,
            top: 34,
          }}
        >
          <span className="font-semibold text-ink">{data[hover].count}</span>{" "}
          <span className="text-ink-2">
            {data[hover].count === 1 ? "lead" : "leads"} · {formatDay(data[hover].date)}
          </span>
        </div>
      )}
    </div>
  );
}
