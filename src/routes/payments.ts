import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { traceRegistry } from '../services/traceRegistryService.js';
import { db } from '../config/database.js';
import { ApiResponse, User } from '../types/index.js';

const router = Router();

/**
 * GET /api/payments/trace/:traceId
 * Get complete payment trace (audit)
 */
router.get('/trace/:traceId', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { traceId } = req.params;
        const trace = traceRegistry.getTrace(traceId);

        if (!trace) {
            res.status(404).json({
                success: false,
                error: 'Trace not found',
            });
            return;
        }

        // Calculate latency
        let latencyMs = 0;
        if (trace.settlement_timestamp && trace.intent_timestamp) {
            const intentTime = new Date(trace.intent_timestamp).getTime();
            const settlementTime = new Date(trace.settlement_timestamp).getTime();
            latencyMs = settlementTime - intentTime;
        }

        res.json({
            success: true,
            data: {
                trace_id: trace.trace_id,
                payer: trace.payer,
                payee: trace.payee,
                amount: trace.amount,
                currency: trace.currency,
                intent_timestamp: trace.intent_timestamp,
                settlement_timestamp: trace.settlement_timestamp,
                settlement_status: trace.settlement_status,
                latency_ms: latencyMs,
                fiat_reference_hash: trace.fiat_reference_hash,
                blockchain_tx_hash: trace.blockchain_tx_hash,
                erc8004_validation_id: trace.erc8004_validation_id,
                erc8004_feedback_id: trace.erc8004_feedback_id,
            },
        });
    } catch (error) {
        console.error('[Payments] Trace error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get trace',
        });
    }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user!.userId;

        // Get user's wallet address
        const userStmt = db.prepare('SELECT wallet_address FROM users WHERE id = ?');
        const user = userStmt.get(userId) as { wallet_address: string } | undefined;

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        // Get traces by payer address (could be userId or wallet address)
        const traces = traceRegistry.getUserTraces(user.wallet_address || userId);

        res.json({
            success: true,
            data: traces,
        });
    } catch (error) {
        console.error('[Payments] History error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get payment history',
        });
    }
});

/**
 * GET /api/payments/verify/:traceId
 * Verify settlement status
 */
router.get('/verify/:traceId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { traceId } = req.params;
        const verification = traceRegistry.verifySettlement(traceId);

        res.json({
            success: true,
            data: {
                trace_id: traceId,
                is_confirmed: verification.isConfirmed,
                latency_ms: verification.latencyMs,
            },
        });
    } catch (error) {
        console.error('[Payments] Verify error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify settlement',
        });
    }
});

export default router;
