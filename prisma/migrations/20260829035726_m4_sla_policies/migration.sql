-- CreateEnum
CREATE TYPE "SlaStatus" AS ENUM ('ok', 'warning', 'breached');

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "slaCycleId" TEXT,
ADD COLUMN     "slaDeadline" TIMESTAMP(3),
ADD COLUMN     "slaStatus" "SlaStatus" NOT NULL DEFAULT 'ok';

-- CreateTable
CREATE TABLE "SlaPolicy" (
    "id" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationPolicy" (
    "id" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "triggerAfterMinutes" INTEGER NOT NULL,
    "notifyRole" "UserRole" NOT NULL DEFAULT 'lead',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscalationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlaPolicy_severity_key" ON "SlaPolicy"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "EscalationPolicy_severity_key" ON "EscalationPolicy"("severity");

-- CreateIndex
CREATE INDEX "Incident_slaDeadline_slaStatus_status_idx" ON "Incident"("slaDeadline", "slaStatus", "status");
