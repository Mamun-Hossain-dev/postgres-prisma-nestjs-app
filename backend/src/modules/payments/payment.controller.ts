import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/utils/api-response.util';
import type { PublicUser } from '../users/interfaces/user.interface';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { PaymentService } from './payment.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { AppException } from '../../common/exceptions/app.exception';
import { PaymentRpcClient } from './rpc/payment-rpc.client';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: PaymentWebhookService,
    private readonly paymentRpcClient: PaymentRpcClient,
  ) {}

  @Post('checkout')
  @ResponseMessage('Checkout session created')
  createCheckout(
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.paymentRpcClient.process({
      customer: { id: user.id, name: user.name, email: user.email },
      idempotencyKey: dto.idempotencyKey,
      items: dto.items,
      options: {
        paymentMethod: dto.paymentMethod,
        deliveryZone: dto.deliveryZone,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        customerPhone: dto.customerPhone,
        deliveryAddressLine: dto.deliveryAddressLine,
        deliveryArea: dto.deliveryArea,
        deliveryCity: dto.deliveryCity,
        ...(dto.deliveryPostalCode
          ? { deliveryPostalCode: dto.deliveryPostalCode }
          : {}),
        ...(dto.couponCode ? { couponCode: dto.couponCode } : {}),
      },
    });
  }

  @Get(':id')
  @ResponseMessage('Payment fetched successfully')
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentService.getPayment(user.id, id);
  }

  @Get(':id/session')
  @ResponseMessage('Payment session fetched successfully')
  getSession(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentService.getCheckoutSession(user.id, id);
  }

  @Public()
  @Post('webhooks/stripe')
  @ResponseMessage('Webhook processed')
  async stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!request.rawBody || !signature) {
      throw new AppException('Stripe webhook payload is invalid', {
        code: 'INVALID_WEBHOOK_PAYLOAD',
        status: 400,
      });
    }
    const event = this.webhookService.handle(request.rawBody, signature);
    if (event.type.startsWith('refund.')) {
      await this.paymentService.processRefundWebhook(event);
      return null;
    }
    await this.webhookService.handleVerified(event);
    return null;
  }
}
