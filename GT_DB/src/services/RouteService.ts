import { DatabaseService } from './DatabaseService';
import { createReadStream } from 'fs';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { CONFIG } from '../config/constants';
import { LPData, RoutePath, PathGroup, PathGroupItem, TABLES } from '../types'; // Explicit imports

export class RouteService {
  static async processPaths(filePath: string): Promise<void> {
    const lpSet = new Set<string>();
    const routeQueue: RoutePath[] = [];
    const tokenPairs = new Map<string, LPData>();

    await this.processFile(filePath, (pathGroup) => {
      this.processPathGroup(pathGroup, lpSet, routeQueue, tokenPairs);
    });

    const lpObjects = Array.from(lpSet)
      .map((lp) => {
        const pair = tokenPairs.get(lp);
        return pair ? { ...pair } : null;
      })
      .filter((lp): lp is LPData => lp !== null);

    if (lpObjects.length > 0) {
      await DatabaseService.batchInsertLPs(lpObjects);
    }

    const routeStrings = routeQueue.map((path) => JSON.stringify(path));
    await DatabaseService.batchInsertRoutes(routeStrings);
  }

  private static async processFile(
    filePath: string,
    handler: (pathGroup: PathGroup) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const pipeline = chain([createReadStream(filePath), parser(), streamArray()]);

      pipeline.on('data', ({ value }) => {
        try {
          if (this.isValidPathGroup(value)) {
            handler(value);
          }
        } catch (error) {
          console.error('Error processing data chunk:', error);
        }
      });

      pipeline.on('end', resolve);
      pipeline.on('error', reject);
    });
  }

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

          if (!CONFIG.ADDRESS_REGEX.test(normalizedToken)) return null;

          const validLiquidities = liquidities
            .filter((lp): lp is string => typeof lp === 'string')
            .map((lp) => lp.toLowerCase().trim())
            .filter((lp) => CONFIG.ADDRESS_REGEX.test(lp));

          return validLiquidities.length > 0
            ? { token: normalizedToken, liquidities: validLiquidities }
            : null;
        })
        .filter((p): p is PathGroupItem => p !== null);

      if (validPaths.length < CONFIG.MIN_PATH_LENGTH) return;

      validPaths.forEach(({ token, liquidities }) => {
        liquidities.forEach((lp) => {
          lpSet.add(lp);
          tokenPairs.set(lp, {
            address: lp,
            token1_address: token,
            token2_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          });
        });
      });
      for (const combination of this.generateValidRoutes(validPaths)) {
        routeQueue.push(combination);
      }
    } catch (error) {
      console.error('Error processing path group:', error);
    }
  }

  private static *generateValidRoutes(paths: PathGroupItem[]): Generator<RoutePath> {
    const liquidityOptions = paths.map((p) => p.liquidities);

    for (const combination of this.cartesianProduct(liquidityOptions)) {
      const uniqueLPs = new Set(combination);
      if (
        combination.length >= CONFIG.MIN_PATH_LENGTH &&
        combination.length <= CONFIG.MAX_PATH_LENGTH &&
        uniqueLPs.size === combination.length
      ) {
        yield paths.map(({ token }, idx) => [token, [combination[idx]]]);
      }
    }
  }

  private static *cartesianProduct(arrays: string[][]): Generator<string[]> {
    if (!arrays.length) return;

    function* helper(index: number, current: string[]): Generator<string[]> {
      if (index === arrays.length) {
        yield current;
        return;
      }
      for (const item of arrays[index]) {
        yield* helper(index + 1, [...current, item]);
      }
    }

    yield* helper(0, []);
  }
}
