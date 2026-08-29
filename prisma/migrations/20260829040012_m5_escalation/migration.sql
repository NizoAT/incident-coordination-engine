-- CreateEnum
CREATE TYPE "EscalationDeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "EscalationDelivery" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "escalationWindowId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "EscalationDeliveryStatus" NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "escalationDeliveryId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EscalationDelivery_idempotencyKey_key" ON "EscalationDelivery"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EscalationDelivery_incidentId_policyId_idx" ON "EscalationDelivery"("incidentId", "policyId");

-- CreateIndex
CREATE INDEX "EscalationDelivery_escalationWindowId_idx" ON "EscalationDelivery"("escalationWindowId");

-- AddForeignKey
ALTER TABLE "EscalationDelivery" ADD CONSTRAINT "EscalationDelivery_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationDelivery" ADD CONSTRAINT "EscalationDelivery_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "EscalationPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_escalationDeliveryId_fkey" FOREIGN KEY ("escalationDeliveryId") REFERENCES "EscalationDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
