import { useTranslation } from 'react-i18next';
import './MarketsPanel.css';

interface Market {
    id: string;
    type: string;
    odds: number;
    status: 'open' | 'closed' | 'settled';
    horse?: string;
}

interface MarketsPanelProps {
    markets: Market[];
    selectedMarket: string | null;
    onSelectMarket: (marketId: string, odds: number) => void;
    onHeaderClick?: () => void;
}

// Horse racing specific market display
const horseEmojis = ['🏇', '🐎', '🏆', '🎯', '⚡'];

export function MarketsPanel({ markets, selectedMarket, onSelectMarket, onHeaderClick }: MarketsPanelProps) {
    const { t } = useTranslation();

    return (
        <div className="markets-panel">
            <h3
                className={`markets-title ${onHeaderClick ? 'clickable' : ''}`}
                onClick={onHeaderClick}
            >
                🏇 {t('market.title')}
            </h3>

            <div className="markets-list">
                {markets.map((market, index) => (
                    <button
                        key={market.id}
                        className={`market-card ${selectedMarket === market.id ? 'selected' : ''} ${market.status}`}
                        onClick={() => market.status === 'open' && onSelectMarket(market.id, market.odds)}
                        disabled={market.status !== 'open'}
                    >
                        <div className="market-horse">
                            <span className="horse-emoji">{horseEmojis[index % horseEmojis.length]}</span>
                            <div className="market-info">
                                <span className="market-type">
                                    {market.horse || t(`market.types.${market.type}`, market.type.replace('_', ' '))}
                                </span>
                                <span className={`market-status status-${market.status}`}>
                                    {t(`market.status.${market.status}`)}
                                </span>
                            </div>
                        </div>
                        <div className="market-odds">
                            {market.odds.toFixed(2)}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
