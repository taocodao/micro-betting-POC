import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './BettingUI.css';

interface BettingUIProps {
    marketId: string | null;
    odds: number;
    onPlaceBet: (amount: number) => Promise<BetResult>;
    onPlaceAnotherBet?: () => void;
}

interface BetResult {
    status: 'accepted' | 'rejected';
    latencyMs: number;
    traceId?: string;
    frameHash?: string;
    reason?: string;
}

export function BettingUI({ marketId, odds, onPlaceBet, onPlaceAnotherBet }: BettingUIProps) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState(10);
    const [isPlacing, setIsPlacing] = useState(false);
    const [result, setResult] = useState<BetResult | null>(null);

    const handlePlaceBet = async () => {
        if (!marketId) return;

        setIsPlacing(true);
        setResult(null);

        try {
            const betResult = await onPlaceBet(amount);
            setResult(betResult);
        } catch (error) {
            setResult({
                status: 'rejected',
                latencyMs: 0,
                reason: 'Network error',
            });
        } finally {
            setIsPlacing(false);
        }
    };

    const potentialReturn = amount * odds;

    if (!marketId) {
        return null;
    }

    return (
        <div className="betting-ui">
            <h3 className="betting-title">{t('bet.title')}</h3>

            {/* Amount Selection */}
            <div className="amount-section">
                <label className="amount-label">{t('bet.amount')}</label>
                <div className="amount-buttons">
                    {[5, 10, 25, 50].map((val) => (
                        <button
                            key={val}
                            className={`amount-btn ${amount === val ? 'selected' : ''}`}
                            onClick={() => setAmount(val)}
                            disabled={!!result}
                        >
                            ${val}
                        </button>
                    ))}
                </div>
            </div>

            {/* Odds & Return */}
            <div className="bet-details">
                <div className="detail-row">
                    <span>{t('market.odds')}</span>
                    <span className="odds-value">{odds.toFixed(2)}</span>
                </div>
                <div className="detail-row">
                    <span>{t('bet.potentialReturn')}</span>
                    <span className="return-value">${potentialReturn.toFixed(2)}</span>
                </div>
            </div>

            {/* Submit Button */}
            {!result && (
                <button
                    className="place-bet-btn"
                    onClick={handlePlaceBet}
                    disabled={isPlacing}
                >
                    {isPlacing ? t('common.loading') : t('bet.submit')}
                </button>
            )}

            {/* Result Display */}
            {result && (
                <div className={`bet-result ${result.status}`}>
                    <div className="result-header">
                        {result.status === 'accepted'
                            ? `✓ ${t('bet.accepted')}`
                            : `✗ ${t('bet.rejected')}`}
                    </div>

                    <div className="result-details">
                        <div className="result-row">
                            <span>{t('bet.latencyLabel')}</span>
                            <span className={`latency ${result.latencyMs < 500 ? 'good' : 'warn'}`}>
                                {result.latencyMs}ms
                            </span>
                        </div>

                        {result.traceId && (
                            <div className="result-row">
                                <span>{t('bet.traceId')}</span>
                                <span className="trace-id">{result.traceId.slice(0, 16)}...</span>
                            </div>
                        )}

                        {result.frameHash && (
                            <div className="result-row">
                                <span>{t('bet.frameHashLabel')}</span>
                                <span className="frame-hash">{result.frameHash}</span>
                            </div>
                        )}

                        {result.reason && (
                            <div className="result-reason">{result.reason}</div>
                        )}
                    </div>

                    {onPlaceAnotherBet && (
                        <button
                            className="place-another-btn"
                            onClick={() => {
                                setResult(null);
                                onPlaceAnotherBet();
                            }}
                        >
                            {t('bet.placeAnother', 'Place Another Bet')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
