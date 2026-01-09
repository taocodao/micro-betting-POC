import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { optionalX402Payment } from '../middleware/x402.js';
import { betsService } from '../services/betsService.js';
import { X402Client } from '../services/x402Client.js';
import { config } from '../config/env.js';
import { db } from '../config/database.js';
import { ApiResponse, User } from '../types/index.js';

const router = Router();

/**
 * POST /api/bets/place
 * Place a bet with X402 payment
 */
router.post(
    '/place',
    authenticateJWT,
    optionalX402Payment,
    async (req: Request, res: Response<ApiResponse>) => {
        try {
            const userId = req.user!.userId;
            const { marketId, amount, odds, clientPlacedAt } = req.body;

            if (!marketId || !amount || !odds) {
                res.status(400).json({
                    success: false,
                    error: 'marketId, amount, and odds are required',
                });
                return;
            }

            // Get user's wallet address for X402
            const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
            const user = userStmt.get(userId) as User | undefined;

            if (!user) {
                res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
                return;
            }

            // Use provided X402 intent or create one
            let paymentIntent = req.x402PaymentIntent;

            if (!paymentIntent) {
                // Create X402 payment intent for the user
                const x402Client = new X402Client(user.wallet_address || userId);
                paymentIntent = await x402Client.createPaymentIntent(
                    amount,
                    'BRL',
                    config.x402.operatorPayeeAddress,
                    Date.now()
                );
            }

            // Place the bet
            const result = await betsService.placeBet(
                userId,
                marketId,
                amount,
                odds,
                clientPlacedAt || new Date().toISOString(),
                paymentIntent
            );

            if (!result.accepted) {
                res.status(200).json({
                    success: true,
                    data: {
                        bet_id: result.bet.bet_id,
                        status: 'rejected',
                        latency_ms: result.latencyMs,
                        reason: result.reason,
                        payment_status: 'NOT_INITIATED',
                    },
                    message: `Bet rejected: ${result.reason}`,
                });
                return;
            }

            res.status(201).json({
                success: true,
                data: {
                    bet_id: result.bet.bet_id,
                    status: 'accepted',
                    latency_ms: result.latencyMs,
                    trace_id: result.payment.traceId,
                    settlement_id: result.payment.settlementId,
                    access_level: result.payment.accessLevel,
                    payment_status: result.payment.status,
                },
                message: 'Bet placed with provisional access. Awaiting payment confirmation.',
            });
        } catch (error: any) {
            console.error('[Bets] Place error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to place bet',
            });
        }
    }
);

/**
 * GET /api/bets
 * Get user's bets
 */
router.get('/', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;
        const bets = betsService.getUserBets(userId);

        res.json({
            success: true,
            data: bets,
        });
    } catch (error) {
        console.error('[Bets] List error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list bets',
        });
    }
});

/**
 * GET /api/bets/:betId
 * Get bet details
 */
router.get('/:betId', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { betId } = req.params;
        const bet = betsService.getBet(betId);

        if (!bet) {
            res.status(404).json({
                success: false,
                error: 'Bet not found',
            });
            return;
        }

        // Verify user owns the bet
        if (bet.user_id !== req.user!.userId) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
            });
            return;
        }

        res.json({
            success: true,
            data: bet,
        });
    } catch (error) {
        console.error('[Bets] Get error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get bet',
        });
    }
});

export default router;
