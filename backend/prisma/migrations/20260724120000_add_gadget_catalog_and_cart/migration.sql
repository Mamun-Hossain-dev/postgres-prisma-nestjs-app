CREATE TYPE "ProductCategory" AS ENUM (
  'MOBILE',
  'LAPTOP',
  'TABLET',
  'AUDIO',
  'WATCH',
  'ACCESSORY'
);

ALTER TABLE "products"
ADD COLUMN "slug" TEXT,
ADD COLUMN "sku" TEXT,
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "brand" TEXT,
ADD COLUMN "category" "ProductCategory",
ADD COLUMN "compareAtPrice" DOUBLE PRECISION,
ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "specifications" JSONB;

UPDATE "products"
SET
  "slug" = LOWER(REGEXP_REPLACE(TRIM("title"), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || "id",
  "sku" = 'LEGACY-' || "id",
  "description" = "title",
  "brand" = 'Generic',
  "category" = 'ACCESSORY';

ALTER TABLE "products"
ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "brand" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL;

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_brand_idx" ON "products"("brand");
CREATE INDEX "products_isFeatured_idx" ON "products"("isFeatured");

CREATE TABLE "carts" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
  "id" SERIAL NOT NULL,
  "cartId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carts_userId_key" ON "carts"("userId");
CREATE UNIQUE INDEX "cart_items_cartId_productId_key" ON "cart_items"("cartId", "productId");
CREATE INDEX "cart_items_productId_idx" ON "cart_items"("productId");

ALTER TABLE "carts"
ADD CONSTRAINT "carts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items"
ADD CONSTRAINT "cart_items_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items"
ADD CONSTRAINT "cart_items_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
