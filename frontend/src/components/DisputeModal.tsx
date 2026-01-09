import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './DisputeModal.css';

interface DisputeModalProps {
    betId: string;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<DisputeResult>;
}

interface DisputeResult {
    verdict: 'CORRECT' | 'INCORRECT';
    explanation: string;
    attestationHash: string;
}

export function DisputeModal({ betId, onClose, onSubmit }: DisputeModalProps) {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<DisputeResult | null>(null);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const disputeResult = await onSubmit(reason);
            setResult(disputeResult);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">{t('dispute.title')}</h3>

                <div className="bet-info">
                    Bet ID: {betId.slice(0, 16)}...
                </div>

                {!result ? (
                    <>
                        <div className="form-group">
                            <label>{t('dispute.reason')}</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter your dispute reason..."
                                rows={3}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={onClose}>
                                {t('common.cancel')}
                            </button>
                            <button
                                className="btn-submit"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('common.loading') : t('dispute.submit')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="dispute-result">
                        <div className={`verdict ${result.verdict.toLowerCase()}`}>
                            <span className="verdict-label">{t('dispute.verdict')}</span>
                            <span className="verdict-value">
                                {result.verdict === 'CORRECT'
                                    ? t('dispute.correct')
                                    : t('dispute.incorrect')}
                            </span>
                        </div>

                        <div className="explanation">
                            <span className="label">{t('dispute.explanation')}</span>
                            <p>{result.explanation}</p>
                        </div>

                        <div className="attestation">
                            <span className="label">{t('dispute.attestation')}</span>
                            <code>{result.attestationHash.slice(0, 32)}...</code>
                        </div>

                        <button className="btn-close" onClick={onClose}>
                            {t('common.close')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
