import Link from "next/link";
import { redirect } from "next/navigation";

import { SeverityFieldLabel } from "@/components/incidents/severity-select";
import { getCurrentUser } from "@/lib/auth/session";
import { createChangeFormAction } from "@/lib/causality/actions";
import { listChanges, listDeployments } from "@/lib/causality/store";
import { CHANGE_STATUS_LABELS, DEPLOYMENT_STATUS_LABELS } from "@/lib/causality/types";

export const dynamic = "force-dynamic";

export default async function ChangesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const changes = await listChanges();
  const deployments = await listDeployments();

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Nouveau changement
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Registre causal M6: lier ensuite à un incident depuis le détail.
        </p>
        <form action={createChangeFormAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="title">Titre</SeverityFieldLabel>
            <input
              id="title"
              name="title"
              required
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Ex. Refactor API checkout"
            />
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="externalRef">Référence (ticket)</SeverityFieldLabel>
            <input
              id="externalRef"
              name="externalRef"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="CHG-1234"
            />
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="description">Description</SeverityFieldLabel>
            <textarea
              id="description"
              name="description"
              rows={2}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="space-y-2">
            <SeverityFieldLabel htmlFor="status">Statut</SeverityFieldLabel>
            <select
              id="status"
              name="status"
              defaultValue="planned"
              className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {Object.entries(CHANGE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Enregistrer le changement
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Changements enregistrés
        </h2>
        {changes.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Aucun changement pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {changes.map((change) => (
              <li key={change.id} className="px-4 py-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{change.title}</p>
                <p className="text-xs text-zinc-500">
                  {CHANGE_STATUS_LABELS[change.status]}
                  {change.externalRef ? ` · ${change.externalRef}` : ""} ·{" "}
                  {new Date(change.createdAt).toLocaleString("fr-FR")}
                </p>
                {change.description ? (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{change.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm">
          <Link href="/incidents" className="text-zinc-600 underline dark:text-zinc-400">
            ← Retour aux incidents
          </Link>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Déploiements
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Source <code className="text-xs">manual</code> (M6) ou{" "}
          <code className="text-xs">github</code> (webhook M7).
        </p>
        {deployments.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            Aucun déploiement enregistré.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {deployments.map((deployment) => (
              <li key={deployment.id} className="px-4 py-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {deployment.version} @ {deployment.environment} : {" "}
                  {DEPLOYMENT_STATUS_LABELS[deployment.status]}
                </p>
                <p className="text-xs text-zinc-500">
                  source: {deployment.source}
                  {deployment.idempotencyKey
                    ? ` · ${deployment.idempotencyKey}`
                    : ""}{" "}
                  · {new Date(deployment.deployedAt).toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm">
          <Link href="/incidents" className="text-zinc-600 underline dark:text-zinc-400">
            ← Retour aux incidents
          </Link>
        </p>
      </section>
    </div>
  );
}
