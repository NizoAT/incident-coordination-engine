-- CreateEnum
CREATE TYPE "ChangeStatus" AS ENUM ('planned', 'in_progress', 'completed', 'rolled_back');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('success', 'failed');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IncidentEventType" ADD VALUE 'ChangeLinked';
ALTER TYPE "IncidentEventType" ADD VALUE 'DeploymentDetected';

-- CreateTable
CREATE TABLE "Change" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "externalRef" TEXT,
    "status" "ChangeStatus" NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "changeId" TEXT,
    "version" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" "DeploymentStatus" NOT NULL,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentChange" (
    "incidentId" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedById" TEXT,

    CONSTRAINT "IncidentChange_pkey" PRIMARY KEY ("incidentId","changeId")
);

-- CreateTable
CREATE TABLE "IncidentDeployment" (
    "incidentId" TEXT NOT NULL,
    "deploymentId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedById" TEXT,

    CONSTRAINT "IncidentDeployment_pkey" PRIMARY KEY ("incidentId","deploymentId")
);

-- CreateIndex
CREATE INDEX "Deployment_changeId_idx" ON "Deployment"("changeId");

-- CreateIndex
CREATE INDEX "Deployment_deployedAt_idx" ON "Deployment"("deployedAt");

-- CreateIndex
CREATE INDEX "IncidentChange_changeId_idx" ON "IncidentChange"("changeId");

-- CreateIndex
CREATE INDEX "IncidentDeployment_deploymentId_idx" ON "IncidentDeployment"("deploymentId");

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "Change"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentChange" ADD CONSTRAINT "IncidentChange_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentChange" ADD CONSTRAINT "IncidentChange_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentDeployment" ADD CONSTRAINT "IncidentDeployment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentDeployment" ADD CONSTRAINT "IncidentDeployment_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
