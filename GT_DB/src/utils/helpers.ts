/**
 * Generates the Cartesian product of an array of arrays.
 * @param arrays - An array of arrays, where each inner array contains elements of type `T`.
 * @returns An array containing all possible combinations of one element from each inner array.
 */
export const cartesianProduct = <T>(arrays: T[][]): T[][] => {
  // Reduce the arrays into a Cartesian product by combining each current element with accumulated combinations.
  return arrays
    .reduce<T[][]>(
      (acc, curr) => 
        acc.flatMap((c) => 
          curr.map((n) => [...c, n])
        ), 
      [[]] // Start with an initial empty array to allow combinations to build up.
    )
    .filter((arr) => arr.length > 0); // Exclude any empty combinations (if the input contains empty arrays).
};

/**
 * Checks if a given address is the WETH (Wrapped Ether) contract address.
 * @param address - The Ethereum address to check.
 * @returns `true` if the address matches the canonical WETH address, otherwise `false`.
 */
export const isWETH = (address: string): boolean =>
  // Compare the input address (in lowercase) to the canonical WETH contract address (also lowercase).
  address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';