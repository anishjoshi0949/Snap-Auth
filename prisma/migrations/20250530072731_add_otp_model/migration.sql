-- AlterTable
ALTER TABLE "OTP" ALTER COLUMN "attempts" SET DEFAULT 0,
ALTER COLUMN "attempts" DROP DEFAULT;
DROP SEQUENCE "otp_attempts_seq";
