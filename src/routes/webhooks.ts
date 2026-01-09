import { Router, Request, Response } from 'express';
import { facilitatorService } from '../services/facilitatorService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/webhooks/payment/confirm
 * Receive settlement confirmation from fiat processor
 */
router.post('/payment/confirm', async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { trace_id, fiat_transaction_id, processor, status } = req.body;

        console.log(`[Webhook] Settlement confirmation: ${trace_id} → ${status}`);

        if (!trace_id || !fiat_transaction_id) {
            res.status(400).json({
                success: false,
                error: 'trace_id and fiat_transaction_id are required',
            });
            return;
        }

        if (status !== 'CONFIRMED') {
            // Handle failed settlement
            console.log(`[Webhook] Settlement failed for trace: ${trace_id}`);
            res.json({
                success: true,
                message: 'Settlement failure acknowledged',
            });
            return;
        }

        // Confirm settlement
        const result = await facilitatorService.confirmSettlement(
            trace_id,
            fiat_transaction_id,
            processor || 'UNKNOWN'
        );

        res.json({
            success: true,
            data: result,
            message: 'Settlement confirmed and access upgraded',
        });
    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process webhook',
        });
    }
});

/**
 * POST /api/webhooks/pix/confirm
 * PIX-specific webhook
 */
router.post('/pix/confirm', async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { trace_id, transaction_id } = req.body;

        console.log(`[PIX Webhook] Confirmation: ${transaction_id}`);

        const result = await facilitatorService.confirmSettlement(
            trace_id,
            transaction_id,
            'PIX'
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('[PIX Webhook] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process PIX webhook',
        });
    }
});

/**
 * POST /api/webhooks/card/confirm
 * Card-specific webhook
 */
router.post('/card/confirm', async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { trace_id, transaction_id } = req.body;

        console.log(`[Card Webhook] Confirmation: ${transaction_id}`);

        const result = await facilitatorService.confirmSettlement(
            trace_id,
            transaction_id,
            'CARD'
        );

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('[Card Webhook] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process card webhook',
        });
    }
});

export default router;
