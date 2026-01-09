import { usePrivy } from '@privy-io/react-auth';
import { useTranslation } from 'react-i18next';
import './Header.css';
import { LanguageSelector } from './LanguageSelector';

export function Header() {
    const { t } = useTranslation();
    const { ready, authenticated, user, login, logout } = usePrivy();

    return (
        <header className="app-header">
            <div className="header-left">
                <span className="logo">⚡</span>
                <span className="app-name">{t('app.title')}</span>
            </div>

            <div className="header-right">
                <LanguageSelector />

                {ready && (
                    authenticated ? (
                        <div className="user-section">
                            <span className="user-email">
                                {user?.email?.address || user?.wallet?.address?.slice(0, 8) + '...'}
                            </span>
                            <button className="logout-btn" onClick={logout}>
                                {t('auth.logout')}
                            </button>
                        </div>
                    ) : (
                        <button className="login-btn" onClick={login}>
                            {t('auth.login')}
                        </button>
                    )
                )}
            </div>
        </header>
    );
}
