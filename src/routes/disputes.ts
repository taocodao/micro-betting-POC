import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { teeService } from '../services/teeService.js';
import { ApiResponse, TEEValidationResult } from '../types/index.js';

const router = Router();

/**
 * POST /api/disputes/create
 * Create a dispute for a rejected bet
 */
router.post('/create', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { betId, reason } = req.body;

        if (!betId) {
            res.status(400).json({
                success: false,
                error: 'betId is required',
            });
            return;
        }

        // Create dispute and get TEE validation
        const dispute = teeService.createDispute(betId, reason || 'Dispute submitted');

        // Parse TEE result
        const teeResult: TEEValidationResult = dispute.tee_validation_result
            ? JSON.parse(dispute.tee_validation_result)
            : null;

        res.status(201).json({
            success: true,
            data: {
                dispute_id: dispute.id,
                bet_id: dispute.bet_id,
                status: dispute.status,
                verdict: teeResult?.verdict,
                details: teeResult?.details,
                attestation: teeResult?.attestation,
                resolved_at: dispute.resolved_at,
            },
            message: `Dispute resolved with verdict: ${teeResult?.verdict}`,
        });
    } catch (error: any) {
        console.error('[Disputes] Create error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create dispute',
        });
    }
});

/**
 * GET /api/disputes/:disputeId
 * Get dispute details
 */
router.get('/:disputeId', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { disputeId } = req.params;
        const dispute = teeService.getDispute(disputeId);

        if (!dispute) {
            res.status(404).json({
                success: false,
                error: 'Dispute not found',
            });
            return;
        }

        // Parse TEE result
        const teeResult: TEEValidationResult = dispute.tee_validation_result
            ? JSON.parse(dispute.tee_validation_result)
            : null;

        res.json({
            success: true,
            data: {
                dispute_id: dispute.id,
                bet_id: dispute.bet_id,
                reason: dispute.reason,
                status: dispute.status,
                verdict: teeResult?.verdict,
                details: teeResult?.details,
                attestation: teeResult?.attestation,
                bet_placed_at: teeResult?.bet_placed_at,
                market_close_time: teeResult?.market_close_time,
                latency_ms: teeResult?.latency_ms,
                created_at: dispute.created_at,
                resolved_at: dispute.resolved_at,
            },
        });
    } catch (error) {
        console.error('[Disputes] Get error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dispute',
        });
    }
});

/**
 * GET /api/disputes/bet/:betId
 * Get disputes for a bet
 */
router.get('/bet/:betId', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { betId } = req.params;
        const disputes = teeService.getBetDisputes(betId);

        res.json({
            success: true,
            data: disputes.map(d => ({
                ...d,
                tee_validation_result: d.tee_validation_result
                    ? JSON.parse(d.tee_validation_result)
                    : null,
            })),
        });
    } catch (error) {
        console.error('[Disputes] Get by bet error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get disputes',
        });
    }
});

export default router;
