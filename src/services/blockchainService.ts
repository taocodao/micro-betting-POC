import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { Bet, MerkleCommit } from '../types/index.js';
import { betsService } from './betsService.js';

/**
 * Blockchain Service
 * Handles Merkle tree creation and blockchain anchoring for bet proofs
 */
export class BlockchainService {
    /**
     * Commit a batch of bets to blockchain (simulated)
     * Creates Merkle tree and stores root
     */
    commitBetsToBlockchain(eventId: string, betIds: string[]): MerkleCommit {
        console.log(`[Blockchain] Committing ${betIds.length} bets for event ${eventId}`);

        // Get all bet data
        const bets = betIds.map(id => betsService.getBet(id)).filter(Boolean) as Bet[];

        if (bets.length === 0) {
            throw new Error('No valid bets to commit');
        }

        // Compute bet hashes
        const betHashes = bets.map(bet => this.computeBetHash(bet));

        // Build Merkle tree
        const merkleRoot = this.buildMerkleTree(betHashes);

        // Simulate blockchain transaction
        const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
        const commitId = uuidv4();

        // Store Merkle root
        const stmt = db.prepare(`
      INSERT INTO merkle_roots (id, event_id, merkle_root, bet_ids, tx_hash)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(commitId, eventId, merkleRoot, JSON.stringify(betIds), txHash);

        // Update each bet with the proof
        for (const betId of betIds) {
            betsService.updateERC8004Proof(betId, merkleRoot);
        }

        console.log(`[Blockchain] Committed Merkle root: ${merkleRoot.slice(0, 18)}... | tx: ${txHash.slice(0, 18)}...`);

        return {
            id: commitId,
            event_id: eventId,
            merkle_root: merkleRoot,
            bet_ids: betIds,
            tx_hash: txHash,
            created_at: new Date().toISOString(),
        };
    }

    /**
     * Compute hash for a single bet
     */
    private computeBetHash(bet: Bet): string {
        const data = `${bet.bet_id}|${bet.user_id}|${bet.market_id}|${bet.amount}|${bet.odds}|${bet.placed_at}|${bet.status}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Build Merkle tree and return root
     */
    private buildMerkleTree(hashes: string[]): string {
        if (hashes.length === 0) {
            throw new Error('Cannot build Merkle tree from empty list');
        }

        // If odd number of hashes, duplicate last one
        if (hashes.length % 2 !== 0) {
            hashes.push(hashes[hashes.length - 1]);
        }

        // Build tree bottom-up
        let currentLevel = hashes;

        while (currentLevel.length > 1) {
            const nextLevel: string[] = [];

            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] || left;
                const combined = crypto
                    .createHash('sha256')
                    .update(left + right)
                    .digest('hex');
                nextLevel.push(combined);
            }

            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }

    /**
     * Verify a bet is included in a Merkle tree
     */
    verifyBetInTree(betId: string, merkleRoot?: string): {
        verified: boolean;
        merkleRoot?: string;
        betHash?: string;
    } {
        const bet = betsService.getBet(betId);

        if (!bet) {
            return { verified: false };
        }

        const betHash = this.computeBetHash(bet);
        const storedProof = bet.erc8004_proof;

        if (merkleRoot) {
            // Verify against provided root (simplified for PoC)
            return {
                verified: storedProof === merkleRoot,
                merkleRoot: storedProof || undefined,
                betHash,
            };
        }

        return {
            verified: !!storedProof,
            merkleRoot: storedProof || undefined,
            betHash,
        };
    }

    /**
     * Get all Merkle commits for an event
     */
    getEventCommits(eventId: string): MerkleCommit[] {
        const stmt = db.prepare(`
      SELECT * FROM merkle_roots 
      WHERE event_id = ? 
      ORDER BY created_at DESC
    `);
        const rows = stmt.all(eventId) as any[];

        return rows.map(row => ({
            ...row,
            bet_ids: JSON.parse(row.bet_ids),
        }));
    }

    /**
     * Get Merkle commit by root
     */
    getCommitByRoot(merkleRoot: string): MerkleCommit | null {
        const stmt = db.prepare('SELECT * FROM merkle_roots WHERE merkle_root = ?');
        const row = stmt.get(merkleRoot) as any;

        if (!row) return null;

        return {
            ...row,
            bet_ids: JSON.parse(row.bet_ids),
        };
    }
}

// Singleton instance
export const blockchainService = new BlockchainService();
