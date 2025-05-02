// src/types.ts
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface LPData {
  address: string;
  token1_address: string;
  token2_address: string;
}

export type RoutePath = Array<[string, string[]]>;

export interface PathGroupItem {
  token: string;
  liquidities: string[];
}

export type PathGroup = Array<[string, string[]]>;

export const enum TABLES {
  TOKEN_INFO = 'TokenInfo',
  LP_INFO = 'LPInfo',
  ROUTE = 'Route',
}

export type TableName = keyof typeof TABLES;
