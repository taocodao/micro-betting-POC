import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { Event, Market, VideoFrame } from '../types/index.js';

/**
 * Events Service
 * Manages live events and video streaming
 */
export class EventsService {
    /**
     * Create a new event
     */
    createEvent(data: {
        name: string;
        sport: string;
        startTime: string;
        videoUrl?: string;
        latencyTarget?: number;
    }): Event {
        const eventId = uuidv4();

        const stmt = db.prepare(`
      INSERT INTO events (id, name, sport, start_time, status, video_url, latency_target)
      VALUES (?, ?, ?, ?, 'scheduled', ?, ?)
    `);

        stmt.run(
            eventId,
            data.name,
            data.sport,
            data.startTime,
            data.videoUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            data.latencyTarget || 100
        );

        return this.getEvent(eventId)!;
    }

    /**
     * Get event by ID
     */
    getEvent(eventId: string): Event | null {
        const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
        const event = stmt.get(eventId) as Event | undefined;
        return event || null;
    }

    /**
     * List all active events
     */
    listEvents(status?: string): Event[] {
        if (status) {
            const stmt = db.prepare('SELECT * FROM events WHERE status = ? ORDER BY start_time DESC');
            return stmt.all(status) as Event[];
        }
        const stmt = db.prepare('SELECT * FROM events ORDER BY start_time DESC');
        return stmt.all() as Event[];
    }

    /**
     * Update event status
     */
    updateStatus(eventId: string, status: 'scheduled' | 'live' | 'completed'): void {
        const stmt = db.prepare('UPDATE events SET status = ? WHERE id = ?');
        stmt.run(status, eventId);
    }

    /**
     * Get video stream info for an event
     */
    getStreamInfo(eventId: string): {
        videoUrl: string;
        streamType: string;
        latencyTarget: number;
    } | null {
        const event = this.getEvent(eventId);
        if (!event) return null;

        return {
            videoUrl: event.video_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            streamType: 'hls',
            latencyTarget: event.latency_target,
        };
    }

    /**
     * Record a video frame hash (for bet anchoring)
     */
    recordVideoFrame(eventId: string): VideoFrame {
        const frameId = uuidv4();
        const timestamp = new Date().toISOString();
        const frameHash = crypto
            .createHash('sha256')
            .update(`${eventId}-${timestamp}-${Math.random()}`)
            .digest('hex');

        const stmt = db.prepare(`
      INSERT INTO video_frames (id, event_id, frame_hash, timestamp)
      VALUES (?, ?, ?, ?)
    `);

        stmt.run(frameId, eventId, frameHash, timestamp);

        return { id: frameId, event_id: eventId, frame_hash: frameHash, timestamp };
    }

    /**
     * Get latest video frame hash for an event
     */
    getLatestFrameHash(eventId: string): string | null {
        const stmt = db.prepare(`
      SELECT frame_hash FROM video_frames 
      WHERE event_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
        const frame = stmt.get(eventId) as { frame_hash: string } | undefined;
        return frame?.frame_hash || null;
    }
}

/**
 * Markets Service
 * Manages micro-betting markets with dynamic odds
 */
export class MarketsService {
    /**
     * Create a new market for an event
     */
    createMarket(data: {
        eventId: string;
        marketType: string;
        description?: string;
        initialOdds: number;
        closeTimeSeconds?: number;
    }): Market {
        const marketId = uuidv4();
        const closeTime = new Date(
            Date.now() + (data.closeTimeSeconds || 60) * 1000
        ).toISOString();

        const stmt = db.prepare(`
      INSERT INTO markets (id, event_id, market_type, description, current_odds, status, market_close_time)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `);

        stmt.run(
            marketId,
            data.eventId,
            data.marketType,
            data.description || `${data.marketType} market`,
            data.initialOdds,
            closeTime
        );

        return this.getMarket(marketId)!;
    }

    /**
     * Get market by ID
     */
    getMarket(marketId: string): Market | null {
        const stmt = db.prepare('SELECT * FROM markets WHERE id = ?');
        const market = stmt.get(marketId) as Market | undefined;
        return market || null;
    }

    /**
     * List markets for an event
     */
    listMarkets(eventId: string, status?: string): Market[] {
        if (status) {
            const stmt = db.prepare(`
        SELECT * FROM markets 
        WHERE event_id = ? AND status = ?
        ORDER BY created_at DESC
      `);
            return stmt.all(eventId, status) as Market[];
        }
        const stmt = db.prepare('SELECT * FROM markets WHERE event_id = ? ORDER BY created_at DESC');
        return stmt.all(eventId) as Market[];
    }

    /**
     * Update market odds
     */
    updateOdds(marketId: string, newOdds: number): void {
        const stmt = db.prepare('UPDATE markets SET current_odds = ? WHERE id = ?');
        stmt.run(newOdds, marketId);
    }

    /**
     * Close a market
     */
    closeMarket(marketId: string): void {
        const stmt = db.prepare(`
      UPDATE markets 
      SET status = 'closed', market_close_time = datetime('now')
      WHERE id = ?
    `);
        stmt.run(marketId);
    }

    /**
     * Check if market is open for betting
     */
    isMarketOpen(marketId: string): { isOpen: boolean; reason?: string } {
        const market = this.getMarket(marketId);

        if (!market) {
            return { isOpen: false, reason: 'Market not found' };
        }

        if (market.status !== 'open') {
            return { isOpen: false, reason: `Market is ${market.status}` };
        }

        if (market.market_close_time) {
            const closeTime = new Date(market.market_close_time).getTime();
            const now = Date.now();
            if (now > closeTime) {
                return { isOpen: false, reason: 'Market has closed' };
            }
        }

        return { isOpen: true };
    }

    /**
     * Settle a market (mark winner)
     */
    settleMarket(marketId: string, outcome: string): void {
        const stmt = db.prepare(`
      UPDATE markets SET status = 'settled' WHERE id = ?
    `);
        stmt.run(marketId);
    }
}

// Singleton instances
export const eventsService = new EventsService();
export const marketsService = new MarketsService();
