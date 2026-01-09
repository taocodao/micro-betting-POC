import { db } from '../config/database.js';
import { EventMetrics, Bet, Dispute } from '../types/index.js';

/**
 * Metrics Service
 * Aggregates KPIs for events - acceptance rate, latency, handle, disputes
 */
export class MetricsService {
    /**
     * Get comprehensive metrics for an event
     */
    getEventMetrics(eventId: string): EventMetrics {
        // Get all bets for the event
        const betsStmt = db.prepare(`
      SELECT b.* FROM bets b
      JOIN markets m ON b.market_id = m.id
      WHERE m.event_id = ?
    `);
        const bets = betsStmt.all(eventId) as Bet[];

        // Get disputes for the event
        const disputesStmt = db.prepare(`
      SELECT d.* FROM disputes d
      JOIN bets b ON d.bet_id = b.bet_id
      JOIN markets m ON b.market_id = m.id
      WHERE m.event_id = ?
    `);
        const disputes = disputesStmt.all(eventId) as Dispute[];

        // Calculate metrics
        const totalBets = bets.length;
        const acceptedBets = bets.filter(b => b.status === 'accepted' || b.status === 'pending' || b.status === 'won' || b.status === 'lost').length;
        const rejectedBets = bets.filter(b => b.status === 'rejected').length;
        const acceptanceRate = totalBets > 0 ? acceptedBets / totalBets : 0;

        // Latency metrics
        const latencies = bets.filter(b => b.latency_ms != null).map(b => b.latency_ms!);
        const avgLatency = latencies.length > 0
            ? latencies.reduce((a, b) => a + b, 0) / latencies.length
            : 0;
        const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

        // Handle (total wagered)
        const totalHandle = bets
            .filter(b => b.status !== 'rejected')
            .reduce((sum, b) => sum + b.amount, 0);

        // Dispute metrics
        const totalDisputes = disputes.length;
        const disputesCorrect = disputes.filter(d => {
            const result = d.tee_validation_result ? JSON.parse(d.tee_validation_result) : null;
            return result?.verdict === 'CORRECT';
        }).length;
        const disputesIncorrect = disputes.filter(d => {
            const result = d.tee_validation_result ? JSON.parse(d.tee_validation_result) : null;
            return result?.verdict === 'INCORRECT';
        }).length;

        return {
            event_id: eventId,
            total_bets: totalBets,
            accepted_bets: acceptedBets,
            rejected_bets: rejectedBets,
            acceptance_rate: Math.round(acceptanceRate * 100) / 100,
            avg_latency_ms: Math.round(avgLatency),
            max_latency_ms: maxLatency,
            total_handle: Math.round(totalHandle * 100) / 100,
            total_disputes: totalDisputes,
            disputes_correct: disputesCorrect,
            disputes_incorrect: disputesIncorrect,
        };
    }

    /**
     * Get summary metrics across all events
     */
    getGlobalMetrics(): {
        total_events: number;
        total_bets: number;
        total_handle: number;
        avg_acceptance_rate: number;
        avg_latency_ms: number;
        total_disputes: number;
    } {
        const eventsStmt = db.prepare('SELECT id FROM events');
        const events = eventsStmt.all() as { id: string }[];

        const eventMetrics = events.map(e => this.getEventMetrics(e.id));

        const totalEvents = events.length;
        const totalBets = eventMetrics.reduce((sum, m) => sum + m.total_bets, 0);
        const totalHandle = eventMetrics.reduce((sum, m) => sum + m.total_handle, 0);
        const totalDisputes = eventMetrics.reduce((sum, m) => sum + m.total_disputes, 0);

        const avgAcceptanceRate = eventMetrics.length > 0
            ? eventMetrics.reduce((sum, m) => sum + m.acceptance_rate, 0) / eventMetrics.length
            : 0;

        const avgLatency = eventMetrics.length > 0
            ? eventMetrics.reduce((sum, m) => sum + m.avg_latency_ms, 0) / eventMetrics.length
            : 0;

        return {
            total_events: totalEvents,
            total_bets: totalBets,
            total_handle: Math.round(totalHandle * 100) / 100,
            avg_acceptance_rate: Math.round(avgAcceptanceRate * 100) / 100,
            avg_latency_ms: Math.round(avgLatency),
            total_disputes: totalDisputes,
        };
    }

    /**
     * Get real-time stats (for dashboard polling)
     */
    getRealTimeStats(eventId: string): {
        metrics: EventMetrics;
        last_5_bets: Bet[];
        last_5_disputes: Dispute[];
    } {
        const metrics = this.getEventMetrics(eventId);

        // Get last 5 bets
        const betsStmt = db.prepare(`
      SELECT b.* FROM bets b
      JOIN markets m ON b.market_id = m.id
      WHERE m.event_id = ?
      ORDER BY b.placed_at DESC
      LIMIT 5
    `);
        const last5Bets = betsStmt.all(eventId) as Bet[];

        // Get last 5 disputes
        const disputesStmt = db.prepare(`
      SELECT d.* FROM disputes d
      JOIN bets b ON d.bet_id = b.bet_id
      JOIN markets m ON b.market_id = m.id
      WHERE m.event_id = ?
      ORDER BY d.created_at DESC
      LIMIT 5
    `);
        const last5Disputes = disputesStmt.all(eventId) as Dispute[];

        return {
            metrics,
            last_5_bets: last5Bets,
            last_5_disputes: last5Disputes,
        };
    }
}

// Singleton instance
export const metricsService = new MetricsService();
