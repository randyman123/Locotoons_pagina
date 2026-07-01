import { Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.enum';

@Injectable()
export class PaymentsService {
  getAvailableProviders() {
    return [
      PaymentProvider.MercadoPago,
      PaymentProvider.Webpay,
      PaymentProvider.Flow,
    ];
  }
}
