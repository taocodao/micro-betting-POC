import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const languages = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'zh', label: '中', flag: '🇨🇳' },
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
];

export function LanguageSelector() {
    const { i18n } = useTranslation();

    return (
        <div className="language-selector">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    className={`lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    title={lang.code.toUpperCase()}
                >
                    <span className="flag">{lang.flag}</span>
                    <span className="label">{lang.label}</span>
                </button>
            ))}
        </div>
    );
}
