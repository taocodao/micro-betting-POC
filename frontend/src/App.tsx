import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrivy } from '@privy-io/react-auth';
import { PhoneFrame } from './components/PhoneFrame';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { MarketsPanel } from './components/MarketsPanel';
import { BettingUI } from './components/BettingUI';
import { BetHistory, Bet } from './components/BetHistory';
import { DisputeModal } from './components/DisputeModal';
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

    // Bet history state
    const [betHistory, setBetHistory] = useState<Bet[]>([]);
    const [disputingBetId, setDisputingBetId] = useState<string | null>(null);

    // Auto-settle pending bets after 5 seconds
    useEffect(() => {
        const pendingBets = betHistory.filter(b => b.status === 'pending');

        pendingBets.forEach(bet => {
            const timeSincePlaced = Date.now() - bet.placedAt;
            const timeToSettle = 5000 - timeSincePlaced;

            if (timeToSettle > 0) {
                const timer = setTimeout(() => {
                    setBetHistory(prev => prev.map(b => {
                        if (b.id === bet.id && b.status === 'pending') {
                            // 40% win rate
                            const won = Math.random() < 0.4;
                            return {
                                ...b,
                                status: won ? 'won' as const : 'lost' as const,
                                settledAt: Date.now()
                            };
                        }
                        return b;
                    }));
                }, timeToSettle);

                return () => clearTimeout(timer);
            }
        });
    }, [betHistory]);

    const handleSelectMarket = useCallback((marketId: string, odds: number) => {
        setSelectedMarket(marketId);
        setSelectedOdds(odds);
    }, []);

    const handlePlaceBet = useCallback(async (amount: number) => {
        // Simulate API call with latency
        const clientTime = Date.now();

        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400));

        const serverTime = Date.now();
        const latencyMs = serverTime - clientTime;

        // Simulate 90% acceptance rate
        const accepted = Math.random() > 0.1;

        const traceId = accepted ? `trace-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` : undefined;

        // If accepted, add to bet history
        if (accepted && selectedMarket) {
            const market = horseMarkets.find(m => m.id === selectedMarket);
            const newBet: Bet = {
                id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                horse: market?.horse || 'Unknown',
                amount,
                odds: selectedOdds,
                potentialReturn: amount * selectedOdds,
                status: 'pending',
                placedAt: Date.now(),
                traceId,
                frameHash
            };
            setBetHistory(prev => [newBet, ...prev]);
        }

        return {
            status: accepted ? 'accepted' as const : 'rejected' as const,
            latencyMs,
            traceId,
            frameHash: accepted ? frameHash : undefined,
            reason: accepted ? undefined : 'Market closed (latency exceeded)',
        };
    }, [frameHash, selectedMarket, selectedOdds]);

    const handlePlaceAnotherBet = useCallback(() => {
        setSelectedMarket(null);
    }, []);

    const handleDispute = useCallback((betId: string) => {
        setDisputingBetId(betId);
    }, []);

    const handleDisputeSubmit = useCallback(async (_reason: string) => {
        // Simulate dispute resolution
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        // 30% chance dispute is upheld (bet was incorrect)
        const upheld = Math.random() < 0.3;

        return {
            verdict: upheld ? 'INCORRECT' as const : 'CORRECT' as const,
            explanation: upheld
                ? 'Frame analysis shows discrepancy in race timing. Bet has been reversed.'
                : 'Frame hash and timing verified. Original settlement is correct.',
            attestationHash: `0x${Math.random().toString(16).slice(2, 34)}...`
        };
    }, []);

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
                            onHeaderClick={() => setSelectedMarket(null)}
                        />
                        {selectedMarket && (
                            <BettingUI
                                marketId={selectedMarket}
                                odds={selectedOdds}
                                onPlaceBet={handlePlaceBet}
                                onPlaceAnotherBet={handlePlaceAnotherBet}
                            />
                        )}
                        <BetHistory
                            bets={betHistory}
                            onDispute={handleDispute}
                        />
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

            {/* Dispute Modal */}
            {disputingBetId && (
                <DisputeModal
                    betId={disputingBetId}
                    onClose={() => setDisputingBetId(null)}
                    onSubmit={handleDisputeSubmit}
                />
            )}
        </div>
    );
}

export default App;
