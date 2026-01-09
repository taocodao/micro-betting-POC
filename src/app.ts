import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { db, initializeDatabase } from './config/database';

// Import routes
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import marketsRoutes from './routes/markets';
import betsRoutes from './routes/bets';
import paymentsRoutes from './routes/payments';
import webhooksRoutes from './routes/webhooks';
import disputesRoutes from './routes/disputes';
import metricsRoutes from './routes/metrics';
import blockchainRoutes from './routes/blockchain';
import adminRoutes from './routes/admin';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/disputes', disputesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        },
    });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            name: 'X402 + ERC-8004 Micro-Betting PoC API',
            version: '1.0.0',
            description: 'Hybrid payment system with on-chain trace recording and fiat settlement',
            endpoints: {
                auth: '/api/auth',
                events: '/api/events',
                markets: '/api/markets',
                bets: '/api/bets',
                payments: '/api/payments',
                webhooks: '/api/webhooks',
                disputes: '/api/disputes',
                metrics: '/api/metrics',
                blockchain: '/api/blockchain',
                admin: '/api/admin',
            },
        },
    });
});

// Serve index.html for root
app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server] Error:', err.message);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
    });
});

// Initialize database and start server
async function startServer() {
    try {
        // Initialize database
        initializeDatabase();

        // Start server
        app.listen(config.port, () => {
            console.log('');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('  X402 + ERC-8004 Micro-Betting PoC Server');
            console.log('═══════════════════════════════════════════════════════════════');
            console.log(`  🚀 Server running at: http://localhost:${config.port}`);
            console.log(`  📡 API endpoint:      http://localhost:${config.port}/api`);
            console.log(`  🎨 Demo UI:           http://localhost:${config.port}`);
            console.log(`  📊 Health check:      http://localhost:${config.port}/api/health`);
            console.log('═══════════════════════════════════════════════════════════════');
            console.log('');
            console.log('  Features:');
            console.log('  ✅ X402 Payment Protocol with on-chain trace recording');
            console.log('  ✅ ERC-8004 Trust Layer (Identity, Validation, Reputation)');
            console.log('  ✅ Live video streaming with frame hash anchoring');
            console.log('  ✅ Dynamic micro-markets with real-time odds');
            console.log('  ✅ Latency measurement for fairness validation');
            console.log('  ✅ Merkle tree blockchain anchoring for bet proofs');
            console.log('  ✅ TEE-based dispute resolution (simulated)');
            console.log('  ✅ Operator metrics dashboard');
            console.log('');
        });
    } catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[Server] Shutting down...');
    db.close();
    process.exit(0);
});

// Start the server
startServer();
