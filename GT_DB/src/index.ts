import { DatabaseService } from './services/DatabaseService';
import { TokenService } from './services/TokenService';
import { RouteService } from './services/RouteService';
import db from './config/database';

async function main() {
  try {
    console.time('Processing Time');

    // 1. Import tokens
    console.log('[1/4] Importing tokens...');
    TokenService.importTokensFromFile('tokens.json');

    // 2. Process paths
    console.log('[2/4] Processing liquidities...');
    console.log('[3/4] Processing routes...');
    await RouteService.processPaths('uni_sushi_paths.json');

    // 3. Show results
    console.log('[4/4] Results:');
    console.log(`Tokens: ${DatabaseService.getCount('TOKEN_INFO')}`);
    console.log(`LPs: ${DatabaseService.getCount('LP_INFO')}`);
    console.log(`Routes: ${DatabaseService.getCount('ROUTE')}`);

    console.timeEnd('Processing Time');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Execute
main();
