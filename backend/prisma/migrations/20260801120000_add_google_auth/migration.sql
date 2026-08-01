ALTER TABLE "users"
ALTER COLUMN "password" DROP NOT NULL,
ADD COLUMN "googleId" TEXT;

CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
