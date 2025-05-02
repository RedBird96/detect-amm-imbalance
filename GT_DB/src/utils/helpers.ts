export const cartesianProduct = <T>(arrays: T[][]): T[][] => {
  return arrays
    .reduce<T[][]>((acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])), [[]])
    .filter((arr) => arr.length > 0); // Exclude empty initial combination
};

export const isWETH = (address: string): boolean =>
  address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
