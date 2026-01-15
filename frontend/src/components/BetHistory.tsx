import { useTranslation } from 'react-i18next';
import './BetHistory.css';

export interface Bet {
    id: string;
    horse: string;
    amount: number;
    odds: number;
    potentialReturn: number;
    status: 'pending' | 'won' | 'lost';
    placedAt: number;
    settledAt?: number;
    traceId?: string;
    frameHash?: string;
}

interface BetHistoryProps {
    bets: Bet[];
    onDispute: (betId: string) => void;
}

export function BetHistory({ bets, onDispute }: BetHistoryProps) {
    const { t } = useTranslation();

    if (bets.length === 0) {
        return null;
    }

    return (
        <div className="bet-history">
            <h3 className="history-title">📋 {t('bet.history', 'Bet History')}</h3>
            <div className="history-list">
                {bets.map((bet) => (
                    <div key={bet.id} className={`history-item ${bet.status}`}>
                        <div className="history-main">
                            <div className="history-horse">
                                <span className="horse-name">{bet.horse}</span>
                                <span className={`status-badge ${bet.status}`}>
                                    {bet.status === 'pending' && '⏳'}
                                    {bet.status === 'won' && '🏆'}
                                    {bet.status === 'lost' && '❌'}
                                    {t(`bet.status.${bet.status}`, bet.status)}
                                </span>
                            </div>
                            <div className="history-details">
                                <span className="bet-amount">${bet.amount}</span>
                                <span className="bet-odds">@ {bet.odds.toFixed(2)}</span>
                                {bet.status === 'won' && (
                                    <span className="bet-payout">+${bet.potentialReturn.toFixed(2)}</span>
                                )}
                            </div>
                        </div>
                        {bet.status !== 'pending' && (
                            <button
                                className="dispute-btn"
                                onClick={() => onDispute(bet.id)}
                            >
                                {t('dispute.button', 'Dispute')}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
