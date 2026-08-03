import {
  getDeliveryCharge,
  getDueOnDelivery,
  getPayableAmount,
} from './checkout-amount.util';

describe('checkout amount helpers', () => {
  const minorUnit = 100;

  it('uses a BDT 100 COD deposit inside Dhaka and credits it to the order', () => {
    const deliveryCharge = getDeliveryCharge('DHAKA', minorUnit);
    const payableAmount = getPayableAmount(
      'CASH_ON_DELIVERY',
      2_196_000,
      deliveryCharge,
      minorUnit,
    );

    expect(deliveryCharge).toBe(6_000);
    expect(payableAmount).toBe(10_000);
    expect(getDueOnDelivery('CASH_ON_DELIVERY', 2_196_000, payableAmount)).toBe(
      2_186_000,
    );
  });

  it('keeps the larger outside-Dhaka delivery charge as the COD deposit', () => {
    const deliveryCharge = getDeliveryCharge('OUTSIDE_DHAKA', minorUnit);

    expect(
      getPayableAmount(
        'CASH_ON_DELIVERY',
        2_202_000,
        deliveryCharge,
        minorUnit,
      ),
    ).toBe(12_000);
  });

  it('charges the exact order total for card payments', () => {
    expect(getPayableAmount('CARD', 125_000, 6_000, minorUnit)).toBe(125_000);
    expect(getDueOnDelivery('CARD', 125_000, 125_000)).toBe(0);
  });
});
