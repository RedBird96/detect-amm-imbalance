import { ethers } from 'ethers';
import { PoolABI } from '../config/constants';
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from 'ethereum-multicall';
import { LPData } from '../types';

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

function extractEthereumAddress(bytesArray: any[]): string {
  // Convert the byte array to a hex string
  const hexString = ethers.utils.hexlify(bytesArray);

  // Ensure the string has the correct length
  if (hexString.length !== 66) {
    throw new Error("Invalid input. Expected a 32-byte hex string.");
  }

  // Extract the last 20 bytes (40 characters)
  const ethereumAddress = "0x" + hexString.slice(-40);

  return ethereumAddress;
}

const convertToContractCallContext = (lpArr: LPData[], abi: any[]): ContractCallContext[] => {
  return lpArr.map(pool => ({
    reference: pool.address, // Unique identifier for the contract
    contractAddress: pool.address,
    abi: abi, // ABI defining the methods for the contract
    calls: [
      {
        reference: 'token0', // Reference for the token0 method call
        methodName: 'token0', // The method name to call
        methodParameters: []  // No parameters needed for this method
      },
      {
        reference: 'token1', // Reference for the token1 method call
        methodName: 'token1', // The method name to call
        methodParameters: []  // No parameters needed for this method
      }
    ]
  }));
};

export async function fetchTokenAddresses(lpArr: { address: string, token1_address: string, token2_address: string }[]) {
  const provider = new ethers.providers.InfuraProvider("homestead", "https://gas.api.infura.io/v3/3856c596592c4f29b48fa65916a34ae1");
  const multicall = new Multicall({ ethersProvider: provider, tryAggregate: true });

  const contractCallContext = convertToContractCallContext(lpArr, PoolABI);

  // Execute multicall
  const results: ContractCallResults = await multicall.call(contractCallContext);
  // Update lpArr with token addresses
  lpArr.forEach(pool => {
    const token0 = results.results[pool.address].callsReturnContext[0].returnValues
    const token1 = results.results[pool.address].callsReturnContext[1].returnValues
    pool.token1_address = extractEthereumAddress(token0) || '';
    pool.token2_address = extractEthereumAddress(token1) || '';
  });

  return lpArr;
}