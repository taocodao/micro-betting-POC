import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { blockchainService } from '../services/blockchainService.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/blockchain/commit-bets
 * Commit a batch of bets to blockchain (Merkle root)
 */
router.post('/commit-bets', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId, betIds } = req.body;

        if (!eventId || !betIds || !Array.isArray(betIds)) {
            res.status(400).json({
                success: false,
                error: 'eventId and betIds array are required',
            });
            return;
        }

        const commit = blockchainService.commitBetsToBlockchain(eventId, betIds);

        res.status(201).json({
            success: true,
            data: {
                commit_id: commit.id,
                merkle_root: commit.merkle_root,
                tx_hash: commit.tx_hash,
                bet_count: commit.bet_ids.length,
                created_at: commit.created_at,
            },
            message: `${betIds.length} bets committed to blockchain`,
        });
    } catch (error: any) {
        console.error('[Blockchain] Commit error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to commit bets',
        });
    }
});

/**
 * GET /api/blockchain/verify-bet/:betId
 * Verify a bet's Merkle proof
 */
router.get('/verify-bet/:betId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { betId } = req.params;
        const { merkleRoot } = req.query;

        const verification = blockchainService.verifyBetInTree(
            betId,
            merkleRoot as string | undefined
        );

        res.json({
            success: true,
            data: {
                bet_id: betId,
                verified: verification.verified,
                merkle_root: verification.merkleRoot,
                bet_hash: verification.betHash,
            },
        });
    } catch (error) {
        console.error('[Blockchain] Verify error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify bet',
        });
    }
});

/**
 * GET /api/blockchain/commits/event/:eventId
 * Get all Merkle commits for an event
 */
router.get('/commits/event/:eventId', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { eventId } = req.params;
        const commits = blockchainService.getEventCommits(eventId);

        res.json({
            success: true,
            data: commits,
        });
    } catch (error) {
        console.error('[Blockchain] Get commits error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get commits',
        });
    }
});

/**
 * GET /api/blockchain/commit/:merkleRoot
 * Get commit details by Merkle root
 */
router.get('/commit/:merkleRoot', (req: Request, res: Response<ApiResponse>) => {
    try {
        const { merkleRoot } = req.params;
        const commit = blockchainService.getCommitByRoot(merkleRoot);

        if (!commit) {
            res.status(404).json({
                success: false,
                error: 'Commit not found',
            });
            return;
        }

        res.json({
            success: true,
            data: commit,
        });
    } catch (error) {
        console.error('[Blockchain] Get commit error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get commit',
        });
    }
});

export default router;
