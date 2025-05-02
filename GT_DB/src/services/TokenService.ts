import { DatabaseService } from './DatabaseService';
import fs from 'fs';

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export class TokenService {
  static importTokensFromFile(filePath: string): void {
    const tokens = fs
      .readFileSync(filePath, 'utf-8')
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => {
        const data = JSON.parse(l);
        return {
          address: data.address.toLowerCase(),
          symbol: data.symbol,
          name: data.name,
          decimals: parseInt(data.decimals, 10),
        };
      });

    DatabaseService.batchInsertTokens(tokens);
  }

  static getTokenByAddress(address: string): TokenInfo | null {
    return DatabaseService.getToken(address.toLowerCase());
  }
}
