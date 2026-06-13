-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "areaId" TEXT;

-- AlterTable
ALTER TABLE "ServiceProvider" ADD COLUMN     "areaId" TEXT;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "areaId" TEXT;

-- CreateIndex
CREATE INDEX "Driver_areaId_idx" ON "Driver"("areaId");

-- CreateIndex
CREATE INDEX "ServiceProvider_areaId_idx" ON "ServiceProvider"("areaId");

-- CreateIndex
CREATE INDEX "Transfer_areaId_idx" ON "Transfer"("areaId");

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE CASCADE;
