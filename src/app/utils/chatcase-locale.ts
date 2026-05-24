import moment from 'moment';
import 'moment/locale/pt-br';

export const CHATCASE_TRANSLATION_LANG = 'pt';
export const CHATCASE_MOMENT_LOCALE = 'pt-br';
export const CHATCASE_BROWSER_LOCALE = 'pt-BR';
export const CHATCASE_TIMEZONE = 'America/Sao_Paulo';

export function applyChatcaseMomentLocale(): string {
  moment.locale(CHATCASE_MOMENT_LOCALE);
  return CHATCASE_MOMENT_LOCALE;
}

export function getChatcaseTranslationLang(): string {
  return CHATCASE_TRANSLATION_LANG;
}

export function formatChatcaseDateTime(value: string | Date): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString(CHATCASE_BROWSER_LOCALE, { timeZone: CHATCASE_TIMEZONE });
}

export function formatChatcaseDate(value: string | Date): string {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(CHATCASE_BROWSER_LOCALE, { timeZone: CHATCASE_TIMEZONE });
}
