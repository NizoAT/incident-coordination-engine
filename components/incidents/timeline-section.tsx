"use client";

import { useState } from "react";

import { CausalTimeline } from "@/components/incidents/causal-timeline";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
import type { CausalTimelineEntry } from "@/lib/postmortem/types";
import type { IncidentEvent } from "@/lib/incidents/types";

type FilterMode = "all" | "causal";

export function TimelineSection({
  incidentId,
  incidentTitle,
  events,
  causalTimeline,
}: {
  incidentId: string;
  incidentTitle: string;
  events: IncidentEvent[];
  causalTimeline: CausalTimelineEntry[];
}) {
  const [mode, setMode] = useState<FilterMode>("causal");

  const exportBase = `/api/incidents/${incidentId}/postmortem`;
  const safeSlug = incidentTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Timeline post-mortem (M8)
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Reconstruction causale : Change → Incident → Escalade → Résolution.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`${exportBase}?format=json`}
            download={`postmortem-${safeSlug}.json`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Export JSON
          </a>
          <a
            href={`${exportBase}?format=markdown`}
            download={`postmortem-${safeSlug}.md`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Export Markdown
          </a>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <FilterButton active={mode === "causal"} onClick={() => setMode("causal")}>
          Causale ({causalTimeline.length})
        </FilterButton>
        <FilterButton active={mode === "all"} onClick={() => setMode("all")}>
          Complète ({events.length})
        </FilterButton>
      </div>

      {mode === "causal" ? (
        <CausalTimeline entries={causalTimeline} />
      ) : (
        <IncidentTimeline events={events} />
      )}
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
      }
    >
      {children}
    </button>
  );
}
