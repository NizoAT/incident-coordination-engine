import {
  CAUSAL_PHASE_LABELS,
  type CausalPhase,
  type CausalTimelineEntry,
} from "@/lib/postmortem/types";

const PHASE_STYLES: Record<CausalPhase, string> = {
  change:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200",
  deployment:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-200",
  incident:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-200",
  sla:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200",
  escalation:
    "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-200",
  resolution:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
};

export function CausalTimeline({ entries }: { entries: CausalTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Aucun événement causal: liez un changement ou un déploiement pour
        enrichir le post-mortem.
      </p>
    );
  }

  return (
    <ol className="mt-4 space-y-0">
      {entries.map((entry, index) => (
        <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < entries.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[7px] top-3 h-full w-px bg-zinc-200 dark:bg-zinc-700"
            />
          ) : null}
          <span
            aria-hidden
            className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${PHASE_STYLES[entry.phase].split(" ")[0]} bg-white dark:bg-zinc-900`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PHASE_STYLES[entry.phase]}`}
              >
                {CAUSAL_PHASE_LABELS[entry.phase]}
              </span>
              {entry.eventType ? (
                <code className="text-[10px] text-zinc-500">{entry.eventType}</code>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              {entry.title}
            </p>
            {entry.description ? (
              <p className="mt-0.5 text-xs text-zinc-500">{entry.description}</p>
            ) : null}
            <time
              dateTime={entry.timestamp}
              className="mt-1 block text-xs text-zinc-500"
            >
              {new Date(entry.timestamp).toLocaleString("fr-FR")}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
