import { eventsService, marketsService } from './eventsMarketsService.js';

/**
 * Event Simulator
 * Simulates a live event for demo purposes
 * - Generates video frame hashes every 100ms
 * - Creates and updates markets with dynamic odds
 * - Closes markets after configurable time
 */
export class EventSimulator {
    private intervals: Map<string, NodeJS.Timeout[]> = new Map();

    /**
     * Start simulating a live event
     */
    simulateLiveEvent(
        eventId: string,
        durationSeconds: number = 120
    ): { markets: string[]; message: string } {
        console.log(`[Simulator] Starting simulation for event ${eventId} (${durationSeconds}s)`);

        // Update event status to live
        eventsService.updateStatus(eventId, 'live');

        const eventIntervals: NodeJS.Timeout[] = [];

        // Generate video frame hashes every 100ms
        const frameInterval = setInterval(() => {
            eventsService.recordVideoFrame(eventId);
        }, 100);
        eventIntervals.push(frameInterval);

        // Create initial markets
        const marketTypes = ['next_goal', 'next_corner', 'next_foul', 'next_card'];
        const marketIds: string[] = [];

        for (const marketType of marketTypes) {
            const initialOdds = 1.5 + Math.random() * 2; // Random odds between 1.5 and 3.5
            const closeTimeSeconds = 30 + Math.floor(Math.random() * 60); // Close in 30-90 seconds

            const market = marketsService.createMarket({
                eventId,
                marketType,
                description: `Bet on ${marketType.replace('_', ' ')}`,
                initialOdds,
                closeTimeSeconds,
            });

            marketIds.push(market.id);

            // Update odds every 2-5 seconds
            const oddsInterval = setInterval(() => {
                const currentMarket = marketsService.getMarket(market.id);
                if (currentMarket && currentMarket.status === 'open') {
                    const change = (Math.random() - 0.5) * 0.3; // +/- 0.15
                    const newOdds = Math.max(1.1, currentMarket.current_odds + change);
                    marketsService.updateOdds(market.id, Math.round(newOdds * 100) / 100);
                }
            }, 2000 + Math.random() * 3000);
            eventIntervals.push(oddsInterval);
        }

        // Store intervals for cleanup
        this.intervals.set(eventId, eventIntervals);

        // Stop simulation after duration
        setTimeout(() => {
            this.stopSimulation(eventId);
        }, durationSeconds * 1000);

        console.log(`[Simulator] Created ${marketIds.length} markets for event ${eventId}`);

        return {
            markets: marketIds,
            message: `Simulation started with ${marketIds.length} markets. Will run for ${durationSeconds} seconds.`,
        };
    }

    /**
     * Stop simulating an event
     */
    stopSimulation(eventId: string): void {
        console.log(`[Simulator] Stopping simulation for event ${eventId}`);

        // Clear all intervals
        const eventIntervals = this.intervals.get(eventId);
        if (eventIntervals) {
            for (const interval of eventIntervals) {
                clearInterval(interval);
            }
            this.intervals.delete(eventId);
        }

        // Update event status
        eventsService.updateStatus(eventId, 'completed');

        // Close all open markets
        const markets = marketsService.listMarkets(eventId, 'open');
        for (const market of markets) {
            marketsService.closeMarket(market.id);
        }

        console.log(`[Simulator] Simulation stopped for event ${eventId}`);
    }

    /**
     * Create a test event with simulation
     */
    createTestEvent(name?: string): {
        event: ReturnType<typeof eventsService.createEvent>;
        simulation: { markets: string[]; message: string };
    } {
        const eventName = name || `Test Match ${Date.now()}`;

        const event = eventsService.createEvent({
            name: eventName,
            sport: 'football',
            startTime: new Date().toISOString(),
            videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            latencyTarget: 100,
        });

        const simulation = this.simulateLiveEvent(event.id, 120);

        return { event, simulation };
    }
}

// Singleton instance
export const eventSimulator = new EventSimulator();
