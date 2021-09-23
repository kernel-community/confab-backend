/*
  Warnings:

  - You are about to drop the column `description` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `endDateTimeTZOffset` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `endDateTimeUnix` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDateTimeTZOffset` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `startDateTimeUnix` on the `Event` table. All the data in the column will be lost.
  - Added the required column `offset` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "description",
DROP COLUMN "endDateTimeTZOffset",
DROP COLUMN "endDateTimeUnix",
DROP COLUMN "startDateTimeTZOffset",
DROP COLUMN "startDateTimeUnix",
ADD COLUMN     "descriptionHtml" TEXT,
ADD COLUMN     "descriptionText" TEXT,
ADD COLUMN     "offset" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "block" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TagsOnPosts" (
    "eventId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "TagsOnPosts_pkey" PRIMARY KEY ("eventId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_id_key" ON "Tag"("id");

-- AddForeignKey
ALTER TABLE "TagsOnPosts" ADD CONSTRAINT "TagsOnPosts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnPosts" ADD CONSTRAINT "TagsOnPosts_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
