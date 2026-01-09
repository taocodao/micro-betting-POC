import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/env.js';
import { authenticateJWT } from '../middleware/auth.js';
import { User, ApiResponse, JWTPayload } from '../types/index.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { email, password, walletAddress } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
            return;
        }

        // Check if user exists
        const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
        const existing = existingStmt.get(email);

        if (existing) {
            res.status(409).json({
                success: false,
                error: 'Email already registered',
            });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const userWallet = walletAddress || `0x${uuidv4().replace(/-/g, '')}`;

        // Create user
        const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, wallet_address, balance)
      VALUES (?, ?, ?, ?, 1000.00)
    `);

        stmt.run(userId, email, passwordHash, userWallet);

        // Generate JWT
        const token = jwt.sign(
            { userId, email } as JWTPayload,
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: userId,
                    email,
                    balance: 1000.00,
                    wallet_address: userWallet,
                },
                token,
            },
            message: 'User registered successfully',
        });
    } catch (error) {
        console.error('[Auth] Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed',
        });
    }
});

/**
 * POST /api/auth/login
 * Login and get JWT token
 */
router.post('/login', async (req: Request, res: Response<ApiResponse>) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
            return;
        }

        // Find user
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        const user = stmt.get(email) as User | undefined;

        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
            return;
        }

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
            return;
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email } as JWTPayload,
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    balance: user.balance,
                    wallet_address: user.wallet_address,
                    kyc_status: user.kyc_status,
                },
                token,
            },
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
        });
    }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user?.userId;

        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = stmt.get(userId) as User | undefined;

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                balance: user.balance,
                wallet_address: user.wallet_address,
                preferred_payment_method: user.preferred_payment_method,
                kyc_status: user.kyc_status,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error('[Auth] Profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile',
        });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateJWT, (req: Request, res: Response<ApiResponse>) => {
    try {
        const userId = req.user?.userId;
        const { preferred_payment_method, wallet_address } = req.body;

        const stmt = db.prepare(`
      UPDATE users 
      SET preferred_payment_method = COALESCE(?, preferred_payment_method),
          wallet_address = COALESCE(?, wallet_address),
          updated_at = datetime('now')
      WHERE id = ?
    `);

        stmt.run(preferred_payment_method, wallet_address, userId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('[Auth] Update profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update profile',
        });
    }
});

export default router;
