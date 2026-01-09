import { config } from '../config/env.js';
import { db } from '../config/database.js';
import { X402PaymentIntent, SettlementRequest, User } from '../types/index.js';
import { traceRegistry } from './traceRegistryService.js';
import { erc8004Service } from './erc8004Service.js';
import { accessControlService } from './accessControlService.js';
import { PIXProcessor, CardProcessor } from '../processors/settlementProcessors.js';

/**
 * Facilitator Service
 * Main orchestrator for X402 payment flow
 * Bridges X402 intent → fiat settlement → on-chain recording
 */
export class FacilitatorService {
    private pixProcessor: PIXProcessor;
    private cardProcessor: CardProcessor;
    private facilitatorId: string;

    constructor() {
        this.pixProcessor = new PIXProcessor(config.processors.pixApiKey);
        this.cardProcessor = new CardProcessor(config.processors.cardApiKey);
        this.facilitatorId = config.x402.facilitatorAddress;
    }

    /**
     * Step 1: Process X402 Payment Intent
     * Called when user submits bet with X-Payment header
     */
    async processPaymentIntent(
        paymentIntent: X402PaymentIntent,
        betData: { betId: string; marketId: string; amount: number },
        userId: string
    ): Promise<{
        traceId: string;
        status: string;
        settlementId: string;
        accessLevel: string;
    }> {
        console.log(`[Facilitator] Processing payment intent from user ${userId}`);

        // Step 1a: Record Intent On-Chain (immutable proof)
        const { traceId, txHash } = traceRegistry.recordIntent(
            paymentIntent.payer,
            paymentIntent.payee,
            paymentIntent.amount,
            paymentIntent.currency
        );

        console.log(`[Facilitator] Intent recorded: ${traceId} | tx: ${txHash.slice(0, 18)}...`);

        // Step 1b: Register in ERC-8004 Validation Registry
        const validationId = erc8004Service.submitValidationRequest({
            traceId,
            agent: this.facilitatorId,
            validation_type: 'PAYMENT_INTENT',
            timestamp: new Date().toISOString(),
            metadata: {
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                bet_id: betData.betId,
            },
        });

        // Update trace with validation ID
        traceRegistry.updateValidationId(traceId, validationId);

        // Step 2: Initiate Fiat Settlement
        const settlementResult = await this.initiateFiatSettlement(
            traceId,
            paymentIntent,
            betData,
            userId
        );

        return {
            traceId,
            status: 'SETTLEMENT_INITIATED',
            settlementId: settlementResult.transaction_id,
            accessLevel: 'PROVISIONAL',
        };
    }

    /**
     * Step 2: Initiate Fiat Settlement
     * Routes to appropriate processor (PIX/Card)
     */
    private async initiateFiatSettlement(
        traceId: string,
        paymentIntent: X402PaymentIntent,
        betData: { betId: string; marketId: string; amount: number },
        userId: string
    ): Promise<{ transaction_id: string; status: string }> {
        console.log(`[Facilitator] Initiating fiat settlement for trace ${traceId}`);

        // Get user's preferred payment method
        const paymentMethod = await this.getUserPaymentMethod(userId);

        // Create fiat request
        const fiatRequest: SettlementRequest = {
            trace_id: traceId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            payer_id: paymentIntent.payer,
            payee_id: paymentIntent.payee,
            reference: betData.betId,
            metadata: {
                user_id: userId,
                bet_id: betData.betId,
                market_id: betData.marketId,
            },
        };

        // Route to appropriate processor
        const processor = paymentMethod === 'card' ? this.cardProcessor : this.pixProcessor;
        const result = await processor.processPayment(fiatRequest);

        console.log(`[Facilitator] Settlement initiated via ${result.processor}: ${result.transaction_id}`);

        return result;
    }

    /**
     * Step 3: Confirm Settlement
     * Called by webhook when fiat processor confirms payment
     */
    async confirmSettlement(
        traceId: string,
        fiatTransactionId: string,
        processor: string
    ): Promise<{
        traceId: string;
        status: string;
        timestamp: string;
        fiatReferenceHash: string;
        accessLevel: string;
    }> {
        console.log(`[Facilitator] Confirming settlement: ${traceId}`);

        const timestamp = new Date().toISOString();

        // Step 3a: Record Settlement On-Chain
        const { txHash, latencyMs } = traceRegistry.recordSettlement(
            traceId,
            fiatTransactionId,
            'CONFIRMED'
        );

        console.log(`[Facilitator] Settlement recorded on-chain: ${txHash.slice(0, 18)}...`);

        // Step 3b: Submit Feedback to ERC-8004 Reputation Registry
        const feedbackId = erc8004Service.submitFeedback({
            traceId,
            agent: this.facilitatorId,
            rating: 1.0, // Perfect score for successful settlement
            feedback_type: 'PAYMENT_SETTLEMENT_SUCCESS',
            timestamp,
            proof: {
                settlement_hash: fiatTransactionId,
                processor,
                latency_ms: latencyMs,
            },
        });

        // Update trace with feedback ID
        traceRegistry.updateFeedbackId(traceId, feedbackId);

        // Get the trace to find user and upgrade access
        const trace = traceRegistry.getTrace(traceId);
        if (trace) {
            // Find user by payer address
            const userStmt = db.prepare('SELECT id FROM users WHERE wallet_address = ? OR id = ?');
            const user = userStmt.get(trace.payer, trace.payer) as { id: string } | undefined;

            if (user) {
                // Upgrade access to FULL
                accessControlService.grantFullAccess(user.id, traceId);

                // Update bet status to accepted
                const betStmt = db.prepare(`
          UPDATE bets 
          SET status = 'accepted', 
              access_level = 'FULL',
              confirmed_at = ?
          WHERE trace_id = ?
        `);
                betStmt.run(timestamp, traceId);
            }
        }

        return {
            traceId,
            status: 'SETTLEMENT_CONFIRMED',
            timestamp,
            fiatReferenceHash: fiatTransactionId,
            accessLevel: 'FULL',
        };
    }

    /**
     * Get user's preferred payment method
     */
    private async getUserPaymentMethod(userId: string): Promise<'pix' | 'card'> {
        const stmt = db.prepare('SELECT preferred_payment_method FROM users WHERE id = ?');
        const user = stmt.get(userId) as { preferred_payment_method: string } | undefined;
        return (user?.preferred_payment_method as 'pix' | 'card') || 'pix';
    }

    /**
     * Get facilitator status
     */
    getStatus(): {
        facilitator_id: string;
        status: string;
        reputation: ReturnType<typeof erc8004Service.verifyFacilitator>;
    } {
        return {
            facilitator_id: this.facilitatorId,
            status: 'ACTIVE',
            reputation: erc8004Service.verifyFacilitator(),
        };
    }
}

// Singleton instance
export const facilitatorService = new FacilitatorService();
