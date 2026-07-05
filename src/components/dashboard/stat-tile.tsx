/**
 * Stat tile per the dataviz contract:
 * label (sentence case, no colon) · value (semibold, proportional figures) ·
 * optional delta (signed, vs a named period, colored by direction × up-is-good).
 * Text wears text tokens only — no series color on text.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaPeriod,
  upIsGood = true,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaPeriod?: string;
  upIsGood?: boolean;
}) {
  const showDelta = typeof delta === "number" && delta !== 0;
  const isGood = showDelta && (delta! > 0 ? upIsGood : !upIsGood);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {showDelta && (
        <p className="mt-1.5 text-sm">
          <span className={isGood ? "font-medium text-good" : "font-medium text-danger"}>
            {delta! > 0 ? "↑" : "↓"} {Math.abs(delta!)}
          </span>
          {deltaPeriod && <span className="text-muted"> vs {deltaPeriod}</span>}
        </p>
      )}
    </div>
  );
}
