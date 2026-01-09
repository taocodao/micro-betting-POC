import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { metricsService } from '../services/metricsService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/metrics/event/:eventId
 * Get comprehensive metrics for an event
 */
router.get('/event/:eventId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const metrics = metricsService.getEventMetrics(eventId);

        res.json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        console.error('[Metrics] Event metrics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event metrics',
        });
    }
});

/**
 * GET /api/metrics/event/:eventId/realtime
 * Get real-time stats for dashboard
 */
router.get('/event/:eventId/realtime', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const stats = metricsService.getRealTimeStats(eventId);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('[Metrics] Real-time stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get real-time stats',
        });
    }
});

/**
 * GET /api/metrics/global
 * Get global metrics across all events
 */
router.get('/global', (req: Request, res: Response<ApiResponse>) => {
    try {
        const metrics = metricsService.getGlobalMetrics();

        res.json({
            success: true,
            data: metrics,
        });
    } catch (error) {
        console.error('[Metrics] Global metrics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get global metrics',
        });
    }
});

export default router;
