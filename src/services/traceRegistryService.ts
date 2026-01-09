import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { PaymentTrace } from '../types/index.js';

/**
 * Trace Registry Service
 * Simulates on-chain payment trace recording (Arbitrum/ERC-8004)
 */
export class TraceRegistryService {
    /**
     * Record a payment intent on-chain
     * This is called when user submits X402 header
     */
    recordIntent(
        payer: string,
        payee: string,
        amount: number,
        currency: string
    ): { traceId: string; txHash: string } {
        const traceId = `trace-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
        const intentTimestamp = new Date().toISOString();
        const txHash = `0x${crypto.randomBytes(32).toString('hex')}`; // Simulated tx hash

        const stmt = db.prepare(`
      INSERT INTO payment_traces (
        trace_id, payer, payee, amount, currency, 
        intent_timestamp, settlement_status, blockchain_tx_hash
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `);

        stmt.run(traceId, payer, payee, amount, currency, intentTimestamp, txHash);

        console.log(`[TraceRegistry] Intent recorded: ${traceId} | tx: ${txHash.slice(0, 18)}...`);

        return { traceId, txHash };
    }

    /**
     * Record settlement confirmation on-chain
     * Called when fiat processor confirms payment
     */
    recordSettlement(
        traceId: string,
        fiatTransactionId: string,
        status: 'CONFIRMED' | 'FAILED'
    ): { txHash: string; latencyMs: number } {
        const settlementTimestamp = new Date().toISOString();
        const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

        // Hash fiat reference for privacy
        const fiatReferenceHash = crypto
            .createHash('sha256')
            .update(fiatTransactionId)
            .digest('hex');

        // Get intent timestamp for latency calculation
        const trace = this.getTrace(traceId);
        const intentTime = new Date(trace?.intent_timestamp || Date.now()).getTime();
        const settlementTime = new Date(settlementTimestamp).getTime();
        const latencyMs = settlementTime - intentTime;

        const stmt = db.prepare(`
      UPDATE payment_traces 
      SET settlement_timestamp = ?, 
          fiat_reference_hash = ?, 
          settlement_status = ?
      WHERE trace_id = ?
    `);

        stmt.run(settlementTimestamp, fiatReferenceHash, status, traceId);

        console.log(`[TraceRegistry] Settlement recorded: ${traceId} | status: ${status} | latency: ${latencyMs}ms`);

        return { txHash, latencyMs };
    }

    /**
     * Get complete payment trace
     */
    getTrace(traceId: string): PaymentTrace | null {
        const stmt = db.prepare('SELECT * FROM payment_traces WHERE trace_id = ?');
        const trace = stmt.get(traceId) as PaymentTrace | undefined;
        return trace || null;
    }

    /**
     * Get all traces for a user
     */
    getUserTraces(payerAddress: string): PaymentTrace[] {
        const stmt = db.prepare('SELECT * FROM payment_traces WHERE payer = ? ORDER BY intent_timestamp DESC');
        return stmt.all(payerAddress) as PaymentTrace[];
    }

    /**
     * Verify settlement status
     */
    verifySettlement(traceId: string): { isConfirmed: boolean; latencyMs: number } {
        const trace = this.getTrace(traceId);

        if (!trace) {
            return { isConfirmed: false, latencyMs: 0 };
        }

        const isConfirmed = trace.settlement_status === 'CONFIRMED';

        let latencyMs = 0;
        if (trace.settlement_timestamp && trace.intent_timestamp) {
            const intentTime = new Date(trace.intent_timestamp).getTime();
            const settlementTime = new Date(trace.settlement_timestamp).getTime();
            latencyMs = settlementTime - intentTime;
        }

        return { isConfirmed, latencyMs };
    }

    /**
     * Update trace with ERC-8004 validation ID
     */
    updateValidationId(traceId: string, validationId: string): void {
        const stmt = db.prepare(`
      UPDATE payment_traces 
      SET erc8004_validation_id = ?
      WHERE trace_id = ?
    `);
        stmt.run(validationId, traceId);
    }

    /**
     * Update trace with ERC-8004 feedback ID
     */
    updateFeedbackId(traceId: string, feedbackId: string): void {
        const stmt = db.prepare(`
      UPDATE payment_traces 
      SET erc8004_feedback_id = ?
      WHERE trace_id = ?
    `);
        stmt.run(feedbackId, traceId);
    }
}

// Singleton instance
export const traceRegistry = new TraceRegistryService();
