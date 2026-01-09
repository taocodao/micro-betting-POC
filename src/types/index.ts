// User types
export interface User {
    id: string;
    email: string;
    password_hash: string;
    balance: number;
    wallet_address: string | null;
    preferred_payment_method: 'pix' | 'card';
    kyc_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    created_at: string;
    updated_at: string;
}

// Event types
export interface Event {
    id: string;
    name: string;
    sport: string;
    start_time: string;
    status: 'scheduled' | 'live' | 'completed';
    video_url: string | null;
    latency_target: number;
    created_at: string;
}

// Market types
export interface Market {
    id: string;
    event_id: string;
    market_type: string;
    description: string | null;
    current_odds: number;
    status: 'open' | 'closed' | 'settled';
    market_close_time: string | null;
    created_at: string;
}

// Bet types
export interface Bet {
    bet_id: string;
    user_id: string;
    market_id: string;
    amount: number;
    odds: number;
    status: 'pending' | 'accepted' | 'rejected' | 'won' | 'lost';
    placed_at: string;
    server_received_at: string;
    latency_ms: number | null;
    video_frame_hash: string | null;
    odds_hash: string | null;
    trace_id: string | null;
    settlement_id: string | null;
    access_level: 'PROVISIONAL' | 'FULL';
    erc8004_proof: string | null;
    confirmed_at: string | null;
}

// Dispute types
export interface Dispute {
    id: string;
    bet_id: string;
    reason: string;
    status: 'pending' | 'resolved';
    tee_validation_result: string | null;
    created_at: string;
    resolved_at: string | null;
}

export interface TEEValidationResult {
    verdict: 'CORRECT' | 'INCORRECT';
    details: string;
    attestation: string;
    bet_placed_at: string;
    market_close_time: string;
    latency_ms: number;
}

// Video frame types
export interface VideoFrame {
    id: string;
    event_id: string;
    frame_hash: string;
    timestamp: string;
}

// Access log types
export interface AccessLog {
    id: string;
    user_id: string;
    trace_id: string;
    access_level: 'PROVISIONAL' | 'FULL' | 'REVOKED';
    granted_at: string;
    upgraded_at: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    status: 'ACTIVE' | 'REVOKED';
}

// Payment trace types
export interface PaymentTrace {
    trace_id: string;
    payer: string;
    payee: string;
    amount: number;
    currency: string;
    intent_timestamp: string;
    settlement_timestamp: string | null;
    fiat_reference_hash: string | null;
    settlement_status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    blockchain_tx_hash: string | null;
    erc8004_validation_id: string | null;
    erc8004_feedback_id: string | null;
}

// X402 types
export interface X402PaymentIntent {
    amount: number;
    currency: string;
    payee: string;
    payer: string;
    nonce: number;
    timestamp: string;
    facilitator: string;
    signature: string;
    intent_id: string;
}

// ERC-8004 types
export interface ERC8004ValidationRequest {
    traceId: string;
    agent: string;
    validation_type: string;
    timestamp: string;
    metadata: Record<string, unknown>;
}

export interface ERC8004Feedback {
    traceId: string;
    agent: string;
    rating: number;
    feedback_type: string;
    timestamp: string;
    proof: Record<string, unknown>;
}

export interface AgentReputation {
    agent_address: string;
    reputation_score: number;
    total_settlements: number;
    successful_settlements: number;
    success_rate: number;
    recent_disputes: number;
}

// Metrics types
export interface EventMetrics {
    event_id: string;
    total_bets: number;
    accepted_bets: number;
    rejected_bets: number;
    acceptance_rate: number;
    avg_latency_ms: number;
    max_latency_ms: number;
    total_handle: number;
    total_disputes: number;
    disputes_correct: number;
    disputes_incorrect: number;
}

// API response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// JWT payload types
export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

// Request types for Express
export interface AuthenticatedRequest {
    user?: JWTPayload;
}

// Settlement processor types
export interface SettlementRequest {
    trace_id: string;
    amount: number;
    currency: string;
    payer_id: string;
    payee_id: string;
    reference: string;
    metadata: Record<string, unknown>;
}

export interface SettlementResponse {
    transaction_id: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    expected_confirmation: string;
    processor: string;
}

// Merkle tree types
export interface MerkleCommit {
    id: string;
    event_id: string;
    merkle_root: string;
    bet_ids: string[];
    tx_hash: string | null;
    created_at: string;
}
