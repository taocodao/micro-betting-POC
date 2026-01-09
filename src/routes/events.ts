import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { eventsService } from '../services/eventsMarketsService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * GET /api/events
 * List all events (optionally filtered by status)
 */
router.get('/', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { status } = req.query;
        const events = eventsService.listEvents(status as string);

        res.json({
            success: true,
            data: events,
        });
    } catch (error) {
        console.error('[Events] List error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list events',
        });
    }
});

/**
 * GET /api/events/:eventId
 * Get event details
 */
router.get('/:eventId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const event = eventsService.getEvent(eventId);

        if (!event) {
            res.status(404).json({
                success: false,
                error: 'Event not found',
            });
            return;
        }

        res.json({
            success: true,
            data: event,
        });
    } catch (error) {
        console.error('[Events] Get error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get event',
        });
    }
});

/**
 * GET /api/events/:eventId/stream
 * Get video stream info for an event
 */
router.get('/:eventId/stream', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const streamInfo = eventsService.getStreamInfo(eventId);

        if (!streamInfo) {
            res.status(404).json({
                success: false,
                error: 'Event not found',
            });
            return;
        }

        res.json({
            success: true,
            data: streamInfo,
        });
    } catch (error) {
        console.error('[Events] Stream error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stream info',
        });
    }
});

/**
 * POST /api/events
 * Create a new event (admin)
 */
router.post('/', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { name, sport, startTime, videoUrl, latencyTarget } = req.body;

        if (!name || !sport) {
            res.status(400).json({
                success: false,
                error: 'Name and sport are required',
            });
            return;
        }

        const event = eventsService.createEvent({
            name,
            sport,
            startTime: startTime || new Date().toISOString(),
            videoUrl,
            latencyTarget,
        });

        res.status(201).json({
            success: true,
            data: event,
            message: 'Event created successfully',
        });
    } catch (error) {
        console.error('[Events] Create error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create event',
        });
    }
});

export default router;
