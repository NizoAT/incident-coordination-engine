import { CHANGE_STATUS_LABELS, DEPLOYMENT_STATUS_LABELS } from "@/lib/causality/types";
import { SEVERITY_LABELS, STATUS_LABELS } from "@/lib/incidents/labels";

import { CAUSAL_PHASE_LABELS, type PostMortemReport } from "./types";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR");
}

export function postMortemToJson(report: PostMortemReport): string {
  return JSON.stringify(report, null, 2);
}

export function postMortemToMarkdown(report: PostMortemReport): string {
  const { incident, linkedChanges, linkedDeployments, causalTimeline } = report;
  const lines: string[] = [];

  lines.push(`# Post-mortem: ${incident.title}`);
  lines.push("");
  lines.push(`- **ID incident :** \`${incident.id}\``);
  lines.push(`- **Sévérité :** ${SEVERITY_LABELS[incident.severity]}`);
  lines.push(`- **Statut :** ${STATUS_LABELS[incident.status]}`);
  lines.push(`- **Créé le :** ${formatTimestamp(incident.createdAt)}`);
  if (incident.assigneeEmail) {
    lines.push(`- **Assigné :** ${incident.assigneeEmail}`);
  }
  lines.push(`- **Généré le :** ${formatTimestamp(report.generatedAt)}`);
  lines.push("");

  if (incident.description) {
    lines.push("## Résumé");
    lines.push("");
    lines.push(incident.description);
    lines.push("");
  }

  lines.push("## Timeline causale");
  lines.push("");
  lines.push("| Heure | Phase | Événement |");
  lines.push("| ----- | ----- | --------- |");

  if (causalTimeline.length === 0) {
    lines.push("|: |: | Aucun événement causal |");
  } else {
    for (const entry of causalTimeline) {
      const desc = entry.description
        ? `${entry.title}: ${entry.description}`
        : entry.title;
      lines.push(
        `| ${formatTimestamp(entry.timestamp)} | ${CAUSAL_PHASE_LABELS[entry.phase]} | ${desc.replace(/\|/g, "\\|")} |`,
      );
    }
  }

  lines.push("");
  lines.push("## Changements liés");
  lines.push("");

  if (linkedChanges.length === 0) {
    lines.push("_Aucun changement lié._");
  } else {
    for (const { change, linkedAt } of linkedChanges) {
      lines.push(
        `- **${change.title}**: ${CHANGE_STATUS_LABELS[change.status]} (lié le ${formatTimestamp(linkedAt)})`,
      );
    }
  }

  lines.push("");
  lines.push("## Déploiements liés");
  lines.push("");

  if (linkedDeployments.length === 0) {
    lines.push("_Aucun déploiement lié._");
  } else {
    for (const { deployment, linkedAt } of linkedDeployments) {
      lines.push(
        `- **${deployment.version}** @ ${deployment.environment}: ${DEPLOYMENT_STATUS_LABELS[deployment.status]} (déployé le ${formatTimestamp(deployment.deployedAt)}, lié le ${formatTimestamp(linkedAt)})`,
      );
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("_Incident Coordination Engine: export post-mortem M8_");

  return lines.join("\n");
}
