export type OperatorType = 'all' | 'kyivstar' | 'vodafone' | 'lifecell';

export type LifecellCode =
  | '063' | '073' | '093'
  | '050' | '066' | '095' | '099' | '075'
  | '067' | '068' | '096' | '097' | '098' | '077';

export type NumberCategory =
  | 'all' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip' | 'thousands' | 'butterfly';

export type BadgeType = 'EXCLUSIVE' | 'TOP' | 'HOT' | 'HIT' | 'NEW' | 'DISCOUNT' | undefined;

export interface LifecellNumber {
  id: string;
  rawNumber: string;
  formatted: string;
  code: LifecellCode;
  operator: 'kyivstar' | 'vodafone' | 'lifecell';
  operatorName: string;
  category: NumberCategory;
  categoryName: string;
  price: number;
  badge?: BadgeType;
  patternType: string;
  memorability: number;
  viewsCount: number;
}

export interface FilterState {
  operator: OperatorType;
  code: string;
  category: 'all' | NumberCategory;
  minPrice: number;
  maxPrice: number;
  searchQuery: string;
  sortBy: 'popular' | 'price_asc' | 'price_desc' | 'memorability' | 'newest';
}

export interface ServiceResult {
  success: boolean;
  message?: string;
  item?: LifecellNumber;
}
