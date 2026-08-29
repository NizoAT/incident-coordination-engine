import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChangeSelect } from "@/components/causality/change-select";
import { AssigneeSelect } from "@/components/incidents/assignee-select";
import { TimelineSection } from "@/components/incidents/timeline-section";
import { SeverityBadge } from "@/components/incidents/severity-badge";
import { SlaCountdown } from "@/components/incidents/sla-countdown";
import { StatusBadge } from "@/components/incidents/status-badge";
import {
  SeverityFieldLabel,
  SeveritySelect,
} from "@/components/incidents/severity-select";
import {
  linkChangeFormAction,
  registerDeploymentFormAction,
} from "@/lib/causality/actions";
import {
  listLinkedChanges,
  listLinkedDeployments,
  listUnlinkedChangesForIncident,
} from "@/lib/causality/store";
import { CHANGE_STATUS_LABELS, DEPLOYMENT_STATUS_LABELS } from "@/lib/causality/types";
import { listAssignableUsers } from "@/lib/auth/credentials";
import { canAssignIncidents } from "@/lib/auth/rbac";
import { getCurrentUser } from "@/lib/auth/session";
import {
  advanceStatusFormAction,
  assignIncidentFormAction,
  updateSeverityFormAction,
} from "@/lib/incidents/actions";
import { STATUS_LABELS, TRANSITION_LABELS } from "@/lib/incidents/labels";
import { getIncidentForUser } from "@/lib/incidents/store";
import { getPostMortemReport } from "@/lib/postmortem/service";
import {
  canChangeSeverity,
  nextStatus,
} from "@/lib/incidents/transitions";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const incident = await getIncidentForUser(user, id);

  if (!incident) {
    notFound();
  }

  const postMortem = await getPostMortemReport(user, id);
  const linkedChanges = await listLinkedChanges(id);
  const linkedDeployments = await listLinkedDeployments(id);
  const availableChanges = await listUnlinkedChangesForIncident(id);
  const assignableUsers = canAssignIncidents(user)
    ? await listAssignableUsers()
    : [];

  const next = nextStatus(incident.status);
  const severityEditable = canChangeSeverity(incident.status);

  return (
    <div className="space-y-8">
      <Link
        href="/incidents"
        className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← Retour à la liste
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {incident.title}
        </h1>
        {incident.description ? (
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {incident.description}
          </p>
        ) : (
          <p className="text-sm italic text-zinc-500">Pas de description.</p>
        )}
        <p className="text-xs text-zinc-500">
          Créé le {new Date(incident.createdAt).toLocaleString("fr-FR")}
          {incident.createdByEmail ? ` par ${incident.createdByEmail}` : ""} ·
          Mis à jour le {new Date(incident.updatedAt).toLocaleString("fr-FR")}
        </p>
        <p className="text-xs text-zinc-500">
          Assigné :{" "}
          <strong>{incident.assigneeEmail ?? "personne"}</strong>
        </p>
        <p className="text-xs text-zinc-500">
          Version (optimistic lock API) : <strong>{incident.version}</strong>
        </p>
      </header>

      {canAssignIncidents(user) ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Assignation
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Réservé aux leads — émet un événement{" "}
            <code className="text-xs">IncidentAssigned</code>.
          </p>
          <form action={assignIncidentFormAction} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={incident.id} />
            <div className="space-y-2">
              <SeverityFieldLabel htmlFor="assignee">
                Responder assigné
              </SeverityFieldLabel>
              <AssigneeSelect
                id="assignee"
                name="assigneeId"
                users={assignableUsers}
                defaultValue={incident.assigneeId ?? "__unassigned__"}
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Mettre à jour l&apos;assignation
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Contexte causal (M6)
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Changements et déploiements liés — events{" "}
          <code className="text-xs">ChangeLinked</code> /{" "}
          <code className="text-xs">DeploymentDetected</code> avec{" "}
          <code className="text-xs">sourceType</code>.
        </p>

        {linkedChanges.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {linkedChanges.map(({ change, linkedAt }) => (
              <li
                key={change.id}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
              >
                <strong>{change.title}</strong> — {CHANGE_STATUS_LABELS[change.status]}
                {change.externalRef ? ` (${change.externalRef})` : ""}
                <span className="block text-xs text-zinc-500">
                  Lié le {new Date(linkedAt).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">Aucun changement lié.</p>
        )}

        {linkedDeployments.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {linkedDeployments.map(({ deployment, linkedAt }) => (
              <li
                key={deployment.id}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
              >
                Deploy {deployment.version} @ {deployment.environment} —{" "}
                {DEPLOYMENT_STATUS_LABELS[deployment.status]}
                <span className="block text-xs text-zinc-500">
                  {new Date(linkedAt).toLocaleString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <form action={linkChangeFormAction} className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <input type="hidden" name="incidentId" value={incident.id} />
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="change-link">Lier un changement</SeverityFieldLabel>
            <ChangeSelect id="change-link" name="changeId" changes={availableChanges} required />
          </div>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Lier le changement
          </button>
        </form>

        <form action={registerDeploymentFormAction} className="mt-6 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
          <input type="hidden" name="incidentId" value={incident.id} />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Enregistrer un déploiement (manuel — ou webhook GitHub M7)
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <SeverityFieldLabel htmlFor="deploy-version">Version</SeverityFieldLabel>
              <input
                id="deploy-version"
                name="version"
                required
                placeholder="v2.4.1"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="space-y-2">
              <SeverityFieldLabel htmlFor="deploy-env">Environnement</SeverityFieldLabel>
              <input
                id="deploy-env"
                name="environment"
                required
                placeholder="production"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="deploy-status">Résultat</SeverityFieldLabel>
            <select
              id="deploy-status"
              name="status"
              defaultValue="success"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="success">Succès</option>
              <option value="failed">Échec</option>
            </select>
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="deploy-change">Changement associé (optionnel)</SeverityFieldLabel>
            <ChangeSelect id="deploy-change" name="changeId" changes={linkedChanges.map((l) => l.change).concat(availableChanges)} />
          </div>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Enregistrer le déploiement
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          SLA
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Fenêtre calculée depuis la{" "}
          <code className="text-xs">SlaPolicy</code> active — tick scheduler
          in-process (M4).
        </p>
        <SlaCountdown
          deadline={incident.slaDeadline ?? ""}
          storedStatus={incident.slaStatus}
          durationMinutes={incident.slaDurationMinutes}
          active={incident.status === "open" && incident.slaDeadline != null}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Lifecycle
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Statut actuel :{" "}
          <strong>{STATUS_LABELS[incident.status]}</strong>
        </p>
        {next ? (
          <form action={advanceStatusFormAction} className="mt-4">
            <input type="hidden" name="id" value={incident.id} />
            <input type="hidden" name="status" value={next} />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {TRANSITION_LABELS[incident.status]}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
            Incident résolu — aucune transition disponible.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Sévérité
        </h2>
        {severityEditable ? (
          <form action={updateSeverityFormAction} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={incident.id} />
            <div className="space-y-2">
              <SeverityFieldLabel htmlFor="severity-edit">
                Modifier la sévérité
              </SeverityFieldLabel>
              <SeveritySelect
                id="severity-edit"
                name="severity"
                defaultValue={incident.severity}
              />
            </div>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Enregistrer
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Sévérité figée sur un incident résolu.
          </p>
        )}
      </section>

      <TimelineSection
        incidentId={incident.id}
        incidentTitle={incident.title}
        events={postMortem.events}
        causalTimeline={postMortem.causalTimeline}
      />
    </div>
  );
}
