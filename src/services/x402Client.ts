import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { X402PaymentIntent } from '../types/index.js';
import { config } from '../config/env.js';

/**
 * X402 Payment Client
 * Creates signed payment intents for the X402 protocol (EIP-712 style)
 */
export class X402Client {
    private userAddress: string;
    private facilitatorAddress: string;

    constructor(userAddress: string) {
        this.userAddress = userAddress;
        this.facilitatorAddress = config.x402.facilitatorAddress;
    }

    /**
     * Create a signed payment intent
     */
    async createPaymentIntent(
        amount: number,
        currency: string,
        payeeAddress: string,
        nonce: number
    ): Promise<X402PaymentIntent> {
        const timestamp = new Date().toISOString();
        const intentId = `intent-${Date.now()}-${uuidv4().slice(0, 8)}`;

        const intent: Omit<X402PaymentIntent, 'signature'> = {
            amount,
            currency,
            payee: payeeAddress,
            payer: this.userAddress,
            nonce,
            timestamp,
            facilitator: this.facilitatorAddress,
            intent_id: intentId,
        };

        // Create EIP-712 structured data
        const structuredData = this.createEIP712Data(intent);

        // Sign the structured data
        const signature = await this.signEIP712(structuredData);

        return {
            ...intent,
            signature,
        };
    }

    /**
     * Create EIP-712 structured data for signing
     */
    private createEIP712Data(intent: Omit<X402PaymentIntent, 'signature'>): object {
        return {
            types: {
                PaymentIntent: [
                    { name: 'amount', type: 'uint256' },
                    { name: 'currency', type: 'string' },
                    { name: 'payee', type: 'address' },
                    { name: 'payer', type: 'address' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'timestamp', type: 'string' },
                ],
            },
            domain: {
                name: 'MicroBettingPoC',
                version: '1',
                chainId: config.x402.chainId,
            },
            primaryType: 'PaymentIntent',
            message: {
                amount: Math.floor(intent.amount * 100), // Convert to cents
                currency: intent.currency,
                payee: intent.payee,
                payer: intent.payer,
                nonce: intent.nonce,
                timestamp: intent.timestamp,
            },
        };
    }

    /**
     * Sign EIP-712 structured data
     * In production, this would use ethers.js with a real private key
     * For PoC, we create a deterministic hash-based signature
     */
    private async signEIP712(structuredData: object): Promise<string> {
        const message = JSON.stringify(structuredData);
        const hash = crypto.createHash('sha256').update(message).digest('hex');
        return `0x${hash}`;
    }

    /**
     * Generate a unique intent ID
     */
    static generateIntentId(): string {
        return `intent-${Date.now()}-${uuidv4().slice(0, 8)}`;
    }

    /**
     * Verify a payment intent signature
     */
    static verifySignature(intent: X402PaymentIntent): boolean {
        // For PoC: accept valid-looking signatures
        if (!intent.signature.startsWith('0x')) {
            return false;
        }
        if (intent.signature.length < 66) {
            return false;
        }
        return true;
    }
}

/**
 * Create a payment intent for a bet placement
 */
export async function createBetPaymentIntent(
    userId: string,
    walletAddress: string,
    amount: number,
    betId: string
): Promise<X402PaymentIntent> {
    const client = new X402Client(walletAddress);

    // Generate a nonce based on timestamp
    const nonce = Date.now();

    const intent = await client.createPaymentIntent(
        amount,
        'BRL',
        config.x402.operatorPayeeAddress,
        nonce
    );

    return intent;
}
