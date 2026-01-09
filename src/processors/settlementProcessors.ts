import { v4 as uuidv4 } from 'uuid';
import { SettlementRequest, SettlementResponse } from '../types/index.js';

/**
 * PIX Payment Processor (Simulated)
 * Brazilian instant payment system - typically settles in 1-5 minutes
 */
export class PIXProcessor {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Process payment via PIX
     * Simulates 3-5 second settlement for demo
     */
    async processPayment(request: SettlementRequest): Promise<SettlementResponse> {
        console.log(`[PIX] Processing ${request.amount} ${request.currency} | trace: ${request.trace_id}`);

        // Simulate PIX processing delay (3-5 seconds)
        await this.simulateProcessingDelay();

        const transactionId = `pix-${Date.now()}-${uuidv4().slice(0, 8)}`;

        console.log(`[PIX] Payment initiated: ${transactionId}`);

        // Schedule confirmation webhook (simulated)
        this.scheduleConfirmation(request.trace_id, transactionId);

        return {
            transaction_id: transactionId,
            status: 'PENDING',
            expected_confirmation: '5 seconds',
            processor: 'PIX',
        };
    }

    /**
     * Simulate processing delay
     */
    private async simulateProcessingDelay(): Promise<void> {
        const delay = 1000 + Math.random() * 2000; // 1-3 seconds
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     * Schedule a confirmation callback (simulates webhook from processor)
     */
    private scheduleConfirmation(traceId: string, transactionId: string): void {
        // In a real system, the processor would call our webhook
        // For PoC, we simulate this after a delay
        setTimeout(() => {
            console.log(`[PIX] Confirmation ready for: ${transactionId}`);
            // The actual confirmation is triggered by the webhook route
        }, 2000 + Math.random() * 3000); // 2-5 seconds
    }

    /**
     * Handle confirmation webhook from PIX processor
     */
    handleConfirmationWebhook(webhookData: {
        trace_id: string;
        transaction_id: string;
    }): {
        trace_id: string;
        fiat_transaction_id: string;
        processor: string;
        status: 'CONFIRMED';
    } {
        console.log(`[PIX] Confirmation received: ${webhookData.transaction_id}`);

        return {
            trace_id: webhookData.trace_id,
            fiat_transaction_id: webhookData.transaction_id,
            processor: 'PIX',
            status: 'CONFIRMED',
        };
    }
}

/**
 * Card Payment Processor (Simulated)
 * Credit/debit card processing - typically near-instant
 */
export class CardProcessor {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Process payment via card
     * Simulates 1-2 second settlement for demo
     */
    async processPayment(request: SettlementRequest): Promise<SettlementResponse> {
        console.log(`[Card] Processing ${request.amount} ${request.currency} | trace: ${request.trace_id}`);

        // Simulate card processing delay (1-2 seconds)
        await this.simulateProcessingDelay();

        const transactionId = `card-${Date.now()}-${uuidv4().slice(0, 8)}`;

        console.log(`[Card] Payment initiated: ${transactionId}`);

        // Schedule confirmation webhook (simulated)
        this.scheduleConfirmation(request.trace_id, transactionId);

        return {
            transaction_id: transactionId,
            status: 'PENDING',
            expected_confirmation: '3 seconds',
            processor: 'CARD',
        };
    }

    /**
     * Simulate processing delay
     */
    private async simulateProcessingDelay(): Promise<void> {
        const delay = 500 + Math.random() * 1500; // 0.5-2 seconds
        await new Promise((resolve) => setTimeout(resolve, delay));
    }

    /**
     * Schedule a confirmation callback
     */
    private scheduleConfirmation(traceId: string, transactionId: string): void {
        setTimeout(() => {
            console.log(`[Card] Confirmation ready for: ${transactionId}`);
        }, 1000 + Math.random() * 2000); // 1-3 seconds
    }

    /**
     * Handle confirmation webhook from card processor
     */
    handleConfirmationWebhook(webhookData: {
        trace_id: string;
        transaction_id: string;
    }): {
        trace_id: string;
        fiat_transaction_id: string;
        processor: string;
        status: 'CONFIRMED';
    } {
        console.log(`[Card] Confirmation received: ${webhookData.transaction_id}`);

        return {
            trace_id: webhookData.trace_id,
            fiat_transaction_id: webhookData.transaction_id,
            processor: 'CARD',
            status: 'CONFIRMED',
        };
    }
}
