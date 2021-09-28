/*
  Warnings:

  - You are about to drop the column `offset` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "offset",
DROP COLUMN "timezone",
ALTER COLUMN "startDateTime" SET DATA TYPE TEXT,
ALTER COLUMN "endDateTime" SET DATA TYPE TEXT;
