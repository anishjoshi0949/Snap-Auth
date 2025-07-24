/*
  Warnings:

  - You are about to drop the column `email` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `OTP` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "email",
DROP COLUMN "phoneNumber",
ADD COLUMN     "existingField" TEXT;
