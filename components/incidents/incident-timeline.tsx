import type { IncidentEvent } from "@/lib/incidents/types";
import { formatEventDescription } from "@/lib/incidents/event-labels";

export function IncidentTimeline({ events }: { events: IncidentEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Aucun événement enregistré.
      </p>
    );
  }

  return (
    <ol className="mt-4 space-y-0">
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < events.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[7px] top-3 h-full w-px bg-zinc-200 dark:bg-zinc-700"
            />
          ) : null}
          <span
            aria-hidden
            className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-zinc-400 bg-white dark:border-zinc-500 dark:bg-zinc-900"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-900 dark:text-zinc-100">
              {formatEventDescription(event.type, event.metadata)}
            </p>
            <time
              dateTime={event.timestamp}
              className="mt-1 block text-xs text-zinc-500"
            >
              {new Date(event.timestamp).toLocaleString("fr-FR")}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
