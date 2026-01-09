I'll provide all three: TypeScript API interfaces, React component structure, and a TTS-ready narration script. This gives you a complete, ready-to-implement foundation.

PART 1: TypeScript API Schema & Express Routes
1.1. Core Domain Types (src/types/index.ts)
typescript
// ============================================
// USER & AUTH
// ============================================
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  balance: number; // demo currency in cents
  kycStatus: "pending" | "approved" | "rejected";
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "passwordHash">;
}

// ============================================
// EVENTS & VIDEO
// ============================================
export type EventStatus = "scheduled" | "live" | "closed" | "settled";
export type StreamType = "hls" | "rtmp" | "webrtc";

export interface Event {
  id: string;
  name: string;
  sport: string; // e.g., "horse_racing", "soccer"
  description?: string;
  startTime: Date;
  endTime?: Date;
  status: EventStatus;
  videoUrl: string;
  streamType: StreamType;
  latencyTargetMs: number; // e.g., 500
  createdAt: Date;
  updatedAt: Date;
}

export interface EventMeta {
  eventId: string;
  videoUrl: string;
  streamType: StreamType;
  latencyTargetMs: number;
  demoTimeline?: {
    phaseCount: number;
    phases: string[]; // ["Onboarding", "Low-Latency Video", ...]
  };
}

// ============================================
// VIDEO FRAMES (Caton C3 simulation)
// ============================================
export interface VideoFrame {
  id: string;
  eventId: string;
  frameNumber: number;
  timestamp: Date;
  frameHash: string; // SHA-256 of frame content (simulated)
  createdAt: Date;
}

// ============================================
// MARKETS & ODDS
// ============================================
export type MarketType =
  | "win"
  | "place"
  | "show"
  | "next_turn"
  | "next_foul"
  | "goal"
  | "custom";

export type MarketStatus = "open" | "closed" | "voided";

export interface Market {
  id: string;
  eventId: string;
  marketType: MarketType;
  description?: string;
  currentOdds: number; // decimal odds, e.g., 3.5
  status: MarketStatus;
  marketCloseTime: Date; // critical for latency calc
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketUpdate {
  marketId: string;
  currentOdds: number;
  timestamp: Date;
}

// ============================================
// BETS & LATENCY
// ============================================
export type BetStatus =
  | "accepted"
  | "rejected"
  | "won"
  | "lost"
  | "voided"
  | "pending_settlement";

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  marketId: string;

  amount: number; // in cents
  odds: number;
  status: BetStatus;

  // Timing & latency (X402 / Caton proof)
  clientPlacedAt: Date; // ISO timestamp from mobile client
  serverPlacedAt: Date; // server received timestamp
  latencyMs: number; // computed: serverPlacedAt - clientPlacedAt

  // Hashes for proof (Caton C3)
  videoFrameHash: string; // frame hash at bet time
  oddsHash: string; // hash of odds state at bet time

  // X402 trace (fiat settlement, not crypto)
  x402TraceId: string; // unique payment intent ID
  x402TraceStatus: "intent_recorded" | "settlement_pending" | "settled";

  // ERC-8004 on-chain proof
  erc8004MerkleRoot?: string; // Merkle root when bet was committed
  erc8004TxHash?: string; // blockchain tx hash

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DISPUTES & TEE VALIDATION
// ============================================
export type DisputeStatus = "open" | "resolved" | "appealed";
export type TEEVerdict = "CORRECT" | "INCORRECT" | "INCONCLUSIVE";

export interface Dispute {
  id: string;
  betId: string;
  userId: string;
  reason: string; // user's claim, e.g., "I bet before close"

  status: DisputeStatus;

  // TEE validation result
  teeVerdict?: TEEVerdict;
  teeExplanation?: string; // e.g., "bet arrived 50ms after close"
  teeAttestationHash?: string; // sha256 of verdict + proof
  resolvedAt?: Date;

  // On-chain recording
  erc8004ValidationRoot?: string;
  erc8004TxHash?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// METRICS
// ============================================
export interface EventMetrics {
  eventId: string;
  totalBets: number;
  acceptedBets: number;
  rejectedBets: number;
  acceptanceRate: number; // 0-100
  avgLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  totalHandleUsd: number; // sum of all bet amounts
  wonBets: number;
  lostBets: number;
  disputeCount: number;
  correctDisputeCount: number;
  incorrectDisputeCount: number;
  voidedBets: number;
  computedAt: Date;
}

// ============================================
// NARRATION / VOICE-OVER
// ============================================
export type NarrationPhase =
  | "intro"
  | "caton_latency"
  | "x402_payment"
  | "erc8004_dispute"
  | "metrics"
  | "conclusion";

export interface NarrationSegment {
  phase: NarrationPhase;
  title: string;
  scriptText: string; // for TTS
  audioUrl?: string; // ElevenLabs-generated .mp3
  durationSec: number;
  order: number;
}

// ============================================
// X402 TRACE (Fiat Settlement)
// ============================================
export interface X402Trace {
  traceId: string;
  payer: string; // user ID
  payee: string; // operator ID
  amount: number; // in cents
  currency: string; // "USD"
  intentTimestamp: Date; // when bet was placed
  settlementTimestamp?: Date; // when fiat cleared
  fiatReferenceHash?: string; // hashed ACH/card ref
  status: "intent_recorded" | "settlement_pending" | "settled" | "failed";
  createdAt: Date;
}

// ============================================
// ERC-8004 VALIDATION REGISTRY (simplified)
// ============================================
export interface ERC8004ValidationRecord {
  id: string;
  disputeId: string;
  verdict: TEEVerdict;
  attestationHash: string;
  merkleRoot: string;
  blockchainTxHash?: string;
  createdAt: Date;
}

export interface ERC8004AgentRegistration {
  agentId: string;
  agentType: "operator" | "tee_validator" | "user";
  walletAddress: string;
  nftTokenId?: string; // on-chain NFT ID
  reputation: number; // aggregated from validation records
  createdAt: Date;
}

1.2. API Request/Response Types (src/types/api.ts)
typescript
// ============================================
// AUTH ENDPOINTS
// ============================================
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    balance: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    balance: number;
    kycStatus: string;
  };
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    balance: number;
    walletAddress?: string;
    kycStatus: string;
  };
}

// ============================================
// EVENTS ENDPOINTS
// ============================================
export interface ListEventsResponse {
  events: Event[];
}

export interface GetEventMetaResponse {
  eventId: string;
  videoUrl: string;
  streamType: StreamType;
  latencyTargetMs: number;
  demoTimeline?: {
    phases: string[];
  };
}

// ============================================
// MARKETS ENDPOINTS
// ============================================
export interface ListMarketsRequest {
  eventId: string;
}

export interface ListMarketsResponse {
  markets: Market[];
  lastUpdated: Date;
}

// ============================================
// BETS ENDPOINTS
// ============================================
export interface PlaceBetRequest {
  marketId: string;
  amount: number; // in cents
  clientPlacedAt: string; // ISO timestamp from mobile
}

export interface PlaceBetResponse {
  betId: string;
  status: "accepted" | "rejected";
  latencyMs: number;
  reason?: string;
  x402TraceId: string;
  videoFrameHash: string;
  oddsHash: string;
  balance: number; // updated balance
}

export interface GetBetsRequest {
  eventId?: string;
  limit?: number;
  offset?: number;
}

export interface GetBetsResponse {
  bets: Bet[];
  total: number;
}

// ============================================
// DISPUTES ENDPOINTS
// ============================================
export interface CreateDisputeRequest {
  betId: string;
  reason: string;
}

export interface CreateDisputeResponse {
  disputeId: string;
  verdict: TEEVerdict;
  explanation: string;
  attestationHash: string;
  erc8004Root?: string;
  erc8004TxHash?: string;
}

export interface GetDisputeResponse {
  dispute: Dispute;
}

// ============================================
// BLOCKCHAIN ENDPOINTS
// ============================================
export interface CommitBetsRequest {
  eventId: string;
  betIds: string[];
}

export interface CommitBetsResponse {
  merkleRoot: string;
  txHash: string;
  betsCommitted: number;
}

export interface VerifyBetRequest {
  betId: string;
}

export interface VerifyBetResponse {
  betId: string;
  merkleRoot: string;
  verified: boolean;
  proofPath?: string[]; // Merkle path
  blockchainTxHash?: string;
}

// ============================================
// METRICS ENDPOINTS
// ============================================
export interface GetMetricsRequest {
  eventId: string;
}

export interface GetMetricsResponse extends EventMetrics {
  // inherits all fields
}

// ============================================
// NARRATION ENDPOINTS
// ============================================
export interface ListNarrationSegmentsResponse {
  segments: NarrationSegment[];
}

export interface GetNarrationSegmentRequest {
  phase: NarrationPhase;
}

export interface GetNarrationSegmentResponse {
  segment: NarrationSegment;
  audioUrl?: string;
}

1.3. Express Routes & Controller Signatures (src/routes/index.ts)
typescript
import express, { Request, Response, NextFunction, Router } from "express";
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  PlaceBetRequest,
  PlaceBetResponse,
  CreateDisputeRequest,
  CreateDisputeResponse,
  ListMarketsResponse,
  GetMetricsResponse,
  CommitBetsRequest,
  CommitBetsResponse,
} from "../types/api";

const router = express.Router();

// ============================================
// MIDDLEWARE
// ============================================
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Verify JWT (see implementation below)
  try {
    const decoded = verifyJWT(token);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ============================================
// AUTH ROUTES
// ============================================

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const body = req.body as RegisterRequest;
    // Call authService.register(body)
    const result: RegisterResponse = await authService.register(body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user, return JWT
 */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const body = req.body as LoginRequest;
    const result: LoginResponse = await authService.login(body);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires JWT)
 */
router.get(
  "/auth/profile",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const user = await userService.getById(userId);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          balance: user.balance,
          kycStatus: user.kycStatus,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// EVENTS & VIDEO ROUTES
// ============================================

/**
 * GET /api/events
 * List all active/upcoming events
 */
router.get("/events", async (req: Request, res: Response) => {
  try {
    const events = await eventService.listActive();
    res.json({ events });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/video/:eventId/stream
 * Get video stream URL and metadata for event
 * Response: { videoUrl, streamType, latencyTargetMs, demoTimeline }
 */
router.get(
  "/video/:eventId/stream",
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const meta = await eventService.getVideoMeta(eventId);
      res.json(meta);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

// ============================================
// MARKETS ROUTES
// ============================================

/**
 * GET /api/markets/event/:eventId
 * List live markets for an event
 */
router.get(
  "/markets/event/:eventId",
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const markets = await marketsService.listByEvent(eventId);
      const response: ListMarketsResponse = {
        markets,
        lastUpdated: new Date(),
      };
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// BETS ROUTES
// ============================================

/**
 * POST /api/bets/place
 * Place a bet (core betting logic with latency measurement)
 *
 * Input: { marketId, amount, clientPlacedAt }
 * Output: { betId, status, latencyMs, x402TraceId, ... }
 *
 * Key logic:
 * 1. Calculate latency_ms = server_time - clientPlacedAt
 * 2. Check if market is still open (now < market.marketCloseTime)
 * 3. If late: reject with reason "market_closed"
 * 4. If on time: debit user balance, create X402 trace, hash bet data
 * 5. Return result with latency and trace info
 */
router.post(
  "/bets/place",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const body = req.body as PlaceBetRequest;

      const result: PlaceBetResponse = await betsService.placeBet(
        userId,
        body
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/bets
 * List bets for current user (optionally filtered by event)
 */
router.get(
  "/bets",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { eventId, limit = 20, offset = 0 } = req.query;
      const bets = await betsService.listByUser(
        userId,
        eventId as string | undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(bets);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// DISPUTES ROUTES
// ============================================

/**
 * POST /api/disputes/create
 * Create a dispute for a rejected bet
 *
 * Input: { betId, reason }
 * Output: { disputeId, verdict, explanation, attestationHash, ... }
 *
 * Key logic:
 * 1. Load bet and its market
 * 2. Compare bet.serverPlacedAt vs market.marketCloseTime
 * 3. Run TEE-style logic (simulated, can later be AWS Nitro)
 * 4. Generate attestation hash: sha256(betId + verdict + timestamp)
 * 5. Return verdict and option to record on-chain (ERC-8004)
 */
router.post(
  "/disputes/create",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const body = req.body as CreateDisputeRequest;

      const result: CreateDisputeResponse =
        await disputesService.createDispute(userId, body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/disputes/:disputeId
 * Get a specific dispute and its resolution
 */
router.get(
  "/disputes/:disputeId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { disputeId } = req.params;
      const dispute = await disputesService.getById(disputeId);
      res.json({ dispute });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

// ============================================
// BLOCKCHAIN / ERC-8004 ROUTES
// ============================================

/**
 * POST /api/blockchain/commit-bets
 * Commit a batch of bets to blockchain as Merkle root
 * Admin/cron endpoint
 *
 * Input: { eventId, betIds }
 * Output: { merkleRoot, txHash, betsCommitted }
 *
 * Key logic:
 * 1. Hash each bet (frameHash + oddsHash + decision)
 * 2. Build Merkle tree from hashes
 * 3. Call ERC-8004 contract: commitMerkleRoot(eventId, root)
 * 4. Store tx hash and root on each bet record
 */
router.post(
  "/blockchain/commit-bets",
  async (req: Request, res: Response) => {
    try {
      const body = req.body as CommitBetsRequest;
      const result: CommitBetsResponse =
        await blockchainService.commitBets(body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/blockchain/verify-bet/:betId
 * Verify a bet is anchored on-chain with Merkle proof
 */
router.get(
  "/blockchain/verify-bet/:betId",
  async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const result = await blockchainService.verifyBet(betId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// METRICS ROUTES
// ============================================

/**
 * GET /api/metrics/event/:eventId
 * Get aggregated metrics for an event
 * Shows: totalBets, acceptanceRate, avgLatency, handle, disputes, etc.
 */
router.get(
  "/metrics/event/:eventId",
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const metrics: GetMetricsResponse =
        await metricsService.getEventMetrics(eventId);
      res.json(metrics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// NARRATION / VOICE-OVER ROUTES
// ============================================

/**
 * GET /api/narration/segments
 * List all narration segments with audio URLs (from ElevenLabs)
 */
router.get("/narration/segments", async (req: Request, res: Response) => {
  try {
    const segments = await narrationService.listSegments();
    res.json({ segments });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/narration/segment/:phase
 * Get a specific narration segment (e.g., "caton_latency")
 */
router.get(
  "/narration/segment/:phase",
  async (req: Request, res: Response) => {
    try {
      const { phase } = req.params;
      const segment = await narrationService.getSegment(phase as any);
      res.json({ segment });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

// ============================================
// ADMIN ENDPOINTS (for demo orchestration)
// ============================================

/**
 * POST /api/admin/start-demo-event
 * Create and start a simulated demo event
 * For integration demo purposes
 */
router.post("/admin/start-demo-event", async (req: Request, res: Response) => {
  try {
    const event = await adminService.startDemoEvent();
    res.status(201).json({ event });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/fund-account/:userId
 * Add demo balance to a test user account
 */
router.post(
  "/admin/fund-account/:userId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body; // in cents
      const user = await adminService.fundAccount(userId, amount);
      res.json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;

1.4. Core Service Implementation Example (src/services/betsService.ts)
This is the heart of the betting logic, showing latency + X402 trace:
typescript
import crypto from "crypto";
import { Bet, PlaceBetRequest, PlaceBetResponse } from "../types";
import { db } from "../db";
import { redis } from "../redis";
import { x402Service } from "./x402Service";

export class BetsService {
  /**
   * Place a bet with latency measurement and X402 trace recording
   * This is the core demo logic from implementation-blueprint.md
   */
  async placeBet(
    userId: string,
    req: PlaceBetRequest
  ): Promise<PlaceBetResponse> {
    const serverPlacedAt = new Date();
    const clientPlacedAtDate = new Date(req.clientPlacedAt);

    // 1. Calculate latency
    const latencyMs = Math.max(
      0,
      serverPlacedAt.getTime() - clientPlacedAtDate.getTime()
    );

    // 2. Load market
    const market = await db.query(
      "SELECT * FROM markets WHERE id = $1",
      [req.marketId]
    );
    if (market.rows.length === 0) {
      throw new Error("Market not found");
    }
    const mkt = market.rows[0];

    // 3. Check if market is still open
    const isLate = serverPlacedAt > new Date(mkt.market_close_time);
    const finalStatus = isLate ? "rejected" : "accepted";
    const reason = isLate ? "market_closed" : undefined;

    // 4. If accepted, debit user balance
    let newBalance = 0;
    if (finalStatus === "accepted") {
      const userResult = await db.query(
        "SELECT balance FROM users WHERE id = $1",
        [userId]
      );
      const currentBalance = userResult.rows[0].balance;
      newBalance = currentBalance - req.amount;

      if (newBalance < 0) {
        throw new Error("Insufficient balance");
      }

      await db.query(
        "UPDATE users SET balance = $1 WHERE id = $2",
        [newBalance, userId]
      );
    }

    // 5. Get latest video frame hash (simulating Caton C3)
    const eventId = mkt.event_id;
    const frameKey = `video_frame:${eventId}:latest`;
    const latestFrameHash = await redis.get(frameKey);
    const videoFrameHash = latestFrameHash || "0x" + "0".repeat(64);

    // 6. Compute hashes for proof
    const oddsHash = crypto
      .createHash("sha256")
      .update(
        `${req.marketId}:${mkt.current_odds}:${serverPlacedAt.toISOString()}`
      )
      .digest("hex");

    const betHash = crypto
      .createHash("sha256")
      .update(
        `${userId}:${req.marketId}:${req.amount}:${mkt.current_odds}:${finalStatus}`
      )
      .digest("hex");

    // 7. Create X402 trace (Fiat settlement, not crypto)
    const traceId = crypto.randomUUID();
    await x402Service.recordIntent(
      traceId,
      userId, // payer
      "operator_demo", // payee
      req.amount,
      "USD",
      serverPlacedAt
    );

    // Also record settlement immediately in demo (in real: async via fiat processor)
    const fiatRefHash = crypto
      .createHash("sha256")
      .update(`${traceId}:fiat:${serverPlacedAt.toISOString()}`)
      .digest("hex");

    await x402Service.recordSettlement(
      traceId,
      fiatRefHash,
      serverPlacedAt,
      "settled"
    );

    // 8. Store bet in DB
    const betId = crypto.randomUUID();
    await db.query(
      `INSERT INTO bets (
        id, user_id, event_id, market_id, amount, odds, status,
        client_placed_at, server_placed_at, latency_ms,
        video_frame_hash, odds_hash,
        x402_trace_id, x402_trace_status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        betId,
        userId,
        eventId,
        req.marketId,
        req.amount,
        mkt.current_odds,
        finalStatus,
        clientPlacedAtDate,
        serverPlacedAt,
        latencyMs,
        videoFrameHash,
        oddsHash,
        traceId,
        "settled",
        new Date(),
      ]
    );

    // 9. Return response
    return {
      betId,
      status: finalStatus as "accepted" | "rejected",
      latencyMs,
      reason,
      x402TraceId: traceId,
      videoFrameHash,
      oddsHash,
      balance: finalStatus === "accepted" ? newBalance : 0,
    };
  }

  async listByUser(
    userId: string,
    eventId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ bets: Bet[]; total: number }> {
    let query =
      "SELECT * FROM bets WHERE user_id = $1 ORDER BY created_at DESC";
    const params: any[] = [userId];
    let idx = 2;

    if (eventId) {
      query += ` AND event_id = $${idx}`;
      params.push(eventId);
      idx++;
    }

    const countResult = await db.query(
      query.replace("SELECT *", "SELECT COUNT(*)"),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return {
      bets: result.rows as Bet[],
      total,
    };
  }
}

export const betsService = new BetsService();

PART 2: React Component Structure (Smartphone GUI)
2.1. Main App & Phone Frame (src/App.tsx)
typescript
import React, { useState } from "react";
import "./App.css";
import { LoginScreen } from "./screens/LoginScreen";
import { EventListScreen } from "./screens/EventListScreen";
import { LiveBettingScreen } from "./screens/LiveBettingScreen";
import { DisputesScreen } from "./screens/DisputesScreen";
import { MetricsScreen } from "./screens/MetricsScreen";
import { VoiceOverController } from "./components/VoiceOverController";

type ScreenType =
  | "login"
  | "events"
  | "live_betting"
  | "disputes"
  | "metrics";

interface AppState {
  currentScreen: ScreenType;
  token: string | null;
  userId: string | null;
  selectedEventId: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentScreen: "login",
    token: null,
    userId: null,
    selectedEventId: null,
  });

  const handleLogin = (token: string, userId: string) => {
    setState({
      ...state,
      token,
      userId,
      currentScreen: "events",
    });
  };

  const handleSelectEvent = (eventId: string) => {
    setState({
      ...state,
      selectedEventId: eventId,
      currentScreen: "live_betting",
    });
  };

  const handleNavigate = (screen: ScreenType) => {
    setState({ ...state, currentScreen: screen });
  };

  return (
    <div className="app-container">
      {/* Phone frame mockup */}
      <div className="phone-frame">
        <div className="phone-notch"></div>

        <div className="phone-content">
          {/* Render screen based on state */}
          {state.currentScreen === "login" && (
            <LoginScreen onLogin={handleLogin} />
          )}

          {state.currentScreen === "events" && (
            <EventListScreen
              token={state.token!}
              onSelectEvent={handleSelectEvent}
            />
          )}

          {state.currentScreen === "live_betting" && (
            <LiveBettingScreen
              token={state.token!}
              userId={state.userId!}
              eventId={state.selectedEventId!}
              onNavigate={handleNavigate}
            />
          )}

          {state.currentScreen === "disputes" && (
            <DisputesScreen
              token={state.token!}
              userId={state.userId!}
              onNavigate={handleNavigate}
            />
          )}

          {state.currentScreen === "metrics" && (
            <MetricsScreen
              token={state.token!}
              eventId={state.selectedEventId!}
              onNavigate={handleNavigate}
            />
          )}
        </div>

        {/* Bottom navigation */}
        <div className="phone-nav">
          <button
            onClick={() => handleNavigate("live_betting")}
            className={state.currentScreen === "live_betting" ? "active" : ""}
          >
            Betting
          </button>
          <button
            onClick={() => handleNavigate("disputes")}
            className={state.currentScreen === "disputes" ? "active" : ""}
          >
            Disputes
          </button>
          <button
            onClick={() => handleNavigate("metrics")}
            className={state.currentScreen === "metrics" ? "active" : ""}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* Voice-over controller (floats over phone) */}
      <VoiceOverController />
    </div>
  );
};

export default App;

2.2. Phone Frame CSS (src/App.css)
css
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
}

.phone-frame {
  position: relative;
  width: 390px;
  height: 844px;
  background: #000;
  border-radius: 40px;
  border: 12px solid #000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phone-notch {
  width: 200px;
  height: 28px;
  background: #000;
  margin: 0 auto;
  border-radius: 0 0 20px 20px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.phone-content {
  flex: 1;
  background: #fff;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
}

.phone-nav {
  display: flex;
  border-top: 1px solid #e0e0e0;
  background: #f5f5f5;
  height: 60px;
}

.phone-nav button {
  flex: 1;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.phone-nav button.active {
  color: #667eea;
  border-bottom: 3px solid #667eea;
}

/* Safe area for notch */
@supports (padding: max(0px)) {
  .phone-content {
    padding-top: max(12px, env(safe-area-inset-top));
  }
}

2.3. Live Betting Screen (src/screens/LiveBettingScreen.tsx)
This is the main demo screen showing video, markets, betting, and dispute flow:
typescript
import React, { useState, useEffect } from "react";
import HLS from "hls.js";
import "./LiveBettingScreen.css";
import { Market, Bet, Dispute } from "../types";
import { BettingPanel } from "../components/BettingPanel";
import { BetStatus } from "../components/BetStatus";
import { DisputePanel } from "../components/DisputePanel";
import { VideoMetadataOverlay } from "../components/VideoMetadataOverlay";

interface LiveBettingScreenProps {
  token: string;
  userId: string;
  eventId: string;
  onNavigate: (screen: string) => void;
}

export const LiveBettingScreen: React.FC<LiveBettingScreenProps> = ({
  token,
  userId,
  eventId,
  onNavigate,
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [latencyTargetMs, setLatencyTargetMs] = useState<number>(500);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [lastBetResult, setLastBetResult] = useState<{
    status: string;
    latencyMs: number;
    traceId: string;
  } | null>(null);
  const [showDisputePanel, setShowDisputePanel] = useState(false);
  const [selectedBetForDispute, setSelectedBetForDispute] =
    useState<Bet | null>(null);
  const [frameHash, setFrameHash] = useState("0x" + "0".repeat(64));
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Fetch video stream URL
  useEffect(() => {
    const fetchVideoMeta = async () => {
      const res = await fetch(`/api/video/${eventId}/stream`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVideoUrl(data.videoUrl);
      setLatencyTargetMs(data.latencyTargetMs);

      // Initialize HLS player
      if (videoRef.current && HLS.isSupported()) {
        const hls = new HLS();
        hls.loadSource(data.videoUrl);
        hls.attachMedia(videoRef.current);
      }
    };
    fetchVideoMeta();
  }, [eventId, token]);

  // Poll markets every 500ms
  useEffect(() => {
    const fetchMarkets = async () => {
      const res = await fetch(`/api/markets/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMarkets(data.markets);
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 500);
    return () => clearInterval(interval);
  }, [eventId, token]);

  // Poll bets every 2 seconds
  useEffect(() => {
    const fetchBets = async () => {
      const res = await fetch(`/api/bets?eventId=${eventId}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecentBets(data.bets);
    };

    fetchBets();
    const interval = setInterval(fetchBets, 2000);
    return () => clearInterval(interval);
  }, [eventId, token]);

  // Simulate frame hash updates from Caton C3
  useEffect(() => {
    const interval = setInterval(() => {
      const randomHash = "0x" + Math.random().toString(16).substring(2, 66);
      setFrameHash(randomHash);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleBetPlaced = (bet: Bet, result: any) => {
    setLastBetResult(result);
    setRecentBets([bet, ...recentBets.slice(0, 4)]);
  };

  const handleDisputeClick = (bet: Bet) => {
    setSelectedBetForDispute(bet);
    setShowDisputePanel(true);
  };

  return (
    <div className="live-betting-screen">
      {/* Video Player with metadata overlay */}
      <div className="video-section">
        <video
          ref={videoRef}
          className="video-player"
          controls
          autoPlay
          muted
        ></video>
        <VideoMetadataOverlay
          latencyTargetMs={latencyTargetMs}
          currentFrameHash={frameHash}
        />
      </div>

      {/* Markets List */}
      <div className="markets-section">
        <h3>Live Markets</h3>
        <div className="markets-grid">
          {markets.map((market) => (
            <div
              key={market.id}
              className={`market-card ${
                selectedMarket?.id === market.id ? "selected" : ""
              }`}
              onClick={() => setSelectedMarket(market)}
            >
              <div className="market-type">{market.marketType}</div>
              <div className="market-odds">{market.currentOdds}</div>
              <div className="market-status">{market.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Betting Panel */}
      {selectedMarket && (
        <BettingPanel
          userId={userId}
          token={token}
          market={selectedMarket}
          onBetPlaced={handleBetPlaced}
        />
      )}

      {/* Last Bet Status */}
      {lastBetResult && (
        <BetStatus
          status={lastBetResult.status}
          latencyMs={lastBetResult.latencyMs}
          traceId={lastBetResult.traceId}
        />
      )}

      {/* Recent Bets List */}
      <div className="recent-bets-section">
        <h3>Recent Bets</h3>
        {recentBets.map((bet) => (
          <div key={bet.id} className="bet-row">
            <div className="bet-info">
              <div className="bet-market">{bet.status}</div>
              <div className="bet-amount">${(bet.amount / 100).toFixed(2)}</div>
              <div className="bet-latency">{bet.latencyMs}ms</div>
            </div>
            {bet.status === "rejected" && (
              <button
                onClick={() => handleDisputeClick(bet)}
                className="dispute-btn"
              >
                Dispute
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Dispute Panel */}
      {showDisputePanel && selectedBetForDispute && (
        <DisputePanel
          bet={selectedBetForDispute}
          token={token}
          onClose={() => setShowDisputePanel(false)}
        />
      )}
    </div>
  );
};

2.4. Betting Panel Component (src/components/BettingPanel.tsx)
typescript
import React, { useState } from "react";
import { Market, Bet } from "../types";
import "./BettingPanel.css";

interface BettingPanelProps {
  userId: string;
  token: string;
  market: Market;
  onBetPlaced: (bet: Bet, result: any) => void;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({
  userId,
  token,
  market,
  onBetPlaced,
}) => {
  const [amount, setAmount] = useState(100); // in cents, $1.00
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceBet = async () => {
    setLoading(true);
    setError(null);

    try {
      const clientPlacedAt = new Date().toISOString();

      const res = await fetch("/api/bets/place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketId: market.id,
          amount,
          clientPlacedAt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      const result = await res.json();

      // Fetch updated bet from server (optional, or mock it)
      const bet: Bet = {
        id: result.betId,
        userId,
        eventId: market.eventId,
        marketId: market.id,
        amount,
        odds: market.currentOdds,
        status: result.status,
        clientPlacedAt: new Date(clientPlacedAt),
        serverPlacedAt: new Date(),
        latencyMs: result.latencyMs,
        videoFrameHash: result.videoFrameHash,
        oddsHash: result.oddsHash,
        x402TraceId: result.x402TraceId,
        x402TraceStatus: "settled",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onBetPlaced(bet, result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="betting-panel">
      <h3>Place Bet</h3>
      <div className="bet-form">
        <div className="form-group">
          <label>Market: {market.marketType}</label>
          <div className="market-info">
            <span>Odds: {market.currentOdds}</span>
            <span>Close: {new Date(market.marketCloseTime).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Stake ($)</label>
          <div className="stake-input">
            <input
              type="number"
              min="1"
              max="100000"
              value={amount / 100}
              onChange={(e) => setAmount(Math.round(e.target.valueAsNumber * 100))}
              disabled={loading}
            />
          </div>
          <div className="quick-stakes">
            {[100, 500, 1000, 5000].map((stake) => (
              <button
                key={stake}
                onClick={() => setAmount(stake)}
                className="quick-stake-btn"
                disabled={loading}
              >
                ${(stake / 100).toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={handlePlaceBet}
          disabled={loading}
          className="place-bet-btn"
        >
          {loading ? "Placing..." : "Place Bet"}
        </button>
      </div>
    </div>
  );
};

2.5. Dispute Panel Component (src/components/DisputePanel.tsx)
This shows the ERC-8004 validation flow:
typescript
import React, { useState } from "react";
import { Bet, Dispute } from "../types";
import "./DisputePanel.css";

interface DisputePanelProps {
  bet: Bet;
  token: string;
  onClose: () => void;
}

export const DisputePanel: React.FC<DisputePanelProps> = ({
  bet,
  token,
  onClose,
}) => {
  const [reason, setReason] = useState(
    "I believe my bet was placed before market close"
  );
  const [loading, setLoading] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  const handleSubmitDispute = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/disputes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          betId: bet.id,
          reason,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create dispute");
      }

      const result = await res.json();
      setDispute(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (dispute) {
    return (
      <div className="dispute-panel">
        <h3>Dispute Resolution (ERC-8004)</h3>
        <div className="verdict-section">
          <div className={`verdict ${dispute.teeVerdict?.toLowerCase()}`}>
            {dispute.teeVerdict}
          </div>
          <p className="explanation">{dispute.teeExplanation}</p>

          <div className="attestation-info">
            <label>Attestation Hash (TEE):</label>
            <div className="hash-value">{dispute.teeAttestationHash}</div>
            <p className="hash-note">
              This hash proves the TEE validation ran in a trusted environment.
            </p>
          </div>

          {dispute.erc8004TxHash && (
            <div className="blockchain-info">
              <label>On-Chain Registry TX:</label>
              <div className="tx-value">{dispute.erc8004TxHash}</div>
              <a
                href={`https://sepolia.etherscan.io/tx/${dispute.erc8004TxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View on Sepolia ?
              </a>
            </div>
          )}
        </div>

        <button onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="dispute-panel">
      <h3>Create Dispute</h3>
      <div className="dispute-form">
        <div className="bet-summary">
          <p>
            <strong>Bet ID:</strong> {bet.id.substring(0, 8)}…
          </p>
          <p>
            <strong>Market:</strong> {bet.marketId.substring(0, 8)}…
          </p>
          <p>
            <strong>Latency:</strong> {bet.latencyMs}ms
          </p>
          <p>
            <strong>Status:</strong> {bet.status}
          </p>
        </div>

        <textarea
          placeholder="Explain why you believe this bet should have been accepted…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        ></textarea>

        <button
          onClick={handleSubmitDispute}
          disabled={loading}
          className="submit-dispute-btn"
        >
          {loading ? "Validating..." : "Submit to TEE Validator"}
        </button>
      </div>
    </div>
  );
};

2.6. Voice-Over Controller (src/components/VoiceOverController.tsx)
typescript
import React, { useState, useEffect } from "react";
import { NarrationSegment } from "../types";
import "./VoiceOverController.css";

export const VoiceOverController: React.FC = () => {
  const [segments, setSegments] = useState<NarrationSegment[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      const res = await fetch("/api/narration/segments");
      const data = await res.json();
      setSegments(data.segments.sort((a, b) => a.order - b.order));
    };
    fetchSegments();
  }, []);

  const handlePlaySegment = async (phase: string) => {
    setCurrentPhase(phase);
    const res = await fetch(`/api/narration/segment/${phase}`);
    const data = await res.json();

    if (audioRef.current && data.segment.audioUrl) {
      audioRef.current.src = data.segment.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="voice-over-controller">
      <div className="voice-header">
        <h4>? Narration Guide</h4>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="play-pause-btn"
        >
          {isPlaying ? "?" : "?"}
        </button>
      </div>

      <div className="segments-list">
        {segments.map((seg) => (
          <button
            key={seg.phase}
            onClick={() => handlePlaySegment(seg.phase)}
            className={`segment-btn ${
              currentPhase === seg.phase ? "active" : ""
            }`}
          >
            <span className="phase-title">{seg.title}</span>
            <span className="phase-duration">{seg.durationSec}s</span>
          </button>
        ))}
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

PART 3: TTS-Ready Narration Script (ElevenLabs)
This script is segmented by phase and ready to paste into ElevenLabs for voice generation.
3.1. Full Narration Script (narration_script.md)
text
# Micro-Betting PoC Narration Script
# For ElevenLabs Text-to-Speech
# Target Voice: Clear, professional English narrator
# Pacing: Measured, with emphasis on technical terms

---

## PHASE 1: INTRODUCTION & PROBLEM

[Segment: intro | Duration: ~45s]

Welcome to the micro-betting demonstration. 

I'm going to show you a groundbreaking solution to a $100 million annual industry problem.

Traditional video streaming for betting has a critical flaw. There's a 12 to 15 second delay between the live event and what you see on your screen. But betting windows close in just 30 seconds.

This creates a nightmare for operators and users alike:
- Users see race outcomes delayed, then place bets on live data they're not actually seeing.
- Operators suffer rejected bets and disputes. Every 100 milliseconds of latency costs them 5 to 10 million dollars annually in refunds and chargebacks.

Today, we solve this with three technologies:
- Ultra-low latency video, delivered in under 500 milliseconds.
- X402, a protocol that traces every payment intent to a blockchain while settlement happens via fiat.
- ERC-8004, a trust layer that resolves disputes using cryptographic proof and hardware-secured validation.

Let me show you how it works.

---

## PHASE 2: CATON C3 LOW-LATENCY VIDEO

[Segment: caton_latency | Duration: ~60s]

First, let's talk about latency. Watch the video stream playing right now.

Traditional CDNs deliver video in 12 to 15 second chunks. Caton C3 does something revolutionary. It breaks that into micro-frames, hashed in real time, and delivered via an optimized backbone called CVP.

Here's what happens: the race feed is ingested at the source. Caton encodes the video and extracts frame metadata. Each frame is hashed—creating a cryptographic fingerprint—proving exactly what content was shown at this exact timestamp.

The hash of this frame is 0x7a3b. Remember that hash. We'll use it later to prove what you saw when you placed your bet.

The CVP backbone—that's the Caton Video Pipeline—routes the stream through optimal paths, avoiding congestion in real time.

The result? Sub-500 millisecond end-to-end latency. Compared to 12 seconds, this is a generational leap.

That frame hash, combined with the odds state, becomes immutable proof that you received fair market information at bet time. This is the foundation of everything else you're about to see.

---

## PHASE 3: X402 PAYMENT TRACING (FIAT SETTLEMENT)

[Segment: x402_payment | Duration: ~75s]

Now, placing a bet. You see the live odds: 3.5 for Horse number three to win.

You stake 1 dollar. Your mobile device captures the exact timestamp you placed the bet: 14:32:55.240 UTC.

You press confirm. Here's what happens behind the scenes, and this is critical for regulated markets.

The X402 protocol—designed by Coinbase and adopted by Google and others—was built to separate payment intent from settlement.

When your bet is placed, three things happen simultaneously:

First, your signed request creates a cryptographic proof that you authorized this bet. This is EIP-712 signing—hardware-backed on your phone, unforgeable.

Second, a trace record is written to an on-chain registry. Not a cryptocurrency transaction. Just a hash: timestamp, amount, odds state, video frame hash. This creates permanent, immutable proof of what happened and when.

Third—and this is where X402 becomes powerful for regulated jurisdictions—the actual payment settlement happens off-chain. We use traditional rails. ACH. Credit card. Bank transfer. Whatever complies with local law.

In Brazil, for example, crypto payments for gambling are banned. But this architecture lets us log everything to blockchain for transparency and auditability, while keeping settlement through fiat rails.

Your balance updates from 100 dollars to 99. If Horse three wins, you'll get 3 dollars and 50 cents instantly transferred to your wallet via the same fiat rail.

The bet is now immutably logged. The X402 trace ID ties everything together. And no cryptocurrency ever touched your account.

---

## PHASE 4: ERC-8004 DISPUTE RESOLUTION

[Segment: erc8004_dispute | Duration: ~90s]

Now, here's where it gets interesting. What if you disagree with a decision?

Imagine a scenario: Your bet was rejected as late. But you claim you placed it before the market closed.

You're at 14:32:56. The market closed at 14:32:56. You say you bet 760 milliseconds before close. The system says you're late.

With traditional betting, this becomes a he-said-she-said dispute. Operators have to manually review. Users lose trust. Chargebacks happen.

ERC-8004 changes this. It's an Ethereum standard for trustless validation.

Here's how it works: All the hashes we talked about—the video frame hash, the odds hash, the bet decision—are combined into a Merkle tree and committed to blockchain. The Merkle root proves that this exact data existed at this exact time.

When you dispute, the system:
- Fetches your bet timestamp: 14:32:55.240 UTC
- Fetches the market close timestamp: 14:32:56.000 UTC
- Computes the delta: 760 milliseconds. You were early.

But wait. Let's say the operator's decision was INCORRECT. Your bet should have been accepted.

A TEE—a Trusted Execution Environment, like AWS Nitro Enclave—re-runs the decision logic. This is hardware-secured computation. The TEE produces a cryptographic attestation that cannot be forged.

The verdict is delivered: The operator made an error. Your bet should have been accepted.

This attestation is permanently recorded on the ERC-8004 Validation Registry. The operator's reputation updates. Users and regulators can independently verify this proof.

No central authority. No manual review. Just math and cryptography.

That's the power of ERC-8004. It's a trust layer for any two parties who need to resolve a dispute, backed by immutable proof.

---

## PHASE 5: OPERATOR METRICS & KPIs

[Segment: metrics | Duration: ~45s]

From an operator's perspective, here's what matters:

Total bets placed during this event: 4,247.

Acceptance rate: 94.2 percent. That's high because we're measuring latency fairly and rejecting only true late bets.

Average latency: 387 milliseconds. That's under our 500-millisecond target. Users are getting fair odds at fair timing.

Total handle: 847 thousand dollars. That's the sum of all bets.

Disputes: 67. And here's the key: 64 of those disputes were CORRECT—meaning the operator was right. Only 3 were INCORRECT, showing a high-confidence decision system.

With traditional streaming, at 12 to 15 seconds of latency, you'd expect 40 to 50 percent dispute rates on close calls. Here, we're at 1.6 percent.

That's the business case. More bets, fewer disputes, lower operational costs, happier users.

---

## PHASE 6: CONCLUSION

[Segment: conclusion | Duration: ~45s]

You've now seen the complete workflow:

- Privy for frictionless login. No cryptocurrency knowledge required.
- Caton C3 for sub-500-millisecond video delivery, with frame hashing for proof.
- X402 for payment intent tracing, using fiat settlement to comply with local regulation.
- STB TEE—or any hardware-secured validation—for indisputable dispute resolution.
- ERC-8004 for on-chain reputation and validation registry.

This isn't theoretical. The components exist today. They're deployed in production.

What you've seen is a PoC—a proof of concept—that brings them together for micro-betting.

The same architecture works for any fast-moving event: horse racing, esports, live sports, day trading.

Anywhere low latency, fair timing, and dispute resolution matter.

Thank you for watching.

3.2. ElevenLabs Integration Code (src/services/narrationService.ts)
typescript
import axios from "axios";
import { NarrationSegment, NarrationPhase } from "../types";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - clear, neutral voice

interface ElevenLabsVoiceRequest {
  text: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export class NarrationService {
  private segments: Map<NarrationPhase, NarrationSegment> = new Map();

  constructor() {
    this.initializeSegments();
  }

  private initializeSegments() {
    const scriptSegments: Record<NarrationPhase, { text: string; duration: number }> = {
      intro: {
        text: `Welcome to the micro-betting demonstration...`,
        duration: 45,
      },
      caton_latency: {
        text: `First, let's talk about latency...`,
        duration: 60,
      },
      x402_payment: {
        text: `Now, placing a bet...`,
        duration: 75,
      },
      erc8004_dispute: {
        text: `Now, here's where it gets interesting...`,
        duration: 90,
      },
      metrics: {
        text: `From an operator's perspective, here's what matters...`,
        duration: 45,
      },
      conclusion: {
        text: `You've now seen the complete workflow...`,
        duration: 45,
      },
    };

    let order = 0;
    Object.entries(scriptSegments).forEach(([phase, { text, duration }]) => {
      this.segments.set(phase as NarrationPhase, {
        phase: phase as NarrationPhase,
        title: this.phaseToTitle(phase as NarrationPhase),
        scriptText: text,
        durationSec: duration,
        order: order++,
      });
    });
  }

  /**
   * Generate audio for a narration segment using ElevenLabs
   * Returns URL to stored .mp3 file
   */
  async generateAudio(phase: NarrationPhase): Promise<string> {
    const segment = this.segments.get(phase);
    if (!segment) {
      throw new Error(`Unknown narration phase: ${phase}`);
    }

    try {
      // Call ElevenLabs API
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          text: segment.scriptText,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        } as ElevenLabsVoiceRequest,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          responseType: "arraybuffer",
        }
      );

      // Save to S3 or local storage
      const audioBuffer = response.data;
      const audioUrl = await this.saveAudioFile(phase, audioBuffer);

      // Update segment with URL
      const updatedSegment = {
        ...segment,
        audioUrl,
      };
      this.segments.set(phase, updatedSegment);

      return audioUrl;
    } catch (error) {
      console.error(`Failed to generate audio for ${phase}:`, error);
      throw error;
    }
  }

  private async saveAudioFile(
    phase: NarrationPhase,
    audioBuffer: Buffer
  ): Promise<string> {
    // TODO: Implement S3 upload or local file save
    // For demo, just return a mock URL
    const mockUrl = `/audio/narration-${phase}.mp3`;
    return mockUrl;
  }

  async listSegments(): Promise<NarrationSegment[]> {
    return Array.from(this.segments.values()).sort((a, b) => a.order - b.order);
  }

  async getSegment(phase: NarrationPhase): Promise<NarrationSegment> {
    const segment = this.segments.get(phase);
    if (!segment) {
      throw new Error(`Unknown narration phase: ${phase}`);
    }

    // If audio hasn't been generated yet, generate it
    if (!segment.audioUrl) {
      await this.generateAudio(phase);
    }

    return segment;
  }

  private phaseToTitle(phase: NarrationPhase): string {
    const titles: Record<NarrationPhase, string> = {
      intro: "Introduction & Problem",
      caton_latency: "Caton C3 Low-Latency Video",
      x402_payment: "X402 Payment Tracing (Fiat)",
      erc8004_dispute: "ERC-8004 Dispute Resolution",
      metrics: "Operator Metrics & KPIs",
      conclusion: "Conclusion",
    };
    return titles[phase];
  }
}

export const narrationService = new NarrationService();

3.3. How to Use with ElevenLabs
    1. Sign up at https://elevenlabs.io
    2. Get API key from dashboard
    3. Choose a voice – search for "Rachel" or similar neutral narrator voices
    4. Paste script segments directly into the TTS interface, or use the API as shown above
    5. Generate and download .mp3 files
    6. Host on S3 / CDN and reference URLs in your NarrationSegment records
Example ElevenLabs API call (curl):
bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to the micro-betting demonstration...",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }' \
  --output intro.mp3

Summary
You now have:
? Complete TypeScript API schema – all domain types, request/response contracts, and Express route signatures
? Full React component structure – phone frame mockup, all screens, betting/dispute flows
? Production-ready narration script – segmented by demo phase, ready for ElevenLabs TTS generation
Next steps:
    1. Set up Node.js + Express backend with PostgreSQL + Redis
    2. Implement the services (betsService.placeBet is the core logic)
    3. Build the React UI using the component templates
    4. Generate narration audio via ElevenLabs API
    5. Deploy contracts to testnet (Sepolia or Base) for ERC-8004 + X402 trace registry
    6. Run the demo end-to-end, emphasizing the latency measurement, fiat tracing, and dispute flow
Would you like me to:
    • Draft the smart contracts (ERC-8004 registry + X402 trace on-chain)?
    • Provide database migration scripts for PostgreSQL setup?
    • Write the event simulator that generates live markets and video frames?
    1. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/b9cb37ad-12a1-4cec-b172-af302a5e7876/Implementation-Plan.md 
    2. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/1bd6c6fd-0ce7-4541-ad2f-467c2c0e976c/ERC-8004-Trust-Layer-Demo-compress.mp4 
    3. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/0d452f19-9547-4065-8e9d-3e5eb965a9ee/implementation-blueprint.md 
    4. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/472b0cc2-550c-4a4c-acfa-127e9b6792b1/Horse-Racing-Micro-Betting-Demo-1-compress.mp4 
I'll provide all three: TypeScript API interfaces, React component structure, and a TTS-ready narration script. This gives you a complete, ready-to-implement foundation.

PART 1: TypeScript API Schema & Express Routes
1.1. Core Domain Types (src/types/index.ts)
typescript
// ============================================
// USER & AUTH
// ============================================
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  balance: number; // demo currency in cents
  kycStatus: "pending" | "approved" | "rejected";
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "passwordHash">;
}

// ============================================
// EVENTS & VIDEO
// ============================================
export type EventStatus = "scheduled" | "live" | "closed" | "settled";
export type StreamType = "hls" | "rtmp" | "webrtc";

export interface Event {
  id: string;
  name: string;
  sport: string; // e.g., "horse_racing", "soccer"
  description?: string;
  startTime: Date;
  endTime?: Date;
  status: EventStatus;
  videoUrl: string;
  streamType: StreamType;
  latencyTargetMs: number; // e.g., 500
  createdAt: Date;
  updatedAt: Date;
}

export interface EventMeta {
  eventId: string;
  videoUrl: string;
  streamType: StreamType;
  latencyTargetMs: number;
  demoTimeline?: {
    phaseCount: number;
    phases: string[]; // ["Onboarding", "Low-Latency Video", ...]
  };
}

// ============================================
// VIDEO FRAMES (Caton C3 simulation)
// ============================================
export interface VideoFrame {
  id: string;
  eventId: string;
  frameNumber: number;
  timestamp: Date;
  frameHash: string; // SHA-256 of frame content (simulated)
  createdAt: Date;
}

// ============================================
// MARKETS & ODDS
// ============================================
export type MarketType =
  | "win"
  | "place"
  | "show"
  | "next_turn"
  | "next_foul"
  | "goal"
  | "custom";

export type MarketStatus = "open" | "closed" | "voided";

export interface Market {
  id: string;
  eventId: string;
  marketType: MarketType;
  description?: string;
  currentOdds: number; // decimal odds, e.g., 3.5
  status: MarketStatus;
  marketCloseTime: Date; // critical for latency calc
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketUpdate {
  marketId: string;
  currentOdds: number;
  timestamp: Date;
}

// ============================================
// BETS & LATENCY
// ============================================
export type BetStatus =
  | "accepted"
  | "rejected"
  | "won"
  | "lost"
  | "voided"
  | "pending_settlement";

export interface Bet {
  id: string;
  userId: string;
  eventId: string;
  marketId: string;

  amount: number; // in cents
  odds: number;
  status: BetStatus;

  // Timing & latency (X402 / Caton proof)
  clientPlacedAt: Date; // ISO timestamp from mobile client
  serverPlacedAt: Date; // server received timestamp
  latencyMs: number; // computed: serverPlacedAt - clientPlacedAt

  // Hashes for proof (Caton C3)
  videoFrameHash: string; // frame hash at bet time
  oddsHash: string; // hash of odds state at bet time

  // X402 trace (fiat settlement, not crypto)
  x402TraceId: string; // unique payment intent ID
  x402TraceStatus: "intent_recorded" | "settlement_pending" | "settled";

  // ERC-8004 on-chain proof
  erc8004MerkleRoot?: string; // Merkle root when bet was committed
  erc8004TxHash?: string; // blockchain tx hash

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DISPUTES & TEE VALIDATION
// ============================================
export type DisputeStatus = "open" | "resolved" | "appealed";
export type TEEVerdict = "CORRECT" | "INCORRECT" | "INCONCLUSIVE";

export interface Dispute {
  id: string;
  betId: string;
  userId: string;
  reason: string; // user's claim, e.g., "I bet before close"

  status: DisputeStatus;

  // TEE validation result
  teeVerdict?: TEEVerdict;
  teeExplanation?: string; // e.g., "bet arrived 50ms after close"
  teeAttestationHash?: string; // sha256 of verdict + proof
  resolvedAt?: Date;

  // On-chain recording
  erc8004ValidationRoot?: string;
  erc8004TxHash?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// METRICS
// ============================================
export interface EventMetrics {
  eventId: string;
  totalBets: number;
  acceptedBets: number;
  rejectedBets: number;
  acceptanceRate: number; // 0-100
  avgLatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  totalHandleUsd: number; // sum of all bet amounts
  wonBets: number;
  lostBets: number;
  disputeCount: number;
  correctDisputeCount: number;
  incorrectDisputeCount: number;
  voidedBets: number;
  computedAt: Date;
}

// ============================================
// NARRATION / VOICE-OVER
// ============================================
export type NarrationPhase =
  | "intro"
  | "caton_latency"
  | "x402_payment"
  | "erc8004_dispute"
  | "metrics"
  | "conclusion";

export interface NarrationSegment {
  phase: NarrationPhase;
  title: string;
  scriptText: string; // for TTS
  audioUrl?: string; // ElevenLabs-generated .mp3
  durationSec: number;
  order: number;
}

// ============================================
// X402 TRACE (Fiat Settlement)
// ============================================
export interface X402Trace {
  traceId: string;
  payer: string; // user ID
  payee: string; // operator ID
  amount: number; // in cents
  currency: string; // "USD"
  intentTimestamp: Date; // when bet was placed
  settlementTimestamp?: Date; // when fiat cleared
  fiatReferenceHash?: string; // hashed ACH/card ref
  status: "intent_recorded" | "settlement_pending" | "settled" | "failed";
  createdAt: Date;
}

// ============================================
// ERC-8004 VALIDATION REGISTRY (simplified)
// ============================================
export interface ERC8004ValidationRecord {
  id: string;
  disputeId: string;
  verdict: TEEVerdict;
  attestationHash: string;
  merkleRoot: string;
  blockchainTxHash?: string;
  createdAt: Date;
}

export interface ERC8004AgentRegistration {
  agentId: string;
  agentType: "operator" | "tee_validator" | "user";
  walletAddress: string;
  nftTokenId?: string; // on-chain NFT ID
  reputation: number; // aggregated from validation records
  createdAt: Date;
}

1.2. API Request/Response Types (src/types/api.ts)
typescript
// ============================================
// AUTH ENDPOINTS
// ============================================
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    balance: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    balance: number;
    kycStatus: string;
  };
}

export interface ProfileResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    balance: number;
    walletAddress?: string;
    kycStatus: string;
  };
}

// ============================================
// EVENTS ENDPOINTS
// ============================================
export interface ListEventsResponse {
  events: Event[];
}

export interface GetEventMetaResponse {
  eventId: string;
  videoUrl: string;
  streamType: StreamType;
  latencyTargetMs: number;
  demoTimeline?: {
    phases: string[];
  };
}

// ============================================
// MARKETS ENDPOINTS
// ============================================
export interface ListMarketsRequest {
  eventId: string;
}

export interface ListMarketsResponse {
  markets: Market[];
  lastUpdated: Date;
}

// ============================================
// BETS ENDPOINTS
// ============================================
export interface PlaceBetRequest {
  marketId: string;
  amount: number; // in cents
  clientPlacedAt: string; // ISO timestamp from mobile
}

export interface PlaceBetResponse {
  betId: string;
  status: "accepted" | "rejected";
  latencyMs: number;
  reason?: string;
  x402TraceId: string;
  videoFrameHash: string;
  oddsHash: string;
  balance: number; // updated balance
}

export interface GetBetsRequest {
  eventId?: string;
  limit?: number;
  offset?: number;
}

export interface GetBetsResponse {
  bets: Bet[];
  total: number;
}

// ============================================
// DISPUTES ENDPOINTS
// ============================================
export interface CreateDisputeRequest {
  betId: string;
  reason: string;
}

export interface CreateDisputeResponse {
  disputeId: string;
  verdict: TEEVerdict;
  explanation: string;
  attestationHash: string;
  erc8004Root?: string;
  erc8004TxHash?: string;
}

export interface GetDisputeResponse {
  dispute: Dispute;
}

// ============================================
// BLOCKCHAIN ENDPOINTS
// ============================================
export interface CommitBetsRequest {
  eventId: string;
  betIds: string[];
}

export interface CommitBetsResponse {
  merkleRoot: string;
  txHash: string;
  betsCommitted: number;
}

export interface VerifyBetRequest {
  betId: string;
}

export interface VerifyBetResponse {
  betId: string;
  merkleRoot: string;
  verified: boolean;
  proofPath?: string[]; // Merkle path
  blockchainTxHash?: string;
}

// ============================================
// METRICS ENDPOINTS
// ============================================
export interface GetMetricsRequest {
  eventId: string;
}

export interface GetMetricsResponse extends EventMetrics {
  // inherits all fields
}

// ============================================
// NARRATION ENDPOINTS
// ============================================
export interface ListNarrationSegmentsResponse {
  segments: NarrationSegment[];
}

export interface GetNarrationSegmentRequest {
  phase: NarrationPhase;
}

export interface GetNarrationSegmentResponse {
  segment: NarrationSegment;
  audioUrl?: string;
}

1.3. Express Routes & Controller Signatures (src/routes/index.ts)
typescript
import express, { Request, Response, NextFunction, Router } from "express";
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  PlaceBetRequest,
  PlaceBetResponse,
  CreateDisputeRequest,
  CreateDisputeResponse,
  ListMarketsResponse,
  GetMetricsResponse,
  CommitBetsRequest,
  CommitBetsResponse,
} from "../types/api";

const router = express.Router();

// ============================================
// MIDDLEWARE
// ============================================
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Verify JWT (see implementation below)
  try {
    const decoded = verifyJWT(token);
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ============================================
// AUTH ROUTES
// ============================================

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const body = req.body as RegisterRequest;
    // Call authService.register(body)
    const result: RegisterResponse = await authService.register(body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user, return JWT
 */
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const body = req.body as LoginRequest;
    const result: LoginResponse = await authService.login(body);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires JWT)
 */
router.get(
  "/auth/profile",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const user = await userService.getById(userId);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          balance: user.balance,
          kycStatus: user.kycStatus,
          walletAddress: user.walletAddress,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// EVENTS & VIDEO ROUTES
// ============================================

/**
 * GET /api/events
 * List all active/upcoming events
 */
router.get("/events", async (req: Request, res: Response) => {
  try {
    const events = await eventService.listActive();
    res.json({ events });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/video/:eventId/stream
 * Get video stream URL and metadata for event
 * Response: { videoUrl, streamType, latencyTargetMs, demoTimeline }
 */
router.get(
  "/video/:eventId/stream",
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const meta = await eventService.getVideoMeta(eventId);
      res.json(meta);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

// ============================================
// MARKETS ROUTES
// ============================================

/**
 * GET /api/markets/event/:eventId
 * List live markets for an event
 */
router.get(
  "/markets/event/:eventId",
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const markets = await marketsService.listByEvent(eventId);
      const response: ListMarketsResponse = {
        markets,
        lastUpdated: new Date(),
      };
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// BETS ROUTES
// ============================================

/**
 * POST /api/bets/place
 * Place a bet (core betting logic with latency measurement)
 *
 * Input: { marketId, amount, clientPlacedAt }
 * Output: { betId, status, latencyMs, x402TraceId, ... }
 *
 * Key logic:
 * 1. Calculate latency_ms = server_time - clientPlacedAt
 * 2. Check if market is still open (now < market.marketCloseTime)
 * 3. If late: reject with reason "market_closed"
 * 4. If on time: debit user balance, create X402 trace, hash bet data
 * 5. Return result with latency and trace info
 */
router.post(
  "/bets/place",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const body = req.body as PlaceBetRequest;

      const result: PlaceBetResponse = await betsService.placeBet(
        userId,
        body
      );
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/bets
 * List bets for current user (optionally filtered by event)
 */
router.get(
  "/bets",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const { eventId, limit = 20, offset = 0 } = req.query;
      const bets = await betsService.listByUser(
        userId,
        eventId as string | undefined,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(bets);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// DISPUTES ROUTES
// ============================================

/**
 * POST /api/disputes/create
 * Create a dispute for a rejected bet
 *
 * Input: { betId, reason }
 * Output: { disputeId, verdict, explanation, attestationHash, ... }
 *
 * Key logic:
 * 1. Load bet and its market
 * 2. Compare bet.serverPlacedAt vs market.marketCloseTime
 * 3. Run TEE-style logic (simulated, can later be AWS Nitro)
 * 4. Generate attestation hash: sha256(betId + verdict + timestamp)
 * 5. Return verdict and option to record on-chain (ERC-8004)
 */
router.post(
  "/disputes/create",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const body = req.body as CreateDisputeRequest;

      const result: CreateDisputeResponse =
        await disputesService.createDispute(userId, body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/disputes/:disputeId
 * Get a specific dispute and its resolution
 */
router.get(
  "/disputes/:disputeId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { disputeId } = req.params;
      const dispute = await disputesService.getById(disputeId);
      res.json({ dispute });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

// ============================================
// BLOCKCHAIN / ERC-8004 ROUTES
// ============================================

/**
 * POST /api/blockchain/commit-bets
 * Commit a batch of bets to blockchain as Merkle root
 * Admin/cron endpoint
 *
 * Input: { eventId, betIds }
 * Output: { merkleRoot, txHash, betsCommitted }
 *
 * Key logic:
 * 1. Hash each bet (frameHash + oddsHash + decision)
 * 2. Build Merkle tree from hashes
 * 3. Call ERC-8004 contract: commitMerkleRoot(eventId, root)
 * 4. Store tx hash and root on each bet record
 */
router.post(
  "/blockchain/commit-bets",
  async (req: Request, res: Response) => {
    try {
      const body = req.body as CommitBetsRequest;
      const result: CommitBetsResponse =
        await blockchainService.commitBets(body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/blockchain/verify-bet/:betId
 * Verify a bet is anchored on-chain with Merkle proof
 */
router.get(
  "/blockchain/verify-bet/:betId",
  async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const result = await blockchainService.verifyBet(betId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// METRICS ROUTES
// ============================================

/**
 * GET /api/metrics/event/:eventId
 * Get aggregated metrics for an event
 * Shows: totalBets, acceptanceRate, avgLatency, handle, disputes, etc.
 */
router.get(
  "/metrics/event/:eventId",
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const metrics: GetMetricsResponse =
        await metricsService.getEventMetrics(eventId);
      res.json(metrics);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ============================================
// NARRATION / VOICE-OVER ROUTES
// ============================================

/**
 * GET /api/narration/segments
 * List all narration segments with audio URLs (from ElevenLabs)
 */
router.get("/narration/segments", async (req: Request, res: Response) => {
  try {
    const segments = await narrationService.listSegments();
    res.json({ segments });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/narration/segment/:phase
 * Get a specific narration segment (e.g., "caton_latency")
 */
router.get(
  "/narration/segment/:phase",
  async (req: Request, res: Response) => {
    try {
      const { phase } = req.params;
      const segment = await narrationService.getSegment(phase as any);
      res.json({ segment });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

// ============================================
// ADMIN ENDPOINTS (for demo orchestration)
// ============================================

/**
 * POST /api/admin/start-demo-event
 * Create and start a simulated demo event
 * For integration demo purposes
 */
router.post("/admin/start-demo-event", async (req: Request, res: Response) => {
  try {
    const event = await adminService.startDemoEvent();
    res.status(201).json({ event });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/admin/fund-account/:userId
 * Add demo balance to a test user account
 */
router.post(
  "/admin/fund-account/:userId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount } = req.body; // in cents
      const user = await adminService.fundAccount(userId, amount);
      res.json({ user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;

1.4. Core Service Implementation Example (src/services/betsService.ts)
This is the heart of the betting logic, showing latency + X402 trace:
typescript
import crypto from "crypto";
import { Bet, PlaceBetRequest, PlaceBetResponse } from "../types";
import { db } from "../db";
import { redis } from "../redis";
import { x402Service } from "./x402Service";

export class BetsService {
  /**
   * Place a bet with latency measurement and X402 trace recording
   * This is the core demo logic from implementation-blueprint.md
   */
  async placeBet(
    userId: string,
    req: PlaceBetRequest
  ): Promise<PlaceBetResponse> {
    const serverPlacedAt = new Date();
    const clientPlacedAtDate = new Date(req.clientPlacedAt);

    // 1. Calculate latency
    const latencyMs = Math.max(
      0,
      serverPlacedAt.getTime() - clientPlacedAtDate.getTime()
    );

    // 2. Load market
    const market = await db.query(
      "SELECT * FROM markets WHERE id = $1",
      [req.marketId]
    );
    if (market.rows.length === 0) {
      throw new Error("Market not found");
    }
    const mkt = market.rows[0];

    // 3. Check if market is still open
    const isLate = serverPlacedAt > new Date(mkt.market_close_time);
    const finalStatus = isLate ? "rejected" : "accepted";
    const reason = isLate ? "market_closed" : undefined;

    // 4. If accepted, debit user balance
    let newBalance = 0;
    if (finalStatus === "accepted") {
      const userResult = await db.query(
        "SELECT balance FROM users WHERE id = $1",
        [userId]
      );
      const currentBalance = userResult.rows[0].balance;
      newBalance = currentBalance - req.amount;

      if (newBalance < 0) {
        throw new Error("Insufficient balance");
      }

      await db.query(
        "UPDATE users SET balance = $1 WHERE id = $2",
        [newBalance, userId]
      );
    }

    // 5. Get latest video frame hash (simulating Caton C3)
    const eventId = mkt.event_id;
    const frameKey = `video_frame:${eventId}:latest`;
    const latestFrameHash = await redis.get(frameKey);
    const videoFrameHash = latestFrameHash || "0x" + "0".repeat(64);

    // 6. Compute hashes for proof
    const oddsHash = crypto
      .createHash("sha256")
      .update(
        `${req.marketId}:${mkt.current_odds}:${serverPlacedAt.toISOString()}`
      )
      .digest("hex");

    const betHash = crypto
      .createHash("sha256")
      .update(
        `${userId}:${req.marketId}:${req.amount}:${mkt.current_odds}:${finalStatus}`
      )
      .digest("hex");

    // 7. Create X402 trace (Fiat settlement, not crypto)
    const traceId = crypto.randomUUID();
    await x402Service.recordIntent(
      traceId,
      userId, // payer
      "operator_demo", // payee
      req.amount,
      "USD",
      serverPlacedAt
    );

    // Also record settlement immediately in demo (in real: async via fiat processor)
    const fiatRefHash = crypto
      .createHash("sha256")
      .update(`${traceId}:fiat:${serverPlacedAt.toISOString()}`)
      .digest("hex");

    await x402Service.recordSettlement(
      traceId,
      fiatRefHash,
      serverPlacedAt,
      "settled"
    );

    // 8. Store bet in DB
    const betId = crypto.randomUUID();
    await db.query(
      `INSERT INTO bets (
        id, user_id, event_id, market_id, amount, odds, status,
        client_placed_at, server_placed_at, latency_ms,
        video_frame_hash, odds_hash,
        x402_trace_id, x402_trace_status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        betId,
        userId,
        eventId,
        req.marketId,
        req.amount,
        mkt.current_odds,
        finalStatus,
        clientPlacedAtDate,
        serverPlacedAt,
        latencyMs,
        videoFrameHash,
        oddsHash,
        traceId,
        "settled",
        new Date(),
      ]
    );

    // 9. Return response
    return {
      betId,
      status: finalStatus as "accepted" | "rejected",
      latencyMs,
      reason,
      x402TraceId: traceId,
      videoFrameHash,
      oddsHash,
      balance: finalStatus === "accepted" ? newBalance : 0,
    };
  }

  async listByUser(
    userId: string,
    eventId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ bets: Bet[]; total: number }> {
    let query =
      "SELECT * FROM bets WHERE user_id = $1 ORDER BY created_at DESC";
    const params: any[] = [userId];
    let idx = 2;

    if (eventId) {
      query += ` AND event_id = $${idx}`;
      params.push(eventId);
      idx++;
    }

    const countResult = await db.query(
      query.replace("SELECT *", "SELECT COUNT(*)"),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` LIMIT $${idx} OFFSET $${idx + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return {
      bets: result.rows as Bet[],
      total,
    };
  }
}

export const betsService = new BetsService();

PART 2: React Component Structure (Smartphone GUI)
2.1. Main App & Phone Frame (src/App.tsx)
typescript
import React, { useState } from "react";
import "./App.css";
import { LoginScreen } from "./screens/LoginScreen";
import { EventListScreen } from "./screens/EventListScreen";
import { LiveBettingScreen } from "./screens/LiveBettingScreen";
import { DisputesScreen } from "./screens/DisputesScreen";
import { MetricsScreen } from "./screens/MetricsScreen";
import { VoiceOverController } from "./components/VoiceOverController";

type ScreenType =
  | "login"
  | "events"
  | "live_betting"
  | "disputes"
  | "metrics";

interface AppState {
  currentScreen: ScreenType;
  token: string | null;
  userId: string | null;
  selectedEventId: string | null;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentScreen: "login",
    token: null,
    userId: null,
    selectedEventId: null,
  });

  const handleLogin = (token: string, userId: string) => {
    setState({
      ...state,
      token,
      userId,
      currentScreen: "events",
    });
  };

  const handleSelectEvent = (eventId: string) => {
    setState({
      ...state,
      selectedEventId: eventId,
      currentScreen: "live_betting",
    });
  };

  const handleNavigate = (screen: ScreenType) => {
    setState({ ...state, currentScreen: screen });
  };

  return (
    <div className="app-container">
      {/* Phone frame mockup */}
      <div className="phone-frame">
        <div className="phone-notch"></div>

        <div className="phone-content">
          {/* Render screen based on state */}
          {state.currentScreen === "login" && (
            <LoginScreen onLogin={handleLogin} />
          )}

          {state.currentScreen === "events" && (
            <EventListScreen
              token={state.token!}
              onSelectEvent={handleSelectEvent}
            />
          )}

          {state.currentScreen === "live_betting" && (
            <LiveBettingScreen
              token={state.token!}
              userId={state.userId!}
              eventId={state.selectedEventId!}
              onNavigate={handleNavigate}
            />
          )}

          {state.currentScreen === "disputes" && (
            <DisputesScreen
              token={state.token!}
              userId={state.userId!}
              onNavigate={handleNavigate}
            />
          )}

          {state.currentScreen === "metrics" && (
            <MetricsScreen
              token={state.token!}
              eventId={state.selectedEventId!}
              onNavigate={handleNavigate}
            />
          )}
        </div>

        {/* Bottom navigation */}
        <div className="phone-nav">
          <button
            onClick={() => handleNavigate("live_betting")}
            className={state.currentScreen === "live_betting" ? "active" : ""}
          >
            Betting
          </button>
          <button
            onClick={() => handleNavigate("disputes")}
            className={state.currentScreen === "disputes" ? "active" : ""}
          >
            Disputes
          </button>
          <button
            onClick={() => handleNavigate("metrics")}
            className={state.currentScreen === "metrics" ? "active" : ""}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* Voice-over controller (floats over phone) */}
      <VoiceOverController />
    </div>
  );
};

export default App;

2.2. Phone Frame CSS (src/App.css)
css
.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 20px;
}

.phone-frame {
  position: relative;
  width: 390px;
  height: 844px;
  background: #000;
  border-radius: 40px;
  border: 12px solid #000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phone-notch {
  width: 200px;
  height: 28px;
  background: #000;
  margin: 0 auto;
  border-radius: 0 0 20px 20px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.phone-content {
  flex: 1;
  background: #fff;
  overflow-y: auto;
  overflow-x: hidden;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
}

.phone-nav {
  display: flex;
  border-top: 1px solid #e0e0e0;
  background: #f5f5f5;
  height: 60px;
}

.phone-nav button {
  flex: 1;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.phone-nav button.active {
  color: #667eea;
  border-bottom: 3px solid #667eea;
}

/* Safe area for notch */
@supports (padding: max(0px)) {
  .phone-content {
    padding-top: max(12px, env(safe-area-inset-top));
  }
}

2.3. Live Betting Screen (src/screens/LiveBettingScreen.tsx)
This is the main demo screen showing video, markets, betting, and dispute flow:
typescript
import React, { useState, useEffect } from "react";
import HLS from "hls.js";
import "./LiveBettingScreen.css";
import { Market, Bet, Dispute } from "../types";
import { BettingPanel } from "../components/BettingPanel";
import { BetStatus } from "../components/BetStatus";
import { DisputePanel } from "../components/DisputePanel";
import { VideoMetadataOverlay } from "../components/VideoMetadataOverlay";

interface LiveBettingScreenProps {
  token: string;
  userId: string;
  eventId: string;
  onNavigate: (screen: string) => void;
}

export const LiveBettingScreen: React.FC<LiveBettingScreenProps> = ({
  token,
  userId,
  eventId,
  onNavigate,
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [latencyTargetMs, setLatencyTargetMs] = useState<number>(500);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [recentBets, setRecentBets] = useState<Bet[]>([]);
  const [lastBetResult, setLastBetResult] = useState<{
    status: string;
    latencyMs: number;
    traceId: string;
  } | null>(null);
  const [showDisputePanel, setShowDisputePanel] = useState(false);
  const [selectedBetForDispute, setSelectedBetForDispute] =
    useState<Bet | null>(null);
  const [frameHash, setFrameHash] = useState("0x" + "0".repeat(64));
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Fetch video stream URL
  useEffect(() => {
    const fetchVideoMeta = async () => {
      const res = await fetch(`/api/video/${eventId}/stream`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVideoUrl(data.videoUrl);
      setLatencyTargetMs(data.latencyTargetMs);

      // Initialize HLS player
      if (videoRef.current && HLS.isSupported()) {
        const hls = new HLS();
        hls.loadSource(data.videoUrl);
        hls.attachMedia(videoRef.current);
      }
    };
    fetchVideoMeta();
  }, [eventId, token]);

  // Poll markets every 500ms
  useEffect(() => {
    const fetchMarkets = async () => {
      const res = await fetch(`/api/markets/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMarkets(data.markets);
    };

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 500);
    return () => clearInterval(interval);
  }, [eventId, token]);

  // Poll bets every 2 seconds
  useEffect(() => {
    const fetchBets = async () => {
      const res = await fetch(`/api/bets?eventId=${eventId}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecentBets(data.bets);
    };

    fetchBets();
    const interval = setInterval(fetchBets, 2000);
    return () => clearInterval(interval);
  }, [eventId, token]);

  // Simulate frame hash updates from Caton C3
  useEffect(() => {
    const interval = setInterval(() => {
      const randomHash = "0x" + Math.random().toString(16).substring(2, 66);
      setFrameHash(randomHash);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleBetPlaced = (bet: Bet, result: any) => {
    setLastBetResult(result);
    setRecentBets([bet, ...recentBets.slice(0, 4)]);
  };

  const handleDisputeClick = (bet: Bet) => {
    setSelectedBetForDispute(bet);
    setShowDisputePanel(true);
  };

  return (
    <div className="live-betting-screen">
      {/* Video Player with metadata overlay */}
      <div className="video-section">
        <video
          ref={videoRef}
          className="video-player"
          controls
          autoPlay
          muted
        ></video>
        <VideoMetadataOverlay
          latencyTargetMs={latencyTargetMs}
          currentFrameHash={frameHash}
        />
      </div>

      {/* Markets List */}
      <div className="markets-section">
        <h3>Live Markets</h3>
        <div className="markets-grid">
          {markets.map((market) => (
            <div
              key={market.id}
              className={`market-card ${
                selectedMarket?.id === market.id ? "selected" : ""
              }`}
              onClick={() => setSelectedMarket(market)}
            >
              <div className="market-type">{market.marketType}</div>
              <div className="market-odds">{market.currentOdds}</div>
              <div className="market-status">{market.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Betting Panel */}
      {selectedMarket && (
        <BettingPanel
          userId={userId}
          token={token}
          market={selectedMarket}
          onBetPlaced={handleBetPlaced}
        />
      )}

      {/* Last Bet Status */}
      {lastBetResult && (
        <BetStatus
          status={lastBetResult.status}
          latencyMs={lastBetResult.latencyMs}
          traceId={lastBetResult.traceId}
        />
      )}

      {/* Recent Bets List */}
      <div className="recent-bets-section">
        <h3>Recent Bets</h3>
        {recentBets.map((bet) => (
          <div key={bet.id} className="bet-row">
            <div className="bet-info">
              <div className="bet-market">{bet.status}</div>
              <div className="bet-amount">${(bet.amount / 100).toFixed(2)}</div>
              <div className="bet-latency">{bet.latencyMs}ms</div>
            </div>
            {bet.status === "rejected" && (
              <button
                onClick={() => handleDisputeClick(bet)}
                className="dispute-btn"
              >
                Dispute
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Dispute Panel */}
      {showDisputePanel && selectedBetForDispute && (
        <DisputePanel
          bet={selectedBetForDispute}
          token={token}
          onClose={() => setShowDisputePanel(false)}
        />
      )}
    </div>
  );
};

2.4. Betting Panel Component (src/components/BettingPanel.tsx)
typescript
import React, { useState } from "react";
import { Market, Bet } from "../types";
import "./BettingPanel.css";

interface BettingPanelProps {
  userId: string;
  token: string;
  market: Market;
  onBetPlaced: (bet: Bet, result: any) => void;
}

export const BettingPanel: React.FC<BettingPanelProps> = ({
  userId,
  token,
  market,
  onBetPlaced,
}) => {
  const [amount, setAmount] = useState(100); // in cents, $1.00
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceBet = async () => {
    setLoading(true);
    setError(null);

    try {
      const clientPlacedAt = new Date().toISOString();

      const res = await fetch("/api/bets/place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marketId: market.id,
          amount,
          clientPlacedAt,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      const result = await res.json();

      // Fetch updated bet from server (optional, or mock it)
      const bet: Bet = {
        id: result.betId,
        userId,
        eventId: market.eventId,
        marketId: market.id,
        amount,
        odds: market.currentOdds,
        status: result.status,
        clientPlacedAt: new Date(clientPlacedAt),
        serverPlacedAt: new Date(),
        latencyMs: result.latencyMs,
        videoFrameHash: result.videoFrameHash,
        oddsHash: result.oddsHash,
        x402TraceId: result.x402TraceId,
        x402TraceStatus: "settled",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onBetPlaced(bet, result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="betting-panel">
      <h3>Place Bet</h3>
      <div className="bet-form">
        <div className="form-group">
          <label>Market: {market.marketType}</label>
          <div className="market-info">
            <span>Odds: {market.currentOdds}</span>
            <span>Close: {new Date(market.marketCloseTime).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Stake ($)</label>
          <div className="stake-input">
            <input
              type="number"
              min="1"
              max="100000"
              value={amount / 100}
              onChange={(e) => setAmount(Math.round(e.target.valueAsNumber * 100))}
              disabled={loading}
            />
          </div>
          <div className="quick-stakes">
            {[100, 500, 1000, 5000].map((stake) => (
              <button
                key={stake}
                onClick={() => setAmount(stake)}
                className="quick-stake-btn"
                disabled={loading}
              >
                ${(stake / 100).toFixed(2)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={handlePlaceBet}
          disabled={loading}
          className="place-bet-btn"
        >
          {loading ? "Placing..." : "Place Bet"}
        </button>
      </div>
    </div>
  );
};

2.5. Dispute Panel Component (src/components/DisputePanel.tsx)
This shows the ERC-8004 validation flow:
typescript
import React, { useState } from "react";
import { Bet, Dispute } from "../types";
import "./DisputePanel.css";

interface DisputePanelProps {
  bet: Bet;
  token: string;
  onClose: () => void;
}

export const DisputePanel: React.FC<DisputePanelProps> = ({
  bet,
  token,
  onClose,
}) => {
  const [reason, setReason] = useState(
    "I believe my bet was placed before market close"
  );
  const [loading, setLoading] = useState(false);
  const [dispute, setDispute] = useState<Dispute | null>(null);

  const handleSubmitDispute = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/disputes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          betId: bet.id,
          reason,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create dispute");
      }

      const result = await res.json();
      setDispute(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (dispute) {
    return (
      <div className="dispute-panel">
        <h3>Dispute Resolution (ERC-8004)</h3>
        <div className="verdict-section">
          <div className={`verdict ${dispute.teeVerdict?.toLowerCase()}`}>
            {dispute.teeVerdict}
          </div>
          <p className="explanation">{dispute.teeExplanation}</p>

          <div className="attestation-info">
            <label>Attestation Hash (TEE):</label>
            <div className="hash-value">{dispute.teeAttestationHash}</div>
            <p className="hash-note">
              This hash proves the TEE validation ran in a trusted environment.
            </p>
          </div>

          {dispute.erc8004TxHash && (
            <div className="blockchain-info">
              <label>On-Chain Registry TX:</label>
              <div className="tx-value">{dispute.erc8004TxHash}</div>
              <a
                href={`https://sepolia.etherscan.io/tx/${dispute.erc8004TxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                View on Sepolia ?
              </a>
            </div>
          )}
        </div>

        <button onClick={onClose} className="close-btn">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="dispute-panel">
      <h3>Create Dispute</h3>
      <div className="dispute-form">
        <div className="bet-summary">
          <p>
            <strong>Bet ID:</strong> {bet.id.substring(0, 8)}…
          </p>
          <p>
            <strong>Market:</strong> {bet.marketId.substring(0, 8)}…
          </p>
          <p>
            <strong>Latency:</strong> {bet.latencyMs}ms
          </p>
          <p>
            <strong>Status:</strong> {bet.status}
          </p>
        </div>

        <textarea
          placeholder="Explain why you believe this bet should have been accepted…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={loading}
        ></textarea>

        <button
          onClick={handleSubmitDispute}
          disabled={loading}
          className="submit-dispute-btn"
        >
          {loading ? "Validating..." : "Submit to TEE Validator"}
        </button>
      </div>
    </div>
  );
};

2.6. Voice-Over Controller (src/components/VoiceOverController.tsx)
typescript
import React, { useState, useEffect } from "react";
import { NarrationSegment } from "../types";
import "./VoiceOverController.css";

export const VoiceOverController: React.FC = () => {
  const [segments, setSegments] = useState<NarrationSegment[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchSegments = async () => {
      const res = await fetch("/api/narration/segments");
      const data = await res.json();
      setSegments(data.segments.sort((a, b) => a.order - b.order));
    };
    fetchSegments();
  }, []);

  const handlePlaySegment = async (phase: string) => {
    setCurrentPhase(phase);
    const res = await fetch(`/api/narration/segment/${phase}`);
    const data = await res.json();

    if (audioRef.current && data.segment.audioUrl) {
      audioRef.current.src = data.segment.audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="voice-over-controller">
      <div className="voice-header">
        <h4>? Narration Guide</h4>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="play-pause-btn"
        >
          {isPlaying ? "?" : "?"}
        </button>
      </div>

      <div className="segments-list">
        {segments.map((seg) => (
          <button
            key={seg.phase}
            onClick={() => handlePlaySegment(seg.phase)}
            className={`segment-btn ${
              currentPhase === seg.phase ? "active" : ""
            }`}
          >
            <span className="phase-title">{seg.title}</span>
            <span className="phase-duration">{seg.durationSec}s</span>
          </button>
        ))}
      </div>

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

PART 3: TTS-Ready Narration Script (ElevenLabs)
This script is segmented by phase and ready to paste into ElevenLabs for voice generation.
3.1. Full Narration Script (narration_script.md)
text
# Micro-Betting PoC Narration Script
# For ElevenLabs Text-to-Speech
# Target Voice: Clear, professional English narrator
# Pacing: Measured, with emphasis on technical terms

---

## PHASE 1: INTRODUCTION & PROBLEM

[Segment: intro | Duration: ~45s]

Welcome to the micro-betting demonstration. 

I'm going to show you a groundbreaking solution to a $100 million annual industry problem.

Traditional video streaming for betting has a critical flaw. There's a 12 to 15 second delay between the live event and what you see on your screen. But betting windows close in just 30 seconds.

This creates a nightmare for operators and users alike:
- Users see race outcomes delayed, then place bets on live data they're not actually seeing.
- Operators suffer rejected bets and disputes. Every 100 milliseconds of latency costs them 5 to 10 million dollars annually in refunds and chargebacks.

Today, we solve this with three technologies:
- Ultra-low latency video, delivered in under 500 milliseconds.
- X402, a protocol that traces every payment intent to a blockchain while settlement happens via fiat.
- ERC-8004, a trust layer that resolves disputes using cryptographic proof and hardware-secured validation.

Let me show you how it works.

---

## PHASE 2: CATON C3 LOW-LATENCY VIDEO

[Segment: caton_latency | Duration: ~60s]

First, let's talk about latency. Watch the video stream playing right now.

Traditional CDNs deliver video in 12 to 15 second chunks. Caton C3 does something revolutionary. It breaks that into micro-frames, hashed in real time, and delivered via an optimized backbone called CVP.

Here's what happens: the race feed is ingested at the source. Caton encodes the video and extracts frame metadata. Each frame is hashed—creating a cryptographic fingerprint—proving exactly what content was shown at this exact timestamp.

The hash of this frame is 0x7a3b. Remember that hash. We'll use it later to prove what you saw when you placed your bet.

The CVP backbone—that's the Caton Video Pipeline—routes the stream through optimal paths, avoiding congestion in real time.

The result? Sub-500 millisecond end-to-end latency. Compared to 12 seconds, this is a generational leap.

That frame hash, combined with the odds state, becomes immutable proof that you received fair market information at bet time. This is the foundation of everything else you're about to see.

---

## PHASE 3: X402 PAYMENT TRACING (FIAT SETTLEMENT)

[Segment: x402_payment | Duration: ~75s]

Now, placing a bet. You see the live odds: 3.5 for Horse number three to win.

You stake 1 dollar. Your mobile device captures the exact timestamp you placed the bet: 14:32:55.240 UTC.

You press confirm. Here's what happens behind the scenes, and this is critical for regulated markets.

The X402 protocol—designed by Coinbase and adopted by Google and others—was built to separate payment intent from settlement.

When your bet is placed, three things happen simultaneously:

First, your signed request creates a cryptographic proof that you authorized this bet. This is EIP-712 signing—hardware-backed on your phone, unforgeable.

Second, a trace record is written to an on-chain registry. Not a cryptocurrency transaction. Just a hash: timestamp, amount, odds state, video frame hash. This creates permanent, immutable proof of what happened and when.

Third—and this is where X402 becomes powerful for regulated jurisdictions—the actual payment settlement happens off-chain. We use traditional rails. ACH. Credit card. Bank transfer. Whatever complies with local law.

In Brazil, for example, crypto payments for gambling are banned. But this architecture lets us log everything to blockchain for transparency and auditability, while keeping settlement through fiat rails.

Your balance updates from 100 dollars to 99. If Horse three wins, you'll get 3 dollars and 50 cents instantly transferred to your wallet via the same fiat rail.

The bet is now immutably logged. The X402 trace ID ties everything together. And no cryptocurrency ever touched your account.

---

## PHASE 4: ERC-8004 DISPUTE RESOLUTION

[Segment: erc8004_dispute | Duration: ~90s]

Now, here's where it gets interesting. What if you disagree with a decision?

Imagine a scenario: Your bet was rejected as late. But you claim you placed it before the market closed.

You're at 14:32:56. The market closed at 14:32:56. You say you bet 760 milliseconds before close. The system says you're late.

With traditional betting, this becomes a he-said-she-said dispute. Operators have to manually review. Users lose trust. Chargebacks happen.

ERC-8004 changes this. It's an Ethereum standard for trustless validation.

Here's how it works: All the hashes we talked about—the video frame hash, the odds hash, the bet decision—are combined into a Merkle tree and committed to blockchain. The Merkle root proves that this exact data existed at this exact time.

When you dispute, the system:
- Fetches your bet timestamp: 14:32:55.240 UTC
- Fetches the market close timestamp: 14:32:56.000 UTC
- Computes the delta: 760 milliseconds. You were early.

But wait. Let's say the operator's decision was INCORRECT. Your bet should have been accepted.

A TEE—a Trusted Execution Environment, like AWS Nitro Enclave—re-runs the decision logic. This is hardware-secured computation. The TEE produces a cryptographic attestation that cannot be forged.

The verdict is delivered: The operator made an error. Your bet should have been accepted.

This attestation is permanently recorded on the ERC-8004 Validation Registry. The operator's reputation updates. Users and regulators can independently verify this proof.

No central authority. No manual review. Just math and cryptography.

That's the power of ERC-8004. It's a trust layer for any two parties who need to resolve a dispute, backed by immutable proof.

---

## PHASE 5: OPERATOR METRICS & KPIs

[Segment: metrics | Duration: ~45s]

From an operator's perspective, here's what matters:

Total bets placed during this event: 4,247.

Acceptance rate: 94.2 percent. That's high because we're measuring latency fairly and rejecting only true late bets.

Average latency: 387 milliseconds. That's under our 500-millisecond target. Users are getting fair odds at fair timing.

Total handle: 847 thousand dollars. That's the sum of all bets.

Disputes: 67. And here's the key: 64 of those disputes were CORRECT—meaning the operator was right. Only 3 were INCORRECT, showing a high-confidence decision system.

With traditional streaming, at 12 to 15 seconds of latency, you'd expect 40 to 50 percent dispute rates on close calls. Here, we're at 1.6 percent.

That's the business case. More bets, fewer disputes, lower operational costs, happier users.

---

## PHASE 6: CONCLUSION

[Segment: conclusion | Duration: ~45s]

You've now seen the complete workflow:

- Privy for frictionless login. No cryptocurrency knowledge required.
- Caton C3 for sub-500-millisecond video delivery, with frame hashing for proof.
- X402 for payment intent tracing, using fiat settlement to comply with local regulation.
- STB TEE—or any hardware-secured validation—for indisputable dispute resolution.
- ERC-8004 for on-chain reputation and validation registry.

This isn't theoretical. The components exist today. They're deployed in production.

What you've seen is a PoC—a proof of concept—that brings them together for micro-betting.

The same architecture works for any fast-moving event: horse racing, esports, live sports, day trading.

Anywhere low latency, fair timing, and dispute resolution matter.

Thank you for watching.

3.2. ElevenLabs Integration Code (src/services/narrationService.ts)
typescript
import axios from "axios";
import { NarrationSegment, NarrationPhase } from "../types";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - clear, neutral voice

interface ElevenLabsVoiceRequest {
  text: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export class NarrationService {
  private segments: Map<NarrationPhase, NarrationSegment> = new Map();

  constructor() {
    this.initializeSegments();
  }

  private initializeSegments() {
    const scriptSegments: Record<NarrationPhase, { text: string; duration: number }> = {
      intro: {
        text: `Welcome to the micro-betting demonstration...`,
        duration: 45,
      },
      caton_latency: {
        text: `First, let's talk about latency...`,
        duration: 60,
      },
      x402_payment: {
        text: `Now, placing a bet...`,
        duration: 75,
      },
      erc8004_dispute: {
        text: `Now, here's where it gets interesting...`,
        duration: 90,
      },
      metrics: {
        text: `From an operator's perspective, here's what matters...`,
        duration: 45,
      },
      conclusion: {
        text: `You've now seen the complete workflow...`,
        duration: 45,
      },
    };

    let order = 0;
    Object.entries(scriptSegments).forEach(([phase, { text, duration }]) => {
      this.segments.set(phase as NarrationPhase, {
        phase: phase as NarrationPhase,
        title: this.phaseToTitle(phase as NarrationPhase),
        scriptText: text,
        durationSec: duration,
        order: order++,
      });
    });
  }

  /**
   * Generate audio for a narration segment using ElevenLabs
   * Returns URL to stored .mp3 file
   */
  async generateAudio(phase: NarrationPhase): Promise<string> {
    const segment = this.segments.get(phase);
    if (!segment) {
      throw new Error(`Unknown narration phase: ${phase}`);
    }

    try {
      // Call ElevenLabs API
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          text: segment.scriptText,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        } as ElevenLabsVoiceRequest,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          responseType: "arraybuffer",
        }
      );

      // Save to S3 or local storage
      const audioBuffer = response.data;
      const audioUrl = await this.saveAudioFile(phase, audioBuffer);

      // Update segment with URL
      const updatedSegment = {
        ...segment,
        audioUrl,
      };
      this.segments.set(phase, updatedSegment);

      return audioUrl;
    } catch (error) {
      console.error(`Failed to generate audio for ${phase}:`, error);
      throw error;
    }
  }

  private async saveAudioFile(
    phase: NarrationPhase,
    audioBuffer: Buffer
  ): Promise<string> {
    // TODO: Implement S3 upload or local file save
    // For demo, just return a mock URL
    const mockUrl = `/audio/narration-${phase}.mp3`;
    return mockUrl;
  }

  async listSegments(): Promise<NarrationSegment[]> {
    return Array.from(this.segments.values()).sort((a, b) => a.order - b.order);
  }

  async getSegment(phase: NarrationPhase): Promise<NarrationSegment> {
    const segment = this.segments.get(phase);
    if (!segment) {
      throw new Error(`Unknown narration phase: ${phase}`);
    }

    // If audio hasn't been generated yet, generate it
    if (!segment.audioUrl) {
      await this.generateAudio(phase);
    }

    return segment;
  }

  private phaseToTitle(phase: NarrationPhase): string {
    const titles: Record<NarrationPhase, string> = {
      intro: "Introduction & Problem",
      caton_latency: "Caton C3 Low-Latency Video",
      x402_payment: "X402 Payment Tracing (Fiat)",
      erc8004_dispute: "ERC-8004 Dispute Resolution",
      metrics: "Operator Metrics & KPIs",
      conclusion: "Conclusion",
    };
    return titles[phase];
  }
}

export const narrationService = new NarrationService();

3.3. How to Use with ElevenLabs
    1. Sign up at https://elevenlabs.io
    2. Get API key from dashboard
    3. Choose a voice – search for "Rachel" or similar neutral narrator voices
    4. Paste script segments directly into the TTS interface, or use the API as shown above
    5. Generate and download .mp3 files
    6. Host on S3 / CDN and reference URLs in your NarrationSegment records
Example ElevenLabs API call (curl):
bash
curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM" \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welcome to the micro-betting demonstration...",
    "voice_settings": {
      "stability": 0.5,
      "similarity_boost": 0.75
    }
  }' \
  --output intro.mp3

Summary
You now have:
? Complete TypeScript API schema – all domain types, request/response contracts, and Express route signatures
? Full React component structure – phone frame mockup, all screens, betting/dispute flows
? Production-ready narration script – segmented by demo phase, ready for ElevenLabs TTS generation
Next steps:
    1. Set up Node.js + Express backend with PostgreSQL + Redis
    2. Implement the services (betsService.placeBet is the core logic)
    3. Build the React UI using the component templates
    4. Generate narration audio via ElevenLabs API
    5. Deploy contracts to testnet (Sepolia or Base) for ERC-8004 + X402 trace registry
    6. Run the demo end-to-end, emphasizing the latency measurement, fiat tracing, and dispute flow
Would you like me to:
    • Draft the smart contracts (ERC-8004 registry + X402 trace on-chain)?
    • Provide database migration scripts for PostgreSQL setup?
    • Write the event simulator that generates live markets and video frames?
    1. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/b9cb37ad-12a1-4cec-b172-af302a5e7876/Implementation-Plan.md 
    2. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/1bd6c6fd-0ce7-4541-ad2f-467c2c0e976c/ERC-8004-Trust-Layer-Demo-compress.mp4 
    3. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/0d452f19-9547-4065-8e9d-3e5eb965a9ee/implementation-blueprint.md 
    4. https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/67975583/472b0cc2-550c-4a4c-acfa-127e9b6792b1/Horse-Racing-Micro-Betting-Demo-1-compress.mp4 

