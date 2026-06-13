-- AlterTable
ALTER TABLE "AgentProfile" ADD COLUMN     "manageCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "BookingRequest" ADD COLUMN     "managerAgentId" TEXT;

-- CreateTable
CREATE TABLE "BookingMessage" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readByStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMilestone" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "dueDate" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingMessage_bookingId_idx" ON "BookingMessage"("bookingId");

-- CreateIndex
CREATE INDEX "BookingMilestone_bookingId_idx" ON "BookingMilestone"("bookingId");

-- CreateIndex
CREATE INDEX "BookingRequest_managerAgentId_idx" ON "BookingRequest"("managerAgentId");

-- AddForeignKey
ALTER TABLE "BookingRequest" ADD CONSTRAINT "BookingRequest_managerAgentId_fkey" FOREIGN KEY ("managerAgentId") REFERENCES "AgentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMessage" ADD CONSTRAINT "BookingMessage_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMilestone" ADD CONSTRAINT "BookingMilestone_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
