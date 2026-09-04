import { LifecellNumber, NumberCategory } from '../types';
import catalogData from './all_numbers.json';

export function formatPhoneNumber(code: string, digits: string): string {
  if (digits.length !== 7) return `${code} ${digits}`;
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 5);
  const p3 = digits.slice(5, 7);
  return `${code} ${p1}-${p2}-${p3}`;
}

export function formatFullInternational(code: string, digits: string): string {
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 5);
  const p3 = digits.slice(5, 7);
  return `+38 (${code}) ${p1}-${p2}-${p3}`;
}

// 1-to-1 exact numbers scraped directly from meganomer.com.ua for Kyivstar, Vodafone, Lifecell
export const LIFECELL_NUMBERS: LifecellNumber[] = catalogData as LifecellNumber[];

export interface CategoryMeta {
  id: 'all' | NumberCategory;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
}

export const CATEGORIES_META: CategoryMeta[] = [
  {
    id: 'all',
    title: 'Всі номери',
    shortTitle: 'Всі номери',
    icon: 'Sparkles',
    description: 'Повний каталог красивих номерів Kyivstar, Vodafone, Lifecell 1 в 1 з meganomer.com.ua',
  },
  {
    id: 'vip',
    title: 'VIP & Діамантові номери',
    shortTitle: 'VIP & Diamond',
    icon: 'Crown',
    description: 'Сім однакових цифр, топ-престиж та ексклюзивні серії',
  },
  {
    id: 'platinum',
    title: 'Платинові номери (Platinum)',
    shortTitle: 'Платинові',
    icon: 'Gem',
    description: 'П\'ять однакових цифр, преміальні послідовності та статус',
  },
  {
    id: 'gold',
    title: 'Золоті номери (Gold)',
    shortTitle: 'Золоті',
    icon: 'Award',
    description: 'Потрійні цифри, гармонійні закінчення та комбінації для бізнесу',
  },
  {
    id: 'silver',
    title: 'Срібні номери (Silver)',
    shortTitle: 'Срібні',
    icon: 'Shield',
    description: 'Симетричні, дзеркальні та красиві комбінації',
  },
  {
    id: 'butterfly',
    title: 'Метелики (AB AB AB)',
    shortTitle: 'Метелики',
    icon: 'Layers',
    description: 'Ритмічні повтори трьох пар однакових цифр',
  },
  {
    id: 'thousands',
    title: 'Тисячники (00-00)',
    shortTitle: 'Тисячі',
    icon: 'Hash',
    description: 'Номери з чотирма або п\'ятьма нулями',
  },
  {
    id: 'ladder',
    title: 'Драбинки (1234 / 4321)',
    shortTitle: 'Драбинки',
    icon: 'TrendingUp',
    description: 'Прямі та зворотні послідовності цифр',
  },
  {
    id: 'bronze',
    title: 'Доступні красиві (Bronze)',
    shortTitle: 'Доступні',
    icon: 'Tag',
    description: 'Легкі для запам\'ятовування номери за доступною ціною',
  }
];

export interface OperatorMeta {
  id: 'all' | 'kyivstar' | 'vodafone' | 'lifecell';
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  codes: string[];
}

export const OPERATORS_META: OperatorMeta[] = [
  {
    id: 'all',
    name: 'Всі оператори',
    shortName: 'Всі',
    color: 'text-white',
    bgColor: 'bg-zinc-800',
    borderColor: 'border-zinc-700',
    codes: ['067', '068', '096', '097', '098', '077', '050', '066', '095', '099', '075', '063', '073', '093']
  },
  {
    id: 'kyivstar',
    name: 'Київстар',
    shortName: 'Київстар',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    codes: ['067', '068', '096', '097', '098', '077']
  },
  {
    id: 'vodafone',
    name: 'Vodafone',
    shortName: 'Vodafone',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    codes: ['050', '066', '095', '099', '075']
  },
  {
    id: 'lifecell',
    name: 'Lifecell',
    shortName: 'Lifecell',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    codes: ['063', '073', '093']
  }
];
