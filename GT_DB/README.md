# GT_DB - DeFi Data Processor

GT_DB is a TypeScript-based project designed to process and manage DeFi (Decentralized Finance) data, specifically focusing on token information, liquidity pools, and routing paths. This project provides a robust database solution for storing and managing DeFi-related data using SQLite.

## Features

- Token information management
- Liquidity pool (LP) data storage
- Route path generation and storage
- Efficient data processing with SQLite
- TypeScript support for type safety

## Prerequisites

- Node.js (v14 or higher)
- Yarn package manager
- TypeScript

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GT_DB
```

2. Install dependencies:
```bash
yarn install
```

## Project Structure

```
GT_DB/
├── src/
│   ├── config/     # Configuration files
│   ├── services/   # Core services
│   ├── utils/      # Utility functions
│   ├── types.ts    # TypeScript type definitions
│   └── index.ts    # Main entry point
├── package.json
└── tsconfig.json
```

## Database Structure

The project uses SQLite with the following main tables:

### 1. TokenInfo Table
Stores information about tokens:
- `address` (string): Token's blockchain address
- `symbol` (string): Token symbol (e.g., ETH, WBTC)
- `name` (string): Token name
- `decimals` (number): Number of decimal places

### 2. LPInfo Table
Stores liquidity pool information:
- `address` (string): LP's blockchain address
- `token1_address` (string): First token's address
- `token2_address` (string): Second token's address

### 3. Route Table
Stores routing path information:
- Stores path groups and individual routes between tokens

## Usage

### Running the Project

1. Start the application:
```bash
yarn start
```

2. Build the project:
```bash
yarn build
```

### Data Processing

The project processes DeFi data in the following ways:

1. **Token Data Processing**:
   - Loads token information from `tokens.json`
   - Stores token data in the TokenInfo table

2. **Liquidity Pool Processing**:
   - Processes LP data from various sources
   - Stores LP information in the LPInfo table

3. **Route Generation**:
   - Generates routes between tokens using available liquidity pools
   - Stores route information in the Route table

### Available Scripts

- `yarn start`: Run the application
- `yarn build`: Build the TypeScript project
- `yarn format`: Format code using Prettier
- `yarn clear`: Clear generated files

## Dependencies

Main dependencies include:
- `better-sqlite3`: SQLite database driver
- `ethers`: Ethereum interaction
- `@uniswap/sdk`: Uniswap integration
- `ethereum-multicall`: Batch Ethereum calls
- `stream-json`: JSON streaming processing

## Development

1. Make sure to follow the TypeScript types defined in `src/types.ts`
2. Use the provided scripts for development tasks
3. Follow the existing code structure for consistency

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license information here]
