import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { eventSimulator } from '../services/eventSimulator.js';
import { facilitatorService } from '../services/facilitatorService.js';
import { betsService } from '../services/betsService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/admin/create-test-event
 * Create a test event with simulation
 */
router.post('/create-test-event', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { name } = req.body;
        const result = eventSimulator.createTestEvent(name);

        res.status(201).json({
            success: true,
            data: {
                event: result.event,
                markets: result.simulation.markets,
                message: result.simulation.message,
            },
        });
    } catch (error: any) {
        console.error('[Admin] Create test event error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create test event',
        });
    }
});

/**
 * POST /api/admin/simulate/:eventId
 * Start simulation for an existing event
 */
router.post('/simulate/:eventId', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const { durationSeconds } = req.body;

        const result = eventSimulator.simulateLiveEvent(eventId, durationSeconds || 120);

        res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('[Admin] Simulate error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start simulation',
        });
    }
});

/**
 * POST /api/admin/stop-simulation/:eventId
 * Stop simulation for an event
 */
router.post('/stop-simulation/:eventId', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        eventSimulator.stopSimulation(eventId);

        res.json({
            success: true,
            message: 'Simulation stopped',
        });
    } catch (error: any) {
        console.error('[Admin] Stop simulation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to stop simulation',
        });
    }
});

/**
 * GET /api/admin/facilitator/status
 * Get facilitator status and reputation
 */
router.get('/facilitator/status', (req: Request, res: Response<ApiResponse>) => {
    try {
        const status = facilitatorService.getStatus();

        res.json({
            success: true,
            data: status,
        });
    } catch (error) {
        console.error('[Admin] Facilitator status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get facilitator status',
        });
    }
});

/**
 * POST /api/admin/simulate-settlement/:traceId
 * Manually trigger settlement confirmation (for testing)
 */
router.post('/simulate-settlement/:traceId', authenticateJWT, async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { traceId } = req.params;
        const transactionId = `sim-${Date.now()}`;

        const result = await facilitatorService.confirmSettlement(
            traceId,
            transactionId,
            'SIMULATED'
        );

        res.json({
            success: true,
            data: result,
            message: 'Settlement simulated successfully',
        });
    } catch (error: any) {
        console.error('[Admin] Simulate settlement error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to simulate settlement',
        });
    }
});

export default router;
