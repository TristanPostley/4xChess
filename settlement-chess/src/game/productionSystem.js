// src/game/productionSystem.js
// Production system for Settlement Chess

export class ProductionSystem {
  constructor(worldBoard) {
    this.worldBoard = worldBoard;
    this.productionCosts = {
      'training': { 'P': 2 },   // 2 pawns → 1 piece
      'monastery': { 'B': 1 },  // 1 piece → 1 bishop
      'castle': { 'R': 1 },     // 1 piece → 1 rook
      'stable': { 'N': 1 }      // 1 piece → 1 knight
    };
  }

  getProductionCost(nodeType, outputType) {
    const costs = this.productionCosts[nodeType];
    return costs ? costs[outputType] : null;
  }

  canProduceAtNode(nodeX, nodeY, armyId, outputType) {
    const node = this.worldBoard.productionNodes.find(n => n.x === nodeX && n.y === nodeY);
    if (!node || !node.active) return false;

    const cost = this.getProductionCost(node.type, outputType);
    if (!cost) return false;

    const army = this.worldBoard.getArmy(armyId);
    if (!army) return false;

    // Check if army has enough pieces of the required type
    const requiredType = Object.keys(cost)[0];
    const requiredCount = cost[requiredType];
    
    const availablePieces = army.pieces.filter(piece => piece.type === requiredType);
    return availablePieces.length >= requiredCount;
  }

  produceAtNode(nodeX, nodeY, armyId, outputType) {
    if (!this.canProduceAtNode(nodeX, nodeY, armyId, outputType)) {
      return false;
    }

    const node = this.worldBoard.productionNodes.find(n => n.x === nodeX && n.y === nodeY);
    const cost = this.getProductionCost(node.type, outputType);
    const army = this.worldBoard.getArmy(armyId);

    // Remove required pieces
    const requiredType = Object.keys(cost)[0];
    const requiredCount = cost[requiredType];
    
    let removedCount = 0;
    for (let i = army.pieces.length - 1; i >= 0 && removedCount < requiredCount; i--) {
      if (army.pieces[i].type === requiredType) {
        army.pieces.splice(i, 1);
        removedCount++;
      }
    }

    // Add new piece
    const newPiece = {
      type: outputType,
      color: army.playerSide,
      armyId: armyId
    };
    
    army.addPiece(newPiece);
    army.updateArmyStrength();

    return true;
  }

  getAvailableProductions(nodeX, nodeY, armyId) {
    const node = this.worldBoard.productionNodes.find(n => n.x === nodeX && n.y === nodeY);
    if (!node || !node.active) return [];

    const available = [];
    const costs = this.productionCosts[node.type];
    
    for (const [outputType, cost] of Object.entries(costs)) {
      if (this.canProduceAtNode(nodeX, nodeY, armyId, outputType)) {
        available.push({
          outputType,
          cost,
          nodeType: node.type
        });
      }
    }

    return available;
  }

  // Special production: convert peasants to pawns (bishop ability)
  convertPeasantsToPawns(armyId, peasantCount) {
    const army = this.worldBoard.getArmy(armyId);
    if (!army) return false;

    const bishops = army.pieces.filter(piece => piece.type === 'B');
    if (bishops.length === 0) return false;

    // Add pawns based on bishop count
    const pawnsToAdd = Math.min(peasantCount, bishops.length);
    
    for (let i = 0; i < pawnsToAdd; i++) {
      army.addPiece({
        type: 'P',
        color: army.playerSide,
        armyId: armyId
      });
    }

    return pawnsToAdd;
  }
}
