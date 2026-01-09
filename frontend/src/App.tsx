import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrivy } from '@privy-io/react-auth';
import { PhoneFrame } from './components/PhoneFrame';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { MarketsPanel } from './components/MarketsPanel';
import { BettingUI } from './components/BettingUI';
import { NarrationControls } from './components/NarrationControls';
import './i18n';
import './App.css';

// Horse racing markets
const horseMarkets = [
    { id: 'm1', type: 'win', horse: 'Thunder Bolt', odds: 2.35, status: 'open' as const },
    { id: 'm2', type: 'win', horse: 'Golden Star', odds: 3.50, status: 'open' as const },
    { id: 'm3', type: 'win', horse: 'Silver Wind', odds: 4.20, status: 'open' as const },
    { id: 'm4', type: 'win', horse: 'Dark Knight', odds: 5.80, status: 'open' as const },
];

function App() {
    const { t } = useTranslation();
    const { authenticated } = usePrivy();

    const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
    const [selectedOdds, setSelectedOdds] = useState(1.0);
    const [frameHash, setFrameHash] = useState('0x7a3b...');
    const [narrationPhase, setNarrationPhase] = useState('intro');
    const [isPlaying, setIsPlaying] = useState(false);

    const handleSelectMarket = useCallback((marketId: string, odds: number) => {
        setSelectedMarket(marketId);
        setSelectedOdds(odds);
    }, []);

    const handlePlaceBet = useCallback(async (_amount: number) => {
        // Simulate API call with latency
        const clientTime = Date.now();

        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

        const serverTime = Date.now();
        const latencyMs = serverTime - clientTime;

        // Simulate 90% acceptance rate
        const accepted = Math.random() > 0.1;

        return {
            status: accepted ? 'accepted' as const : 'rejected' as const,
            latencyMs,
            traceId: accepted ? `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` : undefined,
            frameHash: accepted ? frameHash : undefined,
            reason: accepted ? undefined : 'Market closed (latency exceeded)',
        };
    }, [frameHash]);

    return (
        <div className="app-container">
            <PhoneFrame>
                <Header />

                {authenticated ? (
                    <>
                        <VideoPlayer onFrameHash={setFrameHash} />
                        <MarketsPanel
                            markets={horseMarkets}
                            selectedMarket={selectedMarket}
                            onSelectMarket={handleSelectMarket}
                        />
                        {selectedMarket && (
                            <BettingUI
                                marketId={selectedMarket}
                                odds={selectedOdds}
                                onPlaceBet={handlePlaceBet}
                            />
                        )}
                        <NarrationControls
                            currentPhase={narrationPhase}
                            isPlaying={isPlaying}
                            onPhaseSelect={setNarrationPhase}
                            onPlayPause={() => setIsPlaying(!isPlaying)}
                        />
                    </>
                ) : (
                    <div className="login-prompt">
                        <div className="login-content">
                            <span className="login-icon">🏇</span>
                            <h2>{t('app.title')}</h2>
                            <p>{t('app.subtitle')}</p>
                            <p className="login-hint">
                                {t('auth.login')} to start betting
                            </p>
                        </div>
                    </div>
                )}
            </PhoneFrame>
        </div>
    );
}

export default App;
