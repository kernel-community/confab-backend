/*
  Warnings:

  - You are about to drop the column `block` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `sendReminders` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TagsOnPosts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TagsOnPosts" DROP CONSTRAINT "TagsOnPosts_eventId_fkey";

-- DropForeignKey
ALTER TABLE "TagsOnPosts" DROP CONSTRAINT "TagsOnPosts_tagId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "Notes" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "block",
DROP COLUMN "sendReminders";

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "TagsOnPosts";
