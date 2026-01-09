import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import './index.css';

// Privy App ID - replace with your own from dashboard.privy.io
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'YOUR_PRIVY_APP_ID';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
                loginMethods: ['email', 'google', 'wallet'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#6366f1',
                    logo: '⚡',
                },
                embeddedWallets: {
                    createOnLogin: 'users-without-wallets',
                },
            }}
        >
            <App />
        </PrivyProvider>
    </StrictMode>
);
