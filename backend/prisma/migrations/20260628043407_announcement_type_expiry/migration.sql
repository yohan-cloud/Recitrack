-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('NORMAL', 'IMPORTANT', 'REMINDER', 'ASSIGNMENT');

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "type" "AnnouncementType" NOT NULL DEFAULT 'NORMAL';
