// Service class to handle token-related operations
import { DatabaseService } from './DatabaseService';
import fs from 'fs';

interface TokenInfo {
  address: string; // Unique address of the token
  symbol: string; // Symbol for the token
  name: string; // Name of the token
  decimals: number; // Decimal places supported by the token
}

export class TokenService {
  // Method to import tokens from a file
  static importTokensFromFile(filePath: string): void {
    const tokens = fs
      .readFileSync(filePath, 'utf-8') // Read file content
      .split('\n') // Split into lines
      .filter((l) => l.trim()) // Filter out empty lines
      .map((l) => {
        const data = JSON.parse(l); // Parse each line as JSON
        return {
          address: data.address.toLowerCase(),
          symbol: data.symbol,
          name: data.name,
          decimals: parseInt(data.decimals, 10), // Parse decimals as an integer
        };
      });

    DatabaseService.batchInsertTokens(tokens); // Insert tokens into the database
  }

  // Method to retrieve token information by address
  static getTokenByAddress(address: string): TokenInfo | null {
    return DatabaseService.getToken(address.toLowerCase()); // Fetch token from the database
  }
}