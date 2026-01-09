import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import zh from './zh.json';
import pt from './pt.json';

const resources = {
    en: { translation: en },
    zh: { translation: zh },
    pt: { translation: pt },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
    });

export default i18n;
