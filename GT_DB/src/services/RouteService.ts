// Import necessary modules and explicitly typed imports
import { DatabaseService } from './DatabaseService';
import { createReadStream } from 'fs';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { CONFIG } from '../config/constants';
import { LPData, RoutePath, PathGroup, PathGroupItem, TABLES } from '../types';
import { fetchTokenAddresses } from '../utils/helpers';

export class RouteService {
  // Method to process and store route paths from a file
  static async processPaths(filePath: string): Promise<void> {
    const lpSet = new Set<string>(); // Track unique liquidity pool addresses
    const routeQueue: RoutePath[] = []; // Queue of routes to be inserted
    const tokenPairs = new Map<string, LPData>(); // Map of token pairs for LPs

    // Process the file and extract valid path groups
    await this.processFile(filePath, (pathGroup) => {
      this.processPathGroup(pathGroup, lpSet, routeQueue, tokenPairs);
    });

    // Convert LP addresses into database-compatible objects
    const lpObjects = Array.from(lpSet)
      .map((lp) => {
        const pair = tokenPairs.get(lp);
        return pair ? { ...pair } : null;
      })
      .filter((lp): lp is LPData => lp !== null); // Filter out null values
    
    // Insert LPs and routes into the database
    if (lpObjects.length > 0) {
      const updatedLpArr = await fetchTokenAddresses(lpObjects);
      await DatabaseService.batchInsertLPs(updatedLpArr);
    }
    const routeStrings = routeQueue.map((path) => JSON.stringify(path));
    await DatabaseService.batchInsertRoutes(routeStrings);
  }

  // Helper method to process a file line by line
  private static async processFile(
    filePath: string,
    handler: (pathGroup: PathGroup) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pipeline = chain([createReadStream(filePath), parser(), streamArray()]); // Create processing pipeline

      pipeline.on('data', ({ value }) => {
        try {
          if (this.isValidPathGroup(value)) {
            handler(value); // Process each valid path group
          }
        } catch (error) {
          console.error('Error processing data chunk:', error);
        }
      });

      pipeline.on('end', resolve); // Resolve the promise when processing is complete
      pipeline.on('error', reject); // Reject the promise if an error occurs
    });
  }

  // Method to validate if an object is a valid path group
  private static isValidPathGroup(group: unknown): group is PathGroup {
    return (
      Array.isArray(group) &&
      group.every(
        (item) =>
          Array.isArray(item) &&
          item.length === 2 &&
          typeof item[0] === 'string' &&
          CONFIG.ADDRESS_REGEX.test(item[0]) &&
          Array.isArray(item[1])
      )
    );
  }

  // Method to process a path group and extract LP and route data
  private static processPathGroup(
    pathGroup: PathGroup,
    lpSet: Set<string>,
    routeQueue: RoutePath[],
    tokenPairs: Map<string, LPData>
  ): void {
    try {
      const validPaths = pathGroup
        .map((item): PathGroupItem | null => {
          const [token, liquidities] = item;
          const normalizedToken = token.toLowerCase().trim();

          if (!CONFIG.ADDRESS_REGEX.test(normalizedToken)) return null; // Validate token format

          const validLiquidities = liquidities
            .filter((lp): lp is string => typeof lp === 'string')
            .map((lp) => lp.toLowerCase().trim())
            .filter((lp) => CONFIG.ADDRESS_REGEX.test(lp)); // Validate LP addresses

          return validLiquidities.length > 0
            ? { token: normalizedToken, liquidities: validLiquidities }
            : null;
        })
        .filter((p): p is PathGroupItem => p !== null); // Remove null entries

      if (validPaths.length < CONFIG.MIN_PATH_LENGTH) return; // Skip short paths

      validPaths.forEach(({ token, liquidities }) => {
        liquidities.forEach((lp) => {
          lpSet.add(lp); // Add LP to the set
          tokenPairs.set(lp, {
            address: lp,
            token1_address: '',
            token2_address: '',
          });
        });
      });
      for (const combination of this.generateValidRoutes(validPaths)) {
        routeQueue.push(combination); // Add valid routes to the queue
      }
    } catch (error) {
      console.error('Error processing path group:', error);
    }
  }

  // Generator to create all valid route combinations
  private static *generateValidRoutes(paths: PathGroupItem[]): Generator<RoutePath> {
    const liquidityOptions = paths.map((p) => p.liquidities);

    for (const combination of this.cartesianProduct(liquidityOptions)) {
      const uniqueLPs = new Set(combination);
      if (
        combination.length >= CONFIG.MIN_PATH_LENGTH &&
        combination.length <= CONFIG.MAX_PATH_LENGTH &&
        uniqueLPs.size === combination.length
      ) {
        yield paths.map(({ token }, idx) => [token, [combination[idx]]]); // Yield valid routes
      }
    }
  }

  // Helper generator for Cartesian product of arrays
  private static *cartesianProduct(arrays: string[][]): Generator<string[]> {
    if (!arrays.length) return;

    function* helper(index: number, current: string[]): Generator<string[]> {
      if (index === arrays.length) {
        yield current; // Yield complete combinations
        return;
      }
      for (const item of arrays[index]) {
        yield* helper(index + 1, [...current, item]); // Recurse to the next level
      }
    }

    yield* helper(0, []); // Start the recursive generation
  }
}