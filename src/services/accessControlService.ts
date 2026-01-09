import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import { AccessLog, Bet, User } from '../types/index.js';

/**
 * Access Control Service
 * Manages tiered access (PROVISIONAL → FULL) based on payment settlement
 */
export class AccessControlService {
    /**
     * Grant PROVISIONAL access when payment intent is recorded
     * User can see bet immediately, but cannot settle winnings until FULL access
     */
    grantProvisionalAccess(
        userId: string,
        traceId: string,
        betId: string
    ): { accessToken: string; level: string; expiresIn: string } {
        const accessId = uuidv4();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        // Create access token that expires if settlement fails
        const accessToken = jwt.sign(
            {
                userId,
                traceId,
                level: 'PROVISIONAL',
                betId,
            },
            config.jwt.secret,
            { expiresIn: '10m' }
        );

        // Store access record
        const stmt = db.prepare(`
      INSERT INTO access_logs (
        id, user_id, trace_id, access_level, granted_at, expires_at, status
      ) VALUES (?, ?, ?, 'PROVISIONAL', datetime('now'), ?, 'ACTIVE')
    `);

        stmt.run(accessId, userId, traceId, expiresAt);

        console.log(`[Access] PROVISIONAL access granted: user=${userId} trace=${traceId}`);

        return {
            accessToken,
            level: 'PROVISIONAL',
            expiresIn: '10 minutes',
        };
    }

    /**
     * Upgrade to FULL access when settlement confirms
     */
    grantFullAccess(
        userId: string,
        traceId: string
    ): { accessToken: string; level: string; expiresIn: string } {
        // Create new access token with longer lifetime
        const accessToken = jwt.sign(
            {
                userId,
                traceId,
                level: 'FULL',
            },
            config.jwt.secret,
            { expiresIn: '30d' }
        );

        // Update access record
        const stmt = db.prepare(`
      UPDATE access_logs 
      SET access_level = 'FULL', 
          upgraded_at = datetime('now'),
          expires_at = NULL
      WHERE trace_id = ?
    `);

        stmt.run(traceId);

        console.log(`[Access] Upgraded to FULL access: user=${userId} trace=${traceId}`);

        return {
            accessToken,
            level: 'FULL',
            expiresIn: '30 days',
        };
    }

    /**
     * Revoke access if settlement fails
     * Also refunds the user's balance
     */
    async revokeAccess(userId: string, traceId: string): Promise<void> {
        console.log(`[Access] Revoking access: user=${userId} trace=${traceId}`);

        // Update access record
        const accessStmt = db.prepare(`
      UPDATE access_logs 
      SET status = 'REVOKED', 
          revoked_at = datetime('now')
      WHERE trace_id = ?
    `);
        accessStmt.run(traceId);

        // Find the bet and refund
        const betStmt = db.prepare('SELECT * FROM bets WHERE trace_id = ?');
        const bet = betStmt.get(traceId) as Bet | undefined;

        if (bet) {
            // Update bet status to rejected
            const updateBetStmt = db.prepare(`
        UPDATE bets SET status = 'rejected' WHERE trace_id = ?
      `);
            updateBetStmt.run(traceId);

            // Refund user's balance
            const refundStmt = db.prepare(`
        UPDATE users SET balance = balance + ? WHERE id = ?
      `);
            refundStmt.run(bet.amount, userId);

            console.log(`[Access] Refunded ${bet.amount} BRL to user ${userId}`);
        }
    }

    /**
     * Check current access level for a trace
     */
    checkAccessLevel(traceId: string): AccessLog | null {
        const stmt = db.prepare('SELECT * FROM access_logs WHERE trace_id = ? AND status = ?');
        const access = stmt.get(traceId, 'ACTIVE') as AccessLog | undefined;
        return access || null;
    }

    /**
     * Get all access logs for a user
     */
    getUserAccessLogs(userId: string): AccessLog[] {
        const stmt = db.prepare('SELECT * FROM access_logs WHERE user_id = ? ORDER BY granted_at DESC');
        return stmt.all(userId) as AccessLog[];
    }
}

// Singleton instance
export const accessControlService = new AccessControlService();
