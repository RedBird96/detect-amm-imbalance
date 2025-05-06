import { ethers } from "ethers";
import fs from "fs";
import { Mutex } from "async-mutex";
import { EventEmitter } from "events";
import {
  START_AMOUNT,
  FEE_PERCENT,
  START_CURRENCY,
  LOG_FILE_NAME,
} from "../config/constants";
import { DatabaseManager } from "../database/dbManager";

/**
 * Calculates arbitrage opportunities across different liquidity pools.
 * Extends EventEmitter to broadcast arbitrage opportunities to subscribers.
 */
export class ArbitrageCalculator extends EventEmitter {
  private dbManager: DatabaseManager;
  private logStream: fs.WriteStream;
  private mutex = new Mutex();

  /**
   * Creates a new ArbitrageCalculator instance.
   *
   * @param {DatabaseManager} dbManager - Database manager instance for accessing pool and route data
   */
  constructor(dbManager: DatabaseManager) {
    super();
    this.dbManager = dbManager;
    this.logStream = fs.createWriteStream(LOG_FILE_NAME, { flags: "a" });
  }

  /**
   * Logs a message to both console and log file.
   *
   * @param {string} message - Message to be logged
   * @private
   */
  private logMessage(message: string) {
    console.log(message);
    this.logStream.write(message + "\n");
  }

  /**
   * Calculates arbitrage opportunities for a given pool.
   * Analyzes all possible routes through the pool and calculates potential profits.
   *
   * @param {any} poolInfo - Information about the liquidity pool
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async calculateArbitrageOpportunities(poolInfo: any) {
    // Convert start amount to wei (smallest unit of ETH)
    const startAmount = ethers.parseEther(START_AMOUNT);
    let currentAmount = startAmount;
    // Calculate fee multiplier (e.g., 0.997 for 0.3% fee)
    const feeMultiplier = 1 - FEE_PERCENT / 100;

    // Get necessary data structures from database
    const lp2routeMapping = this.dbManager.getLP2RouteMapping();
    const routeMap = this.dbManager.getRouteMap();
    const tokenMap = this.dbManager.getTokenMap();

    // Get all possible routes that include this pool
    const routePathIds = lp2routeMapping.get(poolInfo.address);
    if (routePathIds) {
      // Process all routes in parallel
      await Promise.all(
        routePathIds.map(async (pathId) => {
          const routePath = routeMap.get(pathId);
          if (routePath) {
            // Reset amount for this path
            currentAmount = startAmount;
            let pathDescription = START_CURRENCY;
            let logDescription = `${START_AMOUNT} ${START_CURRENCY}`;

            // Process each hop in the route
            for (const pathItem of routePath.routeInfo) {
              const lpPool = this.dbManager.getLPMap().get(pathItem.lp);
              if (lpPool) {
                // Determine token order in the pool
                const isToken1Target =
                  pathItem.target === lpPool.token1_address;
                // Set input and output tokens based on direction
                const tokenIn = isToken1Target
                  ? lpPool.token2_address.toLowerCase()
                  : lpPool.token1_address.toLowerCase();
                const tokenOut = isToken1Target
                  ? lpPool.token1_address.toLowerCase()
                  : lpPool.token2_address.toLowerCase();
                // Get corresponding reserves
                const reserveIn = isToken1Target
                  ? lpPool.reserve2
                  : lpPool.reserve1;
                const reserveOut = isToken1Target
                  ? lpPool.reserve1
                  : lpPool.reserve2;

                // Get token information for logging
                const tokenInfoIn = tokenMap.get(tokenIn);
                const tokenInfoOut = tokenMap.get(tokenOut);
                const tokenSymbolIn = tokenInfoIn
                  ? tokenInfoIn.symbol
                  : "UNKNOWN";
                const tokenSymbolOut = tokenInfoOut
                  ? tokenInfoOut.symbol
                  : "UNKNOWN";
                const decimalsIn = tokenInfoIn ? tokenInfoIn.decimals : 0;
                const decimalsOut = tokenInfoOut ? tokenInfoOut.decimals : 0;

                // Update path description for logging
                pathDescription += ` -> ${tokenSymbolOut}`;

                // Calculate output amount using constant product formula
                const amountOut = this.getAmountOutWithFee(
                  currentAmount,
                  reserveIn,
                  reserveOut,
                  feeMultiplier,
                  decimalsIn,
                  decimalsOut,
                );

                // Convert amounts to human-readable format for logging
                const adjustedCurrentAmount =
                  Number(currentAmount) / 10 ** decimalsIn;
                const adjustedAmountOut = Number(amountOut) / 10 ** decimalsOut;

                // Add step to log description
                logDescription += ` -> ${adjustedAmountOut.toFixed(decimalsOut)} ${tokenSymbolOut} (${lpPool.address} - ${isToken1Target})\r\n`;
                // Update current amount for next hop
                currentAmount = amountOut;
              }
            }

            // Calculate final profit
            const profit = currentAmount - startAmount;
            const adjustedProfit = Number(profit) / 10 ** 18;
            // Log if profitable
            if (profit > 0n) {
              this.logMessage(
                `Arbitrage opportunity detected! Path: ${pathDescription} Profit: ${adjustedProfit.toFixed(18)} ETH`,
              );
              this.logMessage(`Calculation steps: ${logDescription}`);
            }
            console.log(`LP updated: ${pathId}, ${pathDescription}, ${adjustedProfit}`);
            // Emit update regardless of profitability
            this.emit("arbitrageRateUpdated", {
              pathId,
              pathDescription,
              rate: adjustedProfit,
            });
          }
        }),
      );
    }
  }

  /**
   * Calculates the output amount for a given input amount, considering fees and decimals.
   * Uses the constant product formula (x * y = k) with fee adjustment.
   *
   * @param {bigint} amountIn - Input amount
   * @param {bigint} reserveIn - Reserve of input token
   * @param {bigint} reserveOut - Reserve of output token
   * @param {number} feeMultiplier - Multiplier for fee calculation (1 - fee%)
   * @param {number} decimalsIn - Decimals of input token
   * @param {number} decimalsOut - Decimals of output token
   * @private
   * @returns {bigint} Output amount after fee
   */
  private getAmountOutWithFee(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
    feeMultiplier: number,
    decimalsIn: number,
    decimalsOut: number,
  ): bigint {
    // Return 0 if either reserve is empty
    if (reserveIn === 0n || reserveOut === 0n) {
      return 0n;
    }

    // Adjust amounts to same decimal precision
    const adjustedAmountIn =
      (amountIn * BigInt(10 ** decimalsOut)) / BigInt(10 ** decimalsIn);
    const adjustedReserveIn =
      (reserveIn * BigInt(10 ** decimalsOut)) / BigInt(10 ** decimalsIn);
    const adjustedReserveOut = reserveOut;

    // Apply fee to input amount
    const amountInWithFee = BigInt(
      Math.floor(Number(adjustedAmountIn) * feeMultiplier),
    );

    // Calculate output amount using constant product formula:
    // (x + Δx)(y - Δy) = xy
    // where x = reserveIn, y = reserveOut, Δx = amountInWithFee
    const numerator = amountInWithFee * adjustedReserveOut;
    const denominator = BigInt(
      Math.floor(Number(adjustedReserveIn) * feeMultiplier) +
        Number(adjustedAmountIn),
    );

    // Prevent division by zero
    if (denominator === 0n) {
      return 0n;
    }

    // Return calculated output amount
    return numerator / denominator;
  }

  /**
   * Updates pool reserves and recalculates arbitrage opportunities.
   * Uses mutex to ensure thread-safe updates.
   *
   * @param {string} lpAddress - Address of the liquidity pool
   * @param {ethers.BigNumberish} amount0 - New reserve amount for token0
   * @param {ethers.BigNumberish} amount1 - New reserve amount for token1
   * @async
   * @returns {Promise<void>}
   */
  async updateReservesAndCalculateArbitrage(
    lpAddress: string,
    amount0: ethers.BigNumberish,
    amount1: ethers.BigNumberish,
  ) {
    // Get pool information from database
    const lpMap = this.dbManager.getLPMap();
    const poolInfo = lpMap.get(lpAddress);

    // Acquire mutex to prevent concurrent updates
    const release = await this.mutex.acquire();
    try {
      if (poolInfo) {
        // Create a copy of pool info to avoid modifying the original
        const tempPool = { ...poolInfo };
        // Update reserves with new values
        tempPool.reserve1 = BigInt(amount0.toString());
        tempPool.reserve2 = BigInt(amount1.toString());
        // Save updated pool info back to database
        lpMap.set(lpAddress, tempPool);
        // Recalculate arbitrage opportunities with new reserves
        await this.calculateArbitrageOpportunities(tempPool);
      }
    } finally {
      // Always release the mutex, even if an error occurs
      release();
    }
  }
}
