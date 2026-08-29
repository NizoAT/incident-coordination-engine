import {
  IncidentEventType,
  IncidentStatus,
  Prisma,
  PrismaClient,
  Severity,
  UserRole,
} from "@prisma/client";

import { hashPassword } from "../lib/auth/password";
import { startSlaCycle } from "../lib/sla/service";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo123";

type DemoUser = {
  email: string;
  role: UserRole;
};

const DEMO_USERS: DemoUser[] = [
  { email: "lead@demo.local", role: "lead" },
  { email: "responder@demo.local", role: "responder" },
  { email: "responder2@demo.local", role: "responder" },
];

type SeedIncident = {
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  createdByEmail: string;
  assigneeEmail?: string;
  slaBackdateMinutes?: number;
  events: Array<{
    type: IncidentEventType;
    metadata: Prisma.InputJsonValue;
    actorEmail?: string;
    offsetMinutes: number;
  }>;
};

const DEMO_INCIDENTS: SeedIncident[] = [
  {
    title: "Latence élevée sur l'API recherche",
    description: "P95 > 2s depuis 14h30, impact catalogue.",
    severity: "low",
    status: "open",
    createdByEmail: "lead@demo.local",
    assigneeEmail: "responder@demo.local",
    events: [
      {
        type: "IncidentCreated",
        actorEmail: "lead@demo.local",
        metadata: { title: "Latence élevée sur l'API recherche", severity: "low" },
        offsetMinutes: 45,
      },
      {
        type: "IncidentAssigned",
        actorEmail: "lead@demo.local",
        metadata: { assigneeId: "responder@demo.local", previousAssigneeId: null },
        offsetMinutes: 40,
      },
    ],
  },
  {
    title: "Erreurs 502 sur le service paiement",
    description: "Gateway timeout intermittent, ~5 % des requêtes.",
    severity: "medium",
    status: "acknowledged",
    createdByEmail: "responder@demo.local",
    assigneeEmail: "responder@demo.local",
    events: [
      {
        type: "IncidentCreated",
        actorEmail: "responder@demo.local",
        metadata: {
          title: "Erreurs 502 sur le service paiement",
          severity: "medium",
        },
        offsetMinutes: 120,
      },
      {
        type: "StatusChanged",
        actorEmail: "responder@demo.local",
        metadata: { from: "open", to: "acknowledged" },
        offsetMinutes: 110,
      },
    ],
  },
  {
    title: "Base de données réplication en retard",
    description: "Lag réplica > 30s, risque lectures stale.",
    severity: "high",
    status: "investigating",
    createdByEmail: "lead@demo.local",
    assigneeEmail: "responder2@demo.local",
    events: [
      {
        type: "IncidentCreated",
        actorEmail: "lead@demo.local",
        metadata: {
          title: "Base de données réplication en retard",
          severity: "medium",
        },
        offsetMinutes: 180,
      },
      {
        type: "IncidentAssigned",
        actorEmail: "lead@demo.local",
        metadata: {
          assigneeId: "responder2@demo.local",
          previousAssigneeId: null,
        },
        offsetMinutes: 178,
      },
      {
        type: "StatusChanged",
        actorEmail: "responder2@demo.local",
        metadata: { from: "open", to: "acknowledged" },
        offsetMinutes: 175,
      },
      {
        type: "SeverityChanged",
        actorEmail: "responder2@demo.local",
        metadata: { from: "medium", to: "high" },
        offsetMinutes: 170,
      },
      {
        type: "StatusChanged",
        actorEmail: "responder2@demo.local",
        metadata: { from: "acknowledged", to: "investigating" },
        offsetMinutes: 160,
      },
    ],
  },
  {
    title: "Indisponibilité totale checkout",
    description: "Incident critique résolu après rollback deploy v2.4.1.",
    severity: "critical",
    status: "resolved",
    createdByEmail: "lead@demo.local",
    events: [
      {
        type: "IncidentCreated",
        actorEmail: "lead@demo.local",
        metadata: {
          title: "Indisponibilité totale checkout",
          severity: "critical",
        },
        offsetMinutes: 300,
      },
      {
        type: "StatusChanged",
        actorEmail: "lead@demo.local",
        metadata: { from: "open", to: "acknowledged" },
        offsetMinutes: 295,
      },
      {
        type: "StatusChanged",
        actorEmail: "lead@demo.local",
        metadata: { from: "acknowledged", to: "investigating" },
        offsetMinutes: 280,
      },
      {
        type: "StatusChanged",
        actorEmail: "lead@demo.local",
        metadata: { from: "investigating", to: "resolved" },
        offsetMinutes: 240,
      },
    ],
  },
  {
    title: "Démo SLA: breach automatique",
    description:
      "Incident critical ouvert: deadline passée, le scheduler émet SlaBreached au prochain tick.",
    severity: "critical",
    status: "open",
    createdByEmail: "lead@demo.local",
    assigneeEmail: "responder@demo.local",
    slaBackdateMinutes: 1,
    events: [
      {
        type: "IncidentCreated",
        actorEmail: "lead@demo.local",
        metadata: {
          title: "Démo SLA: breach automatique",
          severity: "critical",
        },
        offsetMinutes: 5,
      },
    ],
  },
];

async function seedUsers() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const users = new Map<string, string>();

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: { passwordHash, role: demo.role },
      create: {
        email: demo.email,
        passwordHash,
        role: demo.role,
      },
    });
    users.set(demo.email, user.id);
  }

  return users;
}

function resolveAssigneeIds(
  metadata: Prisma.InputJsonValue,
  users: Map<string, string>,
): Prisma.InputJsonValue {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return metadata;
  }

  const record = { ...metadata } as Record<string, unknown>;

  if (typeof record.assigneeId === "string" && users.has(record.assigneeId)) {
    record.assigneeId = users.get(record.assigneeId)!;
  }
  if (
    typeof record.previousAssigneeId === "string" &&
    users.has(record.previousAssigneeId)
  ) {
    record.previousAssigneeId = users.get(record.previousAssigneeId)!;
  }

  return record as Prisma.InputJsonValue;
}

async function seedPolicies() {
  const slaPolicies = [
    { severity: "low" as Severity, durationMinutes: 480 },
    { severity: "medium" as Severity, durationMinutes: 240 },
    { severity: "high" as Severity, durationMinutes: 60 },
    { severity: "critical" as Severity, durationMinutes: 15 },
  ];

  for (const policy of slaPolicies) {
    await prisma.slaPolicy.upsert({
      where: { severity: policy.severity },
      update: { durationMinutes: policy.durationMinutes, active: true },
      create: { ...policy, active: true },
    });
  }

  const escalationPolicies = [
    { severity: "high" as Severity, triggerAfterMinutes: 60 },
    { severity: "critical" as Severity, triggerAfterMinutes: 15 },
  ];

  for (const policy of escalationPolicies) {
    await prisma.escalationPolicy.upsert({
      where: { severity: policy.severity },
      update: {
        triggerAfterMinutes: policy.triggerAfterMinutes,
        notifyRole: "lead",
        active: true,
      },
      create: {
        ...policy,
        notifyRole: "lead",
        active: true,
      },
    });
  }
}

async function seedIncident(
  demo: SeedIncident,
  users: Map<string, string>,
): Promise<string> {
  const now = Date.now();
  const sortedEvents = [...demo.events].sort(
    (a, b) => a.offsetMinutes - b.offsetMinutes,
  );
  const createdAt = new Date(
    now - sortedEvents[0]!.offsetMinutes * 60 * 1000,
  );
  const updatedAt = new Date(
    now -
      sortedEvents[sortedEvents.length - 1]!.offsetMinutes * 60 * 1000,
  );

  const createdById = users.get(demo.createdByEmail);
  const assigneeId = demo.assigneeEmail
    ? users.get(demo.assigneeEmail)
    : undefined;

  let incidentId = "";

  await prisma.$transaction(async (tx) => {
    const incident = await tx.incident.create({
      data: {
        title: demo.title,
        description: demo.description,
        severity: demo.severity,
        status: demo.status,
        version: sortedEvents.length,
        createdById,
        assigneeId,
        createdAt,
        updatedAt,
      },
    });

    for (const event of sortedEvents) {
      const actorId = event.actorEmail
        ? users.get(event.actorEmail)
        : undefined;

      await tx.incidentEvent.create({
        data: {
          incidentId: incident.id,
          type: event.type,
          actorId,
          metadata: resolveAssigneeIds(event.metadata, users),
          timestamp: new Date(now - event.offsetMinutes * 60 * 1000),
          sourceType: null,
          sourceId: null,
        },
      });
    }

    incidentId = incident.id;
  });

  if (demo.status === "open") {
    const actorId = createdById ?? null;
    await prisma.$transaction(async (tx) => {
      await startSlaCycle(tx, incidentId, demo.severity, actorId);

      if (demo.slaBackdateMinutes != null) {
        await tx.incident.update({
          where: { id: incidentId },
          data: {
            slaDeadline: new Date(
              Date.now() - demo.slaBackdateMinutes * 60 * 1000,
            ),
            slaStatus: "ok",
          },
        });
      }
    });
  }

  return incidentId;
}

async function seedCausality(users: Map<string, string>) {
  const leadId = users.get("lead@demo.local");
  if (!leadId) {
    return;
  }

  const change = await prisma.change.create({
    data: {
      title: "Release checkout v2.4.1",
      description: "Refactor passerelle paiement: suspectée comme cause du incident checkout.",
      externalRef: "CHG-842",
      status: "completed",
    },
  });

  const checkoutIncident = await prisma.incident.findFirst({
    where: { title: "Indisponibilité totale checkout" },
  });

  if (!checkoutIncident) {
    return;
  }

  await prisma.incidentChange.create({
    data: {
      incidentId: checkoutIncident.id,
      changeId: change.id,
      linkedById: leadId,
    },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId: checkoutIncident.id,
      type: "ChangeLinked",
      actorId: leadId,
      metadata: {
        changeId: change.id,
        changeTitle: change.title,
        externalRef: change.externalRef,
      },
      sourceType: "change",
      sourceId: change.id,
    },
  });

  const deployment = await prisma.deployment.create({
    data: {
      changeId: change.id,
      version: "v2.4.1",
      environment: "production",
      status: "success",
      deployedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  await prisma.incidentDeployment.create({
    data: {
      incidentId: checkoutIncident.id,
      deploymentId: deployment.id,
      linkedById: leadId,
    },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId: checkoutIncident.id,
      type: "DeploymentDetected",
      actorId: leadId,
      metadata: {
        deploymentId: deployment.id,
        version: deployment.version,
        environment: deployment.environment,
        status: deployment.status,
        changeId: change.id,
      },
      sourceType: "deployment",
      sourceId: deployment.id,
    },
  });
}

async function main() {
  await prisma.notificationLog.deleteMany();
  await prisma.escalationDelivery.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.incidentDeployment.deleteMany();
  await prisma.incidentChange.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.change.deleteMany();

  await seedPolicies();
  const users = await seedUsers();

  for (const demo of DEMO_INCIDENTS) {
    await seedIncident(demo, users);
  }

  await seedCausality(users);

  console.log(
    `Seed OK: ${DEMO_USERS.length} utilisateurs, ${DEMO_INCIDENTS.length} incidents, changes/déploiements démo (mot de passe : ${DEMO_PASSWORD}).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
