import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import {
    ERC8004ValidationRequest,
    ERC8004Feedback,
    AgentReputation
} from '../types/index.js';

/**
 * ERC-8004 Trust Layer Service
 * Simulates Identity, Validation, and Reputation registries
 */
export class ERC8004Service {
    private facilitatorAddress: string;

    constructor() {
        this.facilitatorAddress = config.x402.facilitatorAddress;
    }

    /**
     * Submit validation request to Validation Registry
     * Records that a payment intent was created and verified
     */
    submitValidationRequest(request: ERC8004ValidationRequest): string {
        const validationId = `val-${uuidv4()}`;

        const stmt = db.prepare(`
      INSERT INTO erc8004_validations (
        id, trace_id, agent, validation_type, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            validationId,
            request.traceId,
            request.agent,
            request.validation_type,
            request.timestamp,
            JSON.stringify(request.metadata)
        );

        console.log(`[ERC-8004] Validation submitted: ${validationId} | type: ${request.validation_type}`);

        return validationId;
    }

    /**
     * Submit feedback to Reputation Registry
     * Records successful/failed settlement to build reputation
     */
    submitFeedback(feedback: ERC8004Feedback): string {
        const feedbackId = `fb-${uuidv4()}`;

        const stmt = db.prepare(`
      INSERT INTO erc8004_feedback (
        id, trace_id, agent, rating, feedback_type, timestamp, proof
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            feedbackId,
            feedback.traceId,
            feedback.agent,
            feedback.rating,
            feedback.feedback_type,
            feedback.timestamp,
            JSON.stringify(feedback.proof)
        );

        console.log(`[ERC-8004] Feedback submitted: ${feedbackId} | rating: ${feedback.rating}`);

        return feedbackId;
    }

    /**
     * Get agent reputation from Reputation Registry
     */
    getAgentReputation(agentAddress: string): AgentReputation {
        // Get all feedback for this agent
        const feedbackStmt = db.prepare(`
      SELECT rating, feedback_type FROM erc8004_feedback WHERE agent = ?
    `);
        const allFeedback = feedbackStmt.all(agentAddress) as { rating: number; feedback_type: string }[];

        const totalSettlements = allFeedback.length;
        const successfulSettlements = allFeedback.filter(
            f => f.feedback_type === 'PAYMENT_SETTLEMENT_SUCCESS'
        ).length;
        const successRate = totalSettlements > 0 ? successfulSettlements / totalSettlements : 1.0;

        // Calculate average rating
        const avgRating = totalSettlements > 0
            ? allFeedback.reduce((sum, f) => sum + f.rating, 0) / totalSettlements
            : 1.0;

        // Count recent disputes
        const recentDisputes = allFeedback.filter(
            f => f.feedback_type === 'DISPUTE_FILED'
        ).length;

        return {
            agent_address: agentAddress,
            reputation_score: avgRating,
            total_settlements: totalSettlements,
            successful_settlements: successfulSettlements,
            success_rate: successRate,
            recent_disputes: recentDisputes,
        };
    }

    /**
     * Verify facilitator is registered and trusted
     */
    verifyFacilitator(): {
        is_registered: boolean;
        reputation_score: number;
        is_trusted: boolean;
        compliance_status: string;
    } {
        const reputation = this.getAgentReputation(this.facilitatorAddress);

        return {
            is_registered: true, // For PoC, always registered
            reputation_score: reputation.reputation_score,
            is_trusted: reputation.success_rate > 0.95,
            compliance_status: 'VERIFIED',
        };
    }

    /**
     * Get facilitator address
     */
    getFacilitatorAddress(): string {
        return this.facilitatorAddress;
    }
}

// Singleton instance
export const erc8004Service = new ERC8004Service();
