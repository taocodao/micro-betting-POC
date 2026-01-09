import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { Dispute, TEEValidationResult, Bet, Market } from '../types/index.js';
import { betsService } from './betsService.js';
import { marketsService } from './eventsMarketsService.js';

/**
 * TEE Service
 * Simulates Trusted Execution Environment for dispute resolution
 * In production, this would run in AWS Nitro Enclave
 */
export class TEEService {
    /**
     * Validate a dispute in the TEE
     * Compares bet timing against market close time
     */
    validateDisputeInTEE(betId: string): TEEValidationResult {
        console.log(`[TEE] Validating dispute for bet: ${betId}`);

        const bet = betsService.getBet(betId);
        if (!bet) {
            throw new Error('Bet not found');
        }

        const market = marketsService.getMarket(bet.market_id);
        if (!market) {
            throw new Error('Market not found');
        }

        // Calculate timing
        const betPlacedAt = new Date(bet.placed_at).getTime();
        const marketCloseTime = market.market_close_time
            ? new Date(market.market_close_time).getTime()
            : Date.now();
        const serverReceivedAt = new Date(bet.server_received_at).getTime();

        const latencyMs = bet.latency_ms || (serverReceivedAt - betPlacedAt);
        const timeDiff = serverReceivedAt - marketCloseTime;

        let verdict: 'CORRECT' | 'INCORRECT';
        let details: string;

        if (bet.status === 'rejected') {
            // Bet was rejected - check if rejection was correct
            if (timeDiff > 0) {
                // Server received after market closed - rejection was correct
                verdict = 'CORRECT';
                details = `Bet arrived ${timeDiff}ms after market closed. Rejection was valid.`;
            } else if (timeDiff > -100 && latencyMs > 100) {
                // Close call but latency was high - rejection questionable
                verdict = 'INCORRECT';
                details = `Bet was placed ${-timeDiff}ms before market closed but network latency of ${latencyMs}ms caused late arrival. System error - should have been accepted.`;
            } else {
                // Bet arrived before close but was rejected - system error
                verdict = 'INCORRECT';
                details = `Bet arrived ${-timeDiff}ms before market closed but was rejected. System error.`;
            }
        } else if (bet.status === 'accepted' || bet.status === 'pending') {
            // Bet was accepted/pending - check if acceptance was correct
            if (timeDiff <= 0) {
                verdict = 'CORRECT';
                details = `Bet accepted correctly. Arrived ${-timeDiff}ms before market closed.`;
            } else {
                verdict = 'INCORRECT';
                details = `Bet should have been rejected. Arrived ${timeDiff}ms after market closed.`;
            }
        } else {
            verdict = 'CORRECT';
            details = `Bet status: ${bet.status}. No timing violation detected.`;
        }

        // Generate attestation (simulated TEE signature)
        const attestation = this.generateAttestation(betId, verdict);

        const result: TEEValidationResult = {
            verdict,
            details,
            attestation,
            bet_placed_at: bet.placed_at,
            market_close_time: market.market_close_time || '',
            latency_ms: latencyMs,
        };

        console.log(`[TEE] Verdict: ${verdict} | ${details}`);

        return result;
    }

    /**
     * Generate TEE attestation (simulated)
     * In production, this would be a real SGX/Nitro attestation
     */
    private generateAttestation(betId: string, verdict: string): string {
        const timestamp = new Date().toISOString();
        const data = `${betId}|${verdict}|${timestamp}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Create a dispute and get TEE validation
     */
    createDispute(betId: string, reason: string): Dispute {
        const disputeId = uuidv4();

        // Validate in TEE
        const teeResult = this.validateDisputeInTEE(betId);

        // Store dispute
        const stmt = db.prepare(`
      INSERT INTO disputes (id, bet_id, reason, status, tee_validation_result, resolved_at)
      VALUES (?, ?, ?, 'resolved', ?, datetime('now'))
    `);

        stmt.run(disputeId, betId, reason, JSON.stringify(teeResult));

        return this.getDispute(disputeId)!;
    }

    /**
     * Get dispute by ID
     */
    getDispute(disputeId: string): Dispute | null {
        const stmt = db.prepare('SELECT * FROM disputes WHERE id = ?');
        const dispute = stmt.get(disputeId) as Dispute | undefined;
        return dispute || null;
    }

    /**
     * Get disputes for a bet
     */
    getBetDisputes(betId: string): Dispute[] {
        const stmt = db.prepare('SELECT * FROM disputes WHERE bet_id = ? ORDER BY created_at DESC');
        return stmt.all(betId) as Dispute[];
    }

    /**
     * Get all disputes for an event
     */
    getEventDisputes(eventId: string): Dispute[] {
        const stmt = db.prepare(`
      SELECT d.* FROM disputes d
      JOIN bets b ON d.bet_id = b.bet_id
      JOIN markets m ON b.market_id = m.id
      WHERE m.event_id = ?
      ORDER BY d.created_at DESC
    `);
        return stmt.all(eventId) as Dispute[];
    }
}

// Singleton instance
export const teeService = new TEEService();
