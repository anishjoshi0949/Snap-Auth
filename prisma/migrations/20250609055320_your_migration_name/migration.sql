/*
  Warnings:

  - You are about to drop the column `existingField` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `fillupField` on the `OTP` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "existingField",
DROP COLUMN "fillupField",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phoneNumber" TEXT;
