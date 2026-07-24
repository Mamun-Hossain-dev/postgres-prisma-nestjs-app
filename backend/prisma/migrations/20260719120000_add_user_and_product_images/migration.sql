-- AlterTable
ALTER TABLE "users"
ADD COLUMN "profileImageUrl" TEXT,
ADD COLUMN "profileImagePublicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_profileImagePublicId_key"
ON "users"("profileImagePublicId");

-- CreateTable
CREATE TABLE "product_images" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_images_publicId_key"
ON "product_images"("publicId");

-- CreateIndex
CREATE INDEX "product_images_productId_idx"
ON "product_images"("productId");

-- AddForeignKey
ALTER TABLE "product_images"
ADD CONSTRAINT "product_images_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
