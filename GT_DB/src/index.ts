import { DatabaseService } from './services/DatabaseService'; // Service for database operations.
import { TokenService } from './services/TokenService';       // Service for token-related operations.
import { RouteService } from './services/RouteService';       // Service for processing routes.
import db from './config/database';                          // Database instance.

// Main function that orchestrates the data processing workflow.
async function main() {
  try {
    console.time('Processing Time'); // Start a timer to measure the execution time.

    // Step 1: Import tokens into the database.
    console.log('[1/4] Importing tokens...');
    TokenService.importTokensFromFile('tokens.json'); // Load token data from a file.

    // Step 2: Process liquidity pools and routes.
    console.log('[2/4] Processing liquidities...');
    console.log('[3/4] Processing routes...');
    await RouteService.processPaths('uni_sushi_paths.json'); // Process paths for token swaps.

    // Step 3: Display results.
    console.log('[4/4] Results:');
    console.log(`Tokens: ${DatabaseService.getCount('TOKEN_INFO')}`); // Count of tokens.
    console.log(`LPs: ${DatabaseService.getCount('LP_INFO')}`);      // Count of liquidity pools.
    console.log(`Routes: ${DatabaseService.getCount('ROUTE')}`);    // Count of routes.

    console.timeEnd('Processing Time'); // End the timer and display the elapsed time.
  } catch (error) {
    console.error('Error:', error); // Log any errors that occur during execution.
    process.exit(1);               // Exit the process with an error code.
  } finally {
    db.close(); // Ensure the database connection is closed to prevent resource leaks.
  }
}

// Execute the main function.
main();
