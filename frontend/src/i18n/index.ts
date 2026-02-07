// frontend/src/i18n/index.ts
import { ref } from 'vue';
import zhTW from './zh-TW';
import en from './en';

const locales: Record<string, Record<string, string>> = { 'zh-TW': zhTW, en };
export type Locale = 'zh-TW' | 'en';

const saved = localStorage.getItem('locale') as Locale | null;
export const currentLocale = ref<Locale>(saved && locales[saved] ? saved : 'zh-TW');

export function t(key: string, params?: Record<string, string | number>): string {
  let text = locales[currentLocale.value]?.[key] || locales['zh-TW']?.[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function setLocale(locale: Locale) {
  currentLocale.value = locale;
  localStorage.setItem('locale', locale);
}

export function getDateLocale(): string {
  return currentLocale.value === 'en' ? 'en-US' : 'zh-TW';
}
