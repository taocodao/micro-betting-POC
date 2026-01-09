import { Request, Response, NextFunction } from 'express';
import { X402PaymentIntent, ApiResponse } from '../types/index.js';

// Extend Express Request for X402
declare global {
    namespace Express {
        interface Request {
            x402PaymentIntent?: X402PaymentIntent;
        }
    }
}

/**
 * X402 Payment Middleware
 * Validates and parses X-Payment header for payment-required endpoints
 */
export function validateX402Payment(
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
): void {
    const x402Header = req.headers['x-payment'];

    if (!x402Header) {
        res.status(402).json({
            success: false,
            error: 'Payment Required',
            message: 'X-Payment header is required for this endpoint',
        });
        return;
    }

    try {
        // Parse X402 payment intent from header
        const paymentIntent = typeof x402Header === 'string'
            ? JSON.parse(x402Header) as X402PaymentIntent
            : JSON.parse(x402Header[0]) as X402PaymentIntent;

        // Validate required fields
        if (!paymentIntent.amount || paymentIntent.amount <= 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid payment intent: amount must be positive',
            });
            return;
        }

        if (!paymentIntent.signature) {
            res.status(400).json({
                success: false,
                error: 'Invalid payment intent: signature is required',
            });
            return;
        }

        // Verify signature (simplified for PoC)
        const signatureValid = verifyX402Signature(paymentIntent);
        if (!signatureValid) {
            res.status(400).json({
                success: false,
                error: 'Invalid X402 signature',
            });
            return;
        }

        // Attach parsed payment intent to request
        req.x402PaymentIntent = paymentIntent;
        next();
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Invalid X-Payment header format',
        });
    }
}

/**
 * Optional X402 middleware - allows requests without payment but parses if present
 */
export function optionalX402Payment(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const x402Header = req.headers['x-payment'];

    if (x402Header) {
        try {
            const paymentIntent = typeof x402Header === 'string'
                ? JSON.parse(x402Header) as X402PaymentIntent
                : JSON.parse(x402Header[0]) as X402PaymentIntent;

            req.x402PaymentIntent = paymentIntent;
        } catch {
            // Invalid header, continue without payment
        }
    }

    next();
}

/**
 * Verify X402 EIP-712 signature (simplified for PoC)
 * In production, this would use ethers.js to verify actual signatures
 */
function verifyX402Signature(paymentIntent: X402PaymentIntent): boolean {
    // For PoC: accept any signature starting with "0x"
    // Production: verify EIP-712 signature against structured data
    if (!paymentIntent.signature.startsWith('0x')) {
        return false;
    }

    // Check signature length (min 66 chars for valid hex)
    if (paymentIntent.signature.length < 10) {
        return false;
    }

    return true;
}

/**
 * Create X402 Payment Required response header
 */
export function createX402RequiredResponse(
    amount: number,
    currency: string = 'BRL',
    reference?: string
): Record<string, string> {
    return {
        'X-Payment-Required': `${amount} ${currency}`,
        'X-Payment-Reference': reference || '',
        'X-Payment-Timestamp': new Date().toISOString(),
    };
}
