import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentAdapter } from './interfaces/payment-adapter.interface';
import { ChapaPaymentAdapter } from './adapters/chapa.payment.adapter';
import { MockPaymentAdapter } from './adapters/mock.payment.adapter';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private adapters: Map<string, PaymentAdapter> = new Map();
    private defaultProvider: string;

    constructor(private configService: ConfigService) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';

        // Initialize adapters
        this.adapters.set('chapa', new ChapaPaymentAdapter(configService));
        this.adapters.set('mock', new MockPaymentAdapter());

        // Set default
        this.defaultProvider = this.configService.get('DEFAULT_PAYMENT_PROVIDER') || (isProduction ? 'chapa' : 'mock');

        this.logger.log(`PaymentService initialized with default provider: ${this.defaultProvider}`);
    }

    getAdapter(providerName?: string): PaymentAdapter {
        const provider = providerName || this.defaultProvider;
        const adapter = this.adapters.get(provider);

        if (!adapter) {
            this.logger.warn(`Provider ${provider} not found, falling back to mock`);
            return this.adapters.get('mock')!;
        }

        return adapter;
    }

    // Convenience methods that use default adapter
    async initializePayment(params: Parameters<PaymentAdapter['initializePayment']>[0]) {
        return this.getAdapter().initializePayment(params);
    }

    async verifyPayment(reference: string) {
        return this.getAdapter().verifyPayment(reference);
    }

    async executePayout(params: Parameters<PaymentAdapter['executePayout']>[0]) {
        return this.getAdapter().executePayout(params);
    }
}
