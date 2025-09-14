// src/game/worldBoard.js
// World board management for Settlement Chess

import { createWorldBoard, revealTiles, claimTerritory } from './board.js';
import { Army } from './army.js';

export class WorldBoard {
  constructor() {
    this.worldWidth = 20;
    this.worldHeight = 20;
    this.worldGrid = [];
    this.armies = new Map(); // armyId -> Army
    this.fogOfWar = []; // visibility tracking
    this.productionNodes = []; // production sites
    this.claimedTerritory = new Set(); // claimed positions
    this.initializeWorld();
  }

  initializeWorld() {
    const world = createWorldBoard(this.worldWidth, this.worldHeight);
    this.worldGrid = world.worldGrid;
    this.fogOfWar = world.fogOfWar;
    this.productionNodes = world.productionNodes;
    this.claimedTerritory = world.claimedTerritory;
    
    // Place some production nodes randomly
    this.generateProductionNodes();
  }

  generateProductionNodes() {
    const nodeTypes = ['factory', 'training', 'monastery', 'castle', 'stable'];
    const numNodes = 15; // Place 15 production nodes randomly
    
    for (let i = 0; i < numNodes; i++) {
      const x = Math.floor(Math.random() * this.worldWidth);
      const y = Math.floor(Math.random() * this.worldHeight);
      const type = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
      
      this.productionNodes.push({
        x,
        y,
        type,
        id: `node_${i}`,
        active: true
      });
      
      // Mark the tile as having a production node
      this.worldGrid[y][x] = { type: 'production', nodeType: type, nodeId: `node_${i}` };
    }
  }

  revealTiles(centerX, centerY, radius = 1) {
    return revealTiles(this, centerX, centerY, radius);
  }

  deployArmy(armyId, targetX, targetY) {
    const army = this.armies.get(armyId);
    if (!army) return false;

    const deployed = army.deployArmy(targetX, targetY, this);
    
    // Reveal tiles around deployment
    this.revealTiles(targetX, targetY, 2);
    
    return deployed;
  }

  claimTerritory(x, y, playerId) {
    return claimTerritory(this, x, y, playerId);
  }

  addArmy(army) {
    this.armies.set(army.armyId, army);
  }

  removeArmy(armyId) {
    return this.armies.delete(armyId);
  }

  getArmy(armyId) {
    return this.armies.get(armyId);
  }

  getAllArmies() {
    return Array.from(this.armies.values());
  }

  getArmiesByPlayer(playerSide) {
    return this.getAllArmies().filter(army => army.playerSide === playerSide);
  }

  checkVictoryConditions() {
    // Check if any player has claimed 64 squares
    const playerClaims = {};
    
    for (const claim of this.claimedTerritory) {
      const [x, y] = claim.split(',').map(Number);
      const tile = this.worldGrid[y][x];
      if (tile && tile.player) {
        playerClaims[tile.player] = (playerClaims[tile.player] || 0) + 1;
      }
    }

    // Check for 64 territory win
    for (const [player, count] of Object.entries(playerClaims)) {
      if (count >= 64) {
        return { winner: player, reason: 'territory', count };
      }
    }

    // Check for king elimination
    const armiesByPlayer = {};
    for (const army of this.getAllArmies()) {
      if (!armiesByPlayer[army.playerSide]) {
        armiesByPlayer[army.playerSide] = [];
      }
      armiesByPlayer[army.playerSide].push(army);
    }

    const players = Object.keys(armiesByPlayer);
    if (players.length === 1) {
      return { winner: players[0], reason: 'elimination' };
    }

    return null; // No victory condition met
  }
}
