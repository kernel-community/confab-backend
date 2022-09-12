-- DropForeignKey
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_eventId_fkey";

-- DropIndex
DROP INDEX "RSVP_eventId_key";

-- AlterTable
ALTER TABLE "RSVP"
ADD COLUMN     "attendeeEmail" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User"
DROP COLUMN "lastName",
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("email");

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_attendeeEmail_fkey" FOREIGN KEY ("attendeeEmail") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "RSVP_eventId_attendeeEmail_key" ON "RSVP"("eventId", "attendeeEmail");

-- AlterTable
ALTER TABLE "Event" ADD CONSTRAINT "Event_pkey" PRIMARY KEY ("id");
