ALTER TABLE "Member"
ADD COLUMN "invitationTokenHash" TEXT,
ADD COLUMN "invitationExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Member_invitationTokenHash_key"
ON "Member"("invitationTokenHash");
