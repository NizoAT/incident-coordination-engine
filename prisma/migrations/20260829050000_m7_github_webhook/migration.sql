-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "githubDeploymentId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_idempotencyKey_key" ON "Deployment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Deployment_source_idx" ON "Deployment"("source");
