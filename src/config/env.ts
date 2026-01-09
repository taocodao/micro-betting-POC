import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    },

    database: {
        path: process.env.DATABASE_PATH || './data/micro-betting.db',
    },

    x402: {
        facilitatorAddress: process.env.FACILITATOR_ADDRESS || '0x_caton_facilitator',
        operatorPayeeAddress: process.env.OPERATOR_PAYEE_ADDRESS || '0x_caton_operator',
        chainId: parseInt(process.env.CHAIN_ID || '42161', 10),
    },

    processors: {
        pixApiKey: process.env.PIX_API_KEY || 'simulated',
        cardApiKey: process.env.CARD_API_KEY || 'simulated',
    },

    erc8004: {
        registryUrl: process.env.ERC8004_REGISTRY_URL || 'http://localhost:3000/api/erc8004',
    },
};
