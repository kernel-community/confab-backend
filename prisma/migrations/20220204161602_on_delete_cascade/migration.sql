-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_proposerEmail_fkey";

-- DropForeignKey
ALTER TABLE "GoogleCalendar" DROP CONSTRAINT "GoogleCalendar_eventId_fkey";

-- DropForeignKey
ALTER TABLE "RSVP" DROP CONSTRAINT "RSVP_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Slack" DROP CONSTRAINT "Slack_eventId_fkey";

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_proposerEmail_fkey" FOREIGN KEY ("proposerEmail") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleCalendar" ADD CONSTRAINT "GoogleCalendar_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slack" ADD CONSTRAINT "Slack_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
