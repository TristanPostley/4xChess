// src/game/settlementChessGame.js
// Main game class that orchestrates all systems

import { WorldBoard } from './worldBoard.js';
import { Army } from './army.js';
import { ProductionSystem } from './productionSystem.js';
import { ChessEngine } from './stockfish-wrapper.js';

export class SettlementChessGame {
  constructor() {
    this.worldBoard = new WorldBoard();
    this.productionSystem = new ProductionSystem(this.worldBoard);
    this.chessEngine = new ChessEngine();
    this.gameState = 'playing';
    this.currentPlayer = 'W';
    this.turnCount = 0;
    this.eventListeners = new Map();
  }

  async initialize() {
    this.worldBoard.initializeWorld();
    await this.setupInitialArmies();
    await this.chessEngine.initialize();
    this.setupEventListeners();
  }

  async setupInitialArmies() {
    // Create initial armies for both players
    const army1 = new Army('army1', 'W');
    const army2 = new Army('army2', 'B');
    
    // Add initial pieces to each army
    const initialPieces = [
      { type: 'K', color: 'W' }, // King
      { type: 'Q', color: 'W' }, // Queen
      { type: 'R', color: 'W' }, // Rook
      { type: 'B', color: 'W' }, // Bishop
      { type: 'N', color: 'W' }, // Knight
      { type: 'P', color: 'W' }, // Pawn
      { type: 'P', color: 'W' }, // Pawn
      { type: 'P', color: 'W' }  // Pawn
    ];

    const initialPiecesBlack = [
      { type: 'K', color: 'B' }, // King
      { type: 'Q', color: 'B' }, // Queen
      { type: 'R', color: 'B' }, // Rook
      { type: 'B', color: 'B' }, // Bishop
      { type: 'N', color: 'B' }, // Knight
      { type: 'P', color: 'B' }, // Pawn
      { type: 'P', color: 'B' }, // Pawn
      { type: 'P', color: 'B' }  // Pawn
    ];

    initialPieces.forEach(piece => army1.addPiece(piece));
    initialPiecesBlack.forEach(piece => army2.addPiece(piece));
    
    this.worldBoard.addArmy(army1);
    this.worldBoard.addArmy(army2);
  }

  setupEventListeners() {
    // Set up keyboard and mouse event listeners
    this.eventListeners.set('keydown', this.handleKeyDown.bind(this));
    this.eventListeners.set('click', this.handleClick.bind(this));
  }

  handleKeyDown(event) {
    // Handle keyboard input for camera movement and army selection
    const moveSpeed = 1;
    
    switch(event.key.toLowerCase()) {
      case 'w':
        this.moveCamera(0, -moveSpeed);
        break;
      case 's':
        this.moveCamera(0, moveSpeed);
        break;
      case 'a':
        this.moveCamera(-moveSpeed, 0);
        break;
      case 'd':
        this.moveCamera(moveSpeed, 0);
        break;
      case '1':
        this.selectArmy('army1');
        break;
      case '2':
        this.selectArmy('army2');
        break;
      case ' ':
        event.preventDefault();
        this.endTurn();
        break;
    }
  }

  handleClick(event) {
    // Handle mouse clicks for army deployment and territory claiming
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    if (worldPos) {
      this.handleWorldClick(worldPos.x, worldPos.y);
    }
  }

  moveCamera(deltaX, deltaY) {
    // Move camera position
    // This would be handled by the camera system
    this.emit('cameraMove', { deltaX, deltaY });
  }

  selectArmy(armyId) {
    const army = this.worldBoard.getArmy(armyId);
    if (army && army.playerSide === this.currentPlayer) {
      this.emit('armySelected', army);
    }
  }

  handleWorldClick(x, y) {
    // Handle clicks on the world board
    if (x < 0 || x >= this.worldBoard.worldWidth || 
        y < 0 || y >= this.worldBoard.worldHeight) {
      return;
    }

    const tile = this.worldBoard.worldGrid[y][x];
    
    if (tile && tile.type === 'production') {
      this.handleProductionNodeClick(x, y);
    } else if (tile === null) {
      this.handleEmptyTileClick(x, y);
    } else {
      this.handleOccupiedTileClick(x, y);
    }
  }

  handleProductionNodeClick(x, y) {
    const node = this.worldBoard.productionNodes.find(n => n.x === x && n.y === y);
    if (!node) return;

    const currentArmy = this.getCurrentPlayerArmy();
    if (!currentArmy) return;

    const availableProductions = this.productionSystem.getAvailableProductions(x, y, currentArmy.armyId);
    
    if (availableProductions.length > 0) {
      // For now, just produce the first available item
      const production = availableProductions[0];
      const success = this.productionSystem.produceAtNode(x, y, currentArmy.armyId, production.outputType);
      
      if (success) {
        this.emit('productionCompleted', { x, y, production });
      }
    }
  }

  handleEmptyTileClick(x, y) {
    const currentArmy = this.getCurrentPlayerArmy();
    if (!currentArmy) return;

    // Try to claim territory with a pawn
    const pawns = currentArmy.pieces.filter(piece => piece.type === 'P');
    if (pawns.length > 0) {
      const success = this.worldBoard.claimTerritory(x, y, this.currentPlayer);
      if (success) {
        // Remove a pawn for claiming territory
        currentArmy.removePiece(currentArmy.pieces.findIndex(piece => piece.type === 'P'));
        this.emit('territoryClaimed', { x, y, player: this.currentPlayer });
      }
    }
  }

  handleOccupiedTileClick(x, y) {
    // Handle clicks on occupied tiles (deploy army, etc.)
    const currentArmy = this.getCurrentPlayerArmy();
    if (!currentArmy) return;

    // Deploy army at clicked location
    const deployed = this.worldBoard.deployArmy(currentArmy.armyId, x, y);
    if (deployed.length > 0) {
      this.emit('armyDeployed', { army: currentArmy, x, y, deployed });
    }
  }

  getCurrentPlayerArmy() {
    const armies = this.worldBoard.getArmiesByPlayer(this.currentPlayer);
    return armies.length > 0 ? armies[0] : null;
  }

  screenToWorld(screenX, screenY) {
    // Convert screen coordinates to world coordinates
    // This would be implemented based on camera position and zoom
    return { x: Math.floor(screenX / 32), y: Math.floor(screenY / 32) };
  }

  endTurn() {
    this.turnCount++;
    this.currentPlayer = this.currentPlayer === 'W' ? 'B' : 'W';
    this.emit('turnEnded', { turnCount: this.turnCount, currentPlayer: this.currentPlayer });
    
    // Check victory conditions
    const victory = this.worldBoard.checkVictoryConditions();
    if (victory) {
      this.gameState = 'finished';
      this.emit('gameEnded', victory);
    }
  }

  update(deltaTime) {
    // Update game systems
    if (this.gameState === 'playing') {
      // Update any ongoing animations, AI, etc.
    }
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }

  // Cleanup
  destroy() {
    this.chessEngine.terminate();
    this.eventListeners.clear();
  }
}
