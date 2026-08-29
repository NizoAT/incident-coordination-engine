import Link from "next/link";
import { redirect } from "next/navigation";

import { SeverityBadge } from "@/components/incidents/severity-badge";
import { SlaBadge } from "@/components/incidents/sla-badge";
import { StatusBadge } from "@/components/incidents/status-badge";
import {
  SeverityFieldLabel,
  SeveritySelect,
} from "@/components/incidents/severity-select";
import { getCurrentUser } from "@/lib/auth/session";
import { createIncidentFormAction } from "@/lib/incidents/actions";
import { listIncidents } from "@/lib/incidents/store";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const incidents = await listIncidents(user);

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Nouvel incident
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Statut initial : <strong>ouvert</strong>. Visible par vous
          {user.role === "lead" ? " (lead : tous les incidents)" : " et les leads"}.
        </p>
        <form action={createIncidentFormAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="title">Titre</SeverityFieldLabel>
            <input
              id="title"
              name="title"
              required
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Ex. API checkout indisponible"
            />
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="description">
              Description
            </SeverityFieldLabel>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Contexte, impact, liens…"
            />
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="severity">Sévérité</SeverityFieldLabel>
            <SeveritySelect id="severity" name="severity" defaultValue="medium" />
          </div>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Créer l&apos;incident
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Incidents
        </h2>
        {incidents.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Aucun incident visible pour votre compte.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/incidents/${incident.id}`}
                  className="flex flex-col gap-2 px-4 py-4 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/50"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {incident.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(incident.createdAt).toLocaleString("fr-FR")}
                      {incident.assigneeEmail
                        ? ` · assigné à ${incident.assigneeEmail}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                    {incident.status === "open" && incident.slaDeadline ? (
                      <SlaBadge status={incident.slaStatus} />
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
