import type {
  CheckoutPaymentMethod,
  DeliveryZone,
} from '../interfaces/payment.interface';

const DELIVERY_CHARGE_BDT: Record<DeliveryZone, number> = {
  DHAKA: 60,
  OUTSIDE_DHAKA: 120,
};

export const COD_MINIMUM_DEPOSIT_BDT = 100;

export function getDeliveryCharge(
  deliveryZone: DeliveryZone,
  minorUnit: number,
): number {
  return DELIVERY_CHARGE_BDT[deliveryZone] * minorUnit;
}

export function getPayableAmount(
  paymentMethod: CheckoutPaymentMethod,
  orderTotal: number,
  deliveryCharge: number,
  minorUnit: number,
): number {
  if (paymentMethod === 'CARD') return orderTotal;

  const deposit = Math.max(deliveryCharge, COD_MINIMUM_DEPOSIT_BDT * minorUnit);
  return Math.min(orderTotal, deposit);
}

export function getDueOnDelivery(
  paymentMethod: CheckoutPaymentMethod,
  orderTotal: number,
  payableAmount: number,
): number {
  return paymentMethod === 'CASH_ON_DELIVERY'
    ? Math.max(0, orderTotal - payableAmount)
    : 0;
}
