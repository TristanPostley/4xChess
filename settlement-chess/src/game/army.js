// src/game/army.js
// Army management for Settlement Chess

export class Army {
  constructor(armyId, playerSide) {
    this.armyId = armyId;
    this.playerSide = playerSide; // 'W' or 'B'
    this.pieces = [];
    this.consolidated = true;
    this.worldPosition = { x: 0, y: 0 };
    this.deploymentTiles = [];
    this.armyStrength = 0;
  }

  addPiece(piece) {
    this.pieces.push(piece);
    this.updateArmyStrength();
  }

  removePiece(pieceIndex) {
    if (pieceIndex >= 0 && pieceIndex < this.pieces.length) {
      this.pieces.splice(pieceIndex, 1);
      this.updateArmyStrength();
      return true;
    }
    return false;
  }

  updateArmyStrength() {
    this.armyStrength = this.pieces.length;
  }

  deployArmy(targetX, targetY, worldBoard) {
    // Deploy pieces in spiral pattern around target
    const { width, height } = worldBoard;
    const deployed = [];
    
    if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
      return deployed;
    }

    // Simple deployment: place pieces in a 3x3 grid around target
    const positions = [
      { x: targetX - 1, y: targetY - 1 },
      { x: targetX, y: targetY - 1 },
      { x: targetX + 1, y: targetY - 1 },
      { x: targetX - 1, y: targetY },
      { x: targetX, y: targetY },
      { x: targetX + 1, y: targetY },
      { x: targetX - 1, y: targetY + 1 },
      { x: targetX, y: targetY + 1 },
      { x: targetX + 1, y: targetY + 1 }
    ];

    for (let i = 0; i < Math.min(this.pieces.length, positions.length); i++) {
      const pos = positions[i];
      if (pos.x >= 0 && pos.x < width && pos.y >= 0 && pos.y < height) {
        worldBoard.worldGrid[pos.y][pos.x] = {
          ...this.pieces[i],
          armyId: this.armyId,
          deployed: true
        };
        deployed.push({ piece: this.pieces[i], x: pos.x, y: pos.y });
      }
    }

    this.worldPosition = { x: targetX, y: targetY };
    this.consolidated = false;
    return deployed;
  }

  getArmyBonuses() {
    // Return bonuses based on piece composition
    const pieceCounts = this.pieces.reduce((counts, piece) => {
      counts[piece.type] = (counts[piece.type] || 0) + 1;
      return counts;
    }, {});

    const bonuses = [];
    
    // Knights → Extra movement
    if (pieceCounts['N'] > 0) {
      bonuses.push({ type: 'extraMove', value: pieceCounts['N'] });
    }
    
    // Bishops → Convert peasants to pawns
    if (pieceCounts['B'] > 0) {
      bonuses.push({ type: 'convertPeasants', value: pieceCounts['B'] });
    }
    
    // Rooks → Build fortifications
    if (pieceCounts['R'] > 0) {
      bonuses.push({ type: 'fortifications', value: pieceCounts['R'] });
    }

    return bonuses;
  }

  getMostCommonPiece() {
    const pieceCounts = this.pieces.reduce((counts, piece) => {
      counts[piece.type] = (counts[piece.type] || 0) + 1;
      return counts;
    }, {});

    let mostCommon = null;
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(pieceCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = type;
      }
    }

    return mostCommon;
  }
}
