CREATE TYPE "CheckoutPaymentMethod" AS ENUM ('CARD', 'CASH_ON_DELIVERY');
CREATE TYPE "DeliveryZone" AS ENUM ('DHAKA', 'OUTSIDE_DHAKA');

ALTER TYPE "OrderStatus" ADD VALUE 'COD_CONFIRMED';

ALTER TABLE "orders"
ADD COLUMN "paymentMethod" "CheckoutPaymentMethod" NOT NULL DEFAULT 'CARD',
ADD COLUMN "deliveryZone" "DeliveryZone" NOT NULL DEFAULT 'DHAKA',
ADD COLUMN "subtotalAmount" INTEGER,
ADD COLUMN "deliveryCharge" INTEGER NOT NULL DEFAULT 0;

UPDATE "orders" SET "subtotalAmount" = "totalAmount";

ALTER TABLE "orders" ALTER COLUMN "subtotalAmount" SET NOT NULL;
