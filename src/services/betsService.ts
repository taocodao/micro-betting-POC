import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { Bet, X402PaymentIntent } from '../types/index.js';
import { marketsService, eventsService } from './eventsMarketsService.js';
import { facilitatorService } from './facilitatorService.js';
import { accessControlService } from './accessControlService.js';

/**
 * Bets Service
 * Handles bet placement with latency measurement and X402 payment
 */
export class BetsService {
    /**
     * Place a bet with X402 payment
     */
    async placeBet(
        userId: string,
        marketId: string,
        amount: number,
        odds: number,
        clientPlacedAt: string,
        paymentIntent: X402PaymentIntent
    ): Promise<{
        bet: Bet;
        payment: {
            traceId: string;
            status: string;
            settlementId: string;
            accessLevel: string;
        };
        latencyMs: number;
        accepted: boolean;
        reason?: string;
    }> {
        const serverReceivedAt = new Date().toISOString();
        const betId = `bet-${Date.now()}-${uuidv4().slice(0, 8)}`;

        // Calculate latency
        const clientTime = new Date(clientPlacedAt).getTime();
        const serverTime = new Date(serverReceivedAt).getTime();
        const latencyMs = serverTime - clientTime;

        // Check if market is open
        const marketCheck = marketsService.isMarketOpen(marketId);

        // Get market for event ID and frame hash
        const market = marketsService.getMarket(marketId);
        if (!market) {
            throw new Error('Market not found');
        }

        // Get latest video frame hash
        const videoFrameHash = eventsService.getLatestFrameHash(market.event_id);

        // Generate odds hash
        const oddsHash = crypto
            .createHash('sha256')
            .update(`${marketId}-${odds}-${serverReceivedAt}`)
            .digest('hex');

        // If market is closed, reject bet
        if (!marketCheck.isOpen) {
            const rejectedBet = this.createBetRecord({
                betId,
                userId,
                marketId,
                amount,
                odds,
                status: 'rejected',
                placedAt: clientPlacedAt,
                serverReceivedAt,
                latencyMs,
                videoFrameHash,
                oddsHash,
            });

            return {
                bet: rejectedBet,
                payment: { traceId: '', status: 'NOT_INITIATED', settlementId: '', accessLevel: 'NONE' },
                latencyMs,
                accepted: false,
                reason: marketCheck.reason,
            };
        }

        // Check user balance
        const userStmt = db.prepare('SELECT balance FROM users WHERE id = ?');
        const user = userStmt.get(userId) as { balance: number } | undefined;

        if (!user || user.balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Deduct balance
        const deductStmt = db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?');
        deductStmt.run(amount, userId);

        // Process X402 payment
        const paymentResult = await facilitatorService.processPaymentIntent(
            paymentIntent,
            { betId, marketId, amount },
            userId
        );

        // Grant provisional access
        accessControlService.grantProvisionalAccess(userId, paymentResult.traceId, betId);

        // Create bet record
        const bet = this.createBetRecord({
            betId,
            userId,
            marketId,
            amount,
            odds,
            status: 'pending',
            placedAt: clientPlacedAt,
            serverReceivedAt,
            latencyMs,
            videoFrameHash,
            oddsHash,
            traceId: paymentResult.traceId,
            settlementId: paymentResult.settlementId,
        });

        console.log(`[Bets] Bet placed: ${betId} | latency: ${latencyMs}ms | trace: ${paymentResult.traceId}`);

        return {
            bet,
            payment: paymentResult,
            latencyMs,
            accepted: true,
        };
    }

    /**
     * Create a bet record in database
     */
    private createBetRecord(data: {
        betId: string;
        userId: string;
        marketId: string;
        amount: number;
        odds: number;
        status: string;
        placedAt: string;
        serverReceivedAt: string;
        latencyMs: number;
        videoFrameHash: string | null;
        oddsHash: string;
        traceId?: string;
        settlementId?: string;
    }): Bet {
        const stmt = db.prepare(`
      INSERT INTO bets (
        bet_id, user_id, market_id, amount, odds, status,
        placed_at, server_received_at, latency_ms,
        video_frame_hash, odds_hash, trace_id, settlement_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            data.betId,
            data.userId,
            data.marketId,
            data.amount,
            data.odds,
            data.status,
            data.placedAt,
            data.serverReceivedAt,
            data.latencyMs,
            data.videoFrameHash,
            data.oddsHash,
            data.traceId || null,
            data.settlementId || null
        );

        return this.getBet(data.betId)!;
    }

    /**
     * Get bet by ID
     */
    getBet(betId: string): Bet | null {
        const stmt = db.prepare('SELECT * FROM bets WHERE bet_id = ?');
        const bet = stmt.get(betId) as Bet | undefined;
        return bet || null;
    }

    /**
     * Get bets for a user
     */
    getUserBets(userId: string): Bet[] {
        const stmt = db.prepare('SELECT * FROM bets WHERE user_id = ? ORDER BY placed_at DESC');
        return stmt.all(userId) as Bet[];
    }

    /**
     * Get bets for an event
     */
    getEventBets(eventId: string): Bet[] {
        const stmt = db.prepare(`
      SELECT b.* FROM bets b
      JOIN markets m ON b.market_id = m.id
      WHERE m.event_id = ?
      ORDER BY b.placed_at DESC
    `);
        return stmt.all(eventId) as Bet[];
    }

    /**
     * Update bet ERC-8004 proof
     */
    updateERC8004Proof(betId: string, proof: string): void {
        const stmt = db.prepare('UPDATE bets SET erc8004_proof = ? WHERE bet_id = ?');
        stmt.run(proof, betId);
    }
}

// Singleton instance
export const betsService = new BetsService();
