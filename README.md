# DETECT-AMM-IMBALANCE

This project is a comprehensive DeFi (Decentralized Finance) arbitrage detection system consisting of three interconnected components that work together to identify and analyze trading opportunities across different Automated Market Makers (AMMs).

## Project Components

### 1. GT_DB (Database Layer)
**Purpose**: Serves as the data foundation for the entire system.
- Processes and stores token information
- Manages liquidity pool data
- Generates and stores routing paths between tokens
- Uses SQLite for efficient data storage and retrieval

**Key Features**:
- Token information management
- Liquidity pool data storage
- Route path generation
- Efficient data processing with SQLite

**Installation & Setup**:
```bash
cd GT_DB
yarn install
yarn start
```

### 2. check_arbitrage (Analysis Engine)
**Purpose**: Core analysis component that identifies arbitrage opportunities.
- Analyzes price differences across different AMMs
- Calculates potential arbitrage opportunities
- Processes real-time market data
- Generates arbitrage reports
- Provides real-time data streaming via WebSocket server

**Key Features**:
- Real-time price monitoring
- Arbitrage opportunity detection
- Profit calculation
- Gas cost estimation
- WebSocket server for real-time data streaming
- Real-time updates to connected clients

**Installation & Setup**:
```bash
cd check_arbitrage-main
yarn install
yarn start
```

The WebSocket server will start automatically on port 8080 by default. The arbitrage_interface connects to this WebSocket server to receive real-time updates about arbitrage opportunities.

### 3. arbitrage_interface (User Interface)
**Purpose**: Provides a user-friendly interface for interacting with the system.
- Displays arbitrage opportunities
- Shows real-time market data
- Provides visualization of trading paths
- Allows user interaction with the system

**Key Features**:
- Real-time data visualization
- Interactive trading path display
- User-friendly dashboard
- Configuration management

**Installation & Setup**:
```bash
cd arbitrage_interface
yarn install
yarn start
```

## System Architecture

The three components work together in the following way:

1. **GT_DB** maintains the database of tokens, liquidity pools, and routes
2. **check_arbitrage** uses this data to identify arbitrage opportunities and streams updates via WebSocket
3. **arbitrage_interface** connects to the WebSocket server and displays the results

```
[GT_DB] → [check_arbitrage] → [WebSocket Server] → [arbitrage_interface]
   ↑            ↑                    ↑                    ↑
   └────────────┴────────────────────┴────────────────────┘
                    Data Flow & Communication
```

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- Yarn package manager
- SQLite
- Git

### Step-by-Step Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd DETECT-AMM-IMBALANCE
```

2. **Set Up GT_DB**
```bash
cd GT_DB
yarn install
yarn start
```

3. **Set Up check_arbitrage**
```bash
cd check_arbitrage-main
yarn install
yarn start
```

4. **Set Up arbitrage_interface**
```bash
cd arbitrage_interface
yarn install
yarn start
```

### Testing the System

1. **Database Population**
- GT_DB will automatically populate the database with token and liquidity pool information
- Verify the database creation by checking for `defi.db` file

2. **Arbitrage Detection and WebSocket Server**
- check_arbitrage will start monitoring for opportunities
- WebSocket server will start on port 8080
- Check the console output for detected opportunities
- Verify WebSocket connection in the browser console

3. **Interface Verification**
- Open the arbitrage_interface in your browser (typically at http://localhost:3000)
- Verify WebSocket connection is established
- Check for real-time updates in the interface

## Expected Results

### GT_DB
- Creates and maintains a SQLite database
- Stores token information, liquidity pools, and routes
- Provides data for the analysis engine

### check_arbitrage
- Identifies price differences across AMMs
- Calculates potential profits
- Generates detailed reports of opportunities

### arbitrage_interface
- Displays real-time arbitrage opportunities
- Shows trading paths and potential profits
- Provides interactive visualization of market data

## Troubleshooting

1. **Database Issues**
- Ensure SQLite is properly installed
- Check file permissions for database access
- Verify database schema is correct

2. **Analysis Engine and WebSocket Issues**
- Check network connectivity
- Verify API endpoints are accessible
- Monitor system resources
- Ensure port 8080 is available for WebSocket server
- Check WebSocket connection status in browser console
- Verify WebSocket server is running and accessible

3. **Interface Issues**
- Clear browser cache
- Check console for errors
- Verify all services are running
- Check WebSocket connection status
- Verify real-time updates are being received

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

[Add your license information here]