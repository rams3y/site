import { NumberCategory, LifecellCode } from '../types';

export interface CategoryMeta {
  id: NumberCategory;
  title: string;
  color: string;
  gradient: string;
  icon: string;
}

export const CATEGORIES_META: CategoryMeta[] = [
  { id: 'bronze',    title: 'Бронза',    color: '#cd7f32', gradient: 'from-amber-700 to-amber-900',  icon: '🥉' },
  { id: 'silver',    title: 'Срібло',    color: '#c0c0c0', gradient: 'from-gray-300 to-gray-500',   icon: '🥈' },
  { id: 'gold',      title: 'Золото',    color: '#ffd700', gradient: 'from-yellow-400 to-yellow-600', icon: '🥇' },
  { id: 'platinum',  title: 'Платина',   color: '#e5e4e2', gradient: 'from-gray-100 to-gray-300',   icon: '💎' },
  { id: 'vip',       title: 'VIP',       color: '#ff00ff', gradient: 'from-fuchsia-500 to-purple-700', icon: '👑' },
  { id: 'thousands', title: 'Тисячники', color: '#00bcd4', gradient: 'from-cyan-400 to-blue-600',    icon: '🔢' },
  { id: 'butterfly', title: 'Метелики',  color: '#ff6b6b', gradient: 'from-pink-400 to-rose-600',    icon: '🦋' },
];

export function formatPhoneNumber(code: string, digits: string): string {
  if (digits.length === 7) {
    return `+38 (${code}) ${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5,7)}`;
  }
  return `+38 (${code}) ${digits}`;
}

export function getCodeOperator(code: string): { operator: 'kyivstar' | 'vodafone' | 'lifecell'; operatorName: string } {
  if (['063', '073', '093'].includes(code)) return { operator: 'lifecell', operatorName: 'Lifecell' };
  if (['050', '066', '095', '099', '075'].includes(code)) return { operator: 'vodafone', operatorName: 'Vodafone' };
  if (['067', '068', '096', '097', '098', '077'].includes(code)) return { operator: 'kyivstar', operatorName: 'Kyivstar' };
  return { operator: 'lifecell', operatorName: 'Lifecell' };
}

export const ALL_CODES: LifecellCode[] = [
  '063', '073', '093',
  '050', '066', '095', '099', '075',
  '067', '068', '096', '097', '098', '077',
];
