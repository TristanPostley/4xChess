# Settlement Chess

A 4X strategy game inspired by chess, built with JavaScript, React, and Vite.

## Game Overview

Settlement Chess transforms traditional chess into a strategic 4X game where players:

- **Explore** a 20×20 world board covered in fog of war
- **Expand** by claiming territory and building settlements
- **Exploit** production nodes to create new pieces
- **Exterminate** opponents through chess-based combat

### Game Mechanics

- **Goal**: Claim 64 squares or eliminate all enemy kings
- **Start**: Each player begins with a King and retainers
- **Movement**: Armies move as consolidated units until deployed
- **Production**: Use pieces at factories to create pawns, then train pawns into other pieces
- **Territory**: Claim empty squares with pawns to expand your influence
- **Combat**: Deploy armies for chess-based battles using Stockfish engine

### Army Bonuses

Based on your most common piece type:
- **Knights**: Extra movement
- **Bishops**: Convert peasants to pawns
- **Rooks**: Build fortifications

## Tech Stack

- **Frontend**: React + Vite
- **Chess Engine**: Stockfish.wasm
- **Testing**: Vitest
- **Styling**: CSS3

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- Modern browser with WebAssembly support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd settlement-chess
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Running Tests

```bash
npm run test
```

## Project Structure

```
settlement-chess/
├── public/                 # Static assets
├── src/
│   ├── ui/                 # React components
│   │   └── WorldBoard.jsx  # Main game board component
│   ├── game/               # Core game logic
│   │   ├── board.js        # Board representation & helpers
│   │   ├── army.js         # Army management
│   │   ├── worldBoard.js   # World board system
│   │   ├── productionSystem.js # Production mechanics
│   │   ├── stockfish-wrapper.js # Chess engine integration
│   │   └── settlementChessGame.js # Main game orchestrator
│   ├── assets/             # Game assets
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── tests/                  # Test files
│   └── board.test.js       # Board logic tests
├── package.json
└── vite.config.js
```

## Controls

- **WASD**: Move camera around the world
- **1/2**: Select army 1 or 2
- **Click**: Deploy selected army or claim territory
- **Space**: End turn (planned)

## Game Systems

### World Board
- 20×20 grid with fog of war
- Production nodes scattered randomly
- Territory claiming system
- Army deployment mechanics

### Production System
- **Factories**: Convert any piece → 1 pawn
- **Training Grounds**: Convert 2 pawns → 1 piece
- **Monasteries**: Convert any piece → 1 bishop
- **Castles**: Convert any piece → 1 rook
- **Stables**: Convert any piece → 1 knight

### Army Management
- Consolidated movement until deployment
- Piece composition affects bonuses
- Deployment creates 3×3 formation
- Army strength tracking

## Development Notes

### Architecture
- Pure JavaScript game logic (easily testable)
- React for UI rendering
- Event-driven communication between systems
- Modular design for easy extension

### Testing Strategy
- Unit tests for pure game logic
- Integration tests for system interactions
- Manual testing for UI interactions

### Performance Considerations
- Spatial partitioning for collision detection
- Object pooling for frequent operations
- Efficient rendering (only visible tiles)
- Lazy loading for production nodes

## Future Enhancements

- [ ] Chess-based combat system
- [ ] AI opponents
- [ ] Multiplayer support
- [ ] Save/load game states
- [ ] Advanced production chains
- [ ] Settlement building mechanics
- [ ] Victory condition animations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by traditional chess and 4X strategy games
- Uses Stockfish chess engine (GPL-3.0)
- Built with modern web technologies