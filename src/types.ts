export type OperatorType = 'all' | 'lifecell' | 'kyivstar' | 'vodafone';

export type LifecellCode = '063' | '073' | '093';

export type KyivstarCode = '067' | '068' | '096' | '097' | '098' | '077';

export type VodafoneCode = '050' | '066' | '095' | '099' | '075';

export type AnyOperatorCode = LifecellCode | KyivstarCode | VodafoneCode | string;

export type NumberCategory = 
  | 'silver'       // Срібні
  | 'gold'         // Золоті
  | 'platinum'     // Платинові
  | 'vip'          // VIP / Діамантові
  | 'mirror'       // Дзеркальні
  | 'butterfly'    // Метелики
  | 'thousands'    // Тисячі
  | 'ladder'       // Драбинки
  | 'bronze';      // Бюджетні

export interface LifecellNumber {
  id: string;
  rawNumber: string;         // e.g. "0681526526"
  formatted: string;         // e.g. "068 1-526-526"
  operator?: 'lifecell' | 'kyivstar' | 'vodafone';
  operatorName?: string;      // "Lifecell" | "Київстар" | "Vodafone"
  code: string;              // "068", "063", "050", etc.
  category: NumberCategory;
  categoryName: string;
  price: number;             // Фіксована підсумкова ціна в грн
  originalPrice?: number;
  badge?: 'TOP' | 'HOT' | 'HIT' | 'NEW' | 'EXCLUSIVE' | 'DISCOUNT';
  patternType: string;       // e.g. "Дзеркальний 71-44-171", "Три пари 24-24-24", etc.
  memorability: number;      // 1 to 10
  viewsCount: number;
}

export interface FilterState {
  operator: OperatorType;
  code: 'all' | string;
  category: 'all' | NumberCategory;
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
  sortBy: 'popular' | 'price_asc' | 'price_desc' | 'memorability' | 'newest';
}

