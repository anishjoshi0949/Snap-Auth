/*
  Warnings:

  - You are about to drop the column `userId` on the `OTP` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OTP" DROP CONSTRAINT "OTP_userId_fkey";

-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "userId";
