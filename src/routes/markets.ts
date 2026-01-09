import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { marketsService } from '../services/eventsMarketsService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/markets/event/:eventId
 * List markets for an event
 */
router.get('/event/:eventId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const { status } = req.query;

        const markets = marketsService.listMarkets(eventId, status as string);

        res.json({
            success: true,
            data: markets,
        });
    } catch (error) {
        console.error('[Markets] List error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list markets',
        });
    }
});

/**
 * GET /api/markets/:marketId
 * Get market details
 */
router.get('/:marketId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { marketId } = req.params;
        const market = marketsService.getMarket(marketId);

        if (!market) {
            res.status(404).json({
                success: false,
                error: 'Market not found',
            });
            return;
        }

        // Check if market is open
        const openCheck = marketsService.isMarketOpen(marketId);

        res.json({
            success: true,
            data: {
                ...market,
                is_open: openCheck.isOpen,
                close_reason: openCheck.reason,
            },
        });
    } catch (error) {
        console.error('[Markets] Get error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get market',
        });
    }
});

/**
 * POST /api/markets
 * Create a new market (admin)
 */
router.post('/', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId, marketType, description, initialOdds, closeTimeSeconds } = req.body;

        if (!eventId || !marketType || !initialOdds) {
            res.status(400).json({
                success: false,
                error: 'eventId, marketType, and initialOdds are required',
            });
            return;
        }

        const market = marketsService.createMarket({
            eventId,
            marketType,
            description,
            initialOdds,
            closeTimeSeconds,
        });

        res.status(201).json({
            success: true,
            data: market,
            message: 'Market created successfully',
        });
    } catch (error) {
        console.error('[Markets] Create error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create market',
        });
    }
});

/**
 * PUT /api/markets/:marketId/odds
 * Update market odds (admin/simulator)
 */
router.put('/:marketId/odds', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { marketId } = req.params;
        const { odds } = req.body;

        if (typeof odds !== 'number' || odds <= 0) {
            res.status(400).json({
                success: false,
                error: 'Valid odds value is required',
            });
            return;
        }

        marketsService.updateOdds(marketId, odds);

        res.json({
            success: true,
            message: 'Odds updated successfully',
        });
    } catch (error) {
        console.error('[Markets] Update odds error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update odds',
        });
    }
});

/**
 * POST /api/markets/:marketId/close
 * Close a market (admin)
 */
router.post('/:marketId/close', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { marketId } = req.params;

        marketsService.closeMarket(marketId);

        res.json({
            success: true,
            message: 'Market closed successfully',
        });
    } catch (error) {
        console.error('[Markets] Close error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to close market',
        });
    }
});

export default router;
