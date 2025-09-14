// tests/board.test.js
import { test, expect } from 'vitest';
import { createEmptyBoard, setPiece, createWorldBoard, revealTiles, claimTerritory } from '../src/game/board.js';
import { Army } from '../src/game/army.js';

test('createEmptyBoard creates correct dimensions', () => {
  const board = createEmptyBoard(8, 8);
  expect(board).toHaveLength(8);
  expect(board[0]).toHaveLength(8);
  expect(board[0][0]).toBeNull();
});

test('setPiece places a piece', () => {
  const b = createEmptyBoard(8, 8);
  const nb = setPiece(b, 0, 0, {type:'king', color:'w'});
  expect(nb[0][0]).toEqual({type:'king', color:'w'});
  expect(b[0][0]).toBeNull(); // original is immutable
});

test('createWorldBoard initializes correctly', () => {
  const world = createWorldBoard(20, 20);
  expect(world.worldGrid).toHaveLength(20);
  expect(world.worldGrid[0]).toHaveLength(20);
  expect(world.fogOfWar).toHaveLength(20);
  expect(world.fogOfWar[0]).toHaveLength(20);
  expect(world.productionNodes).toEqual([]);
  expect(world.claimedTerritory).toBeInstanceOf(Set);
});

test('revealTiles reveals correct area', () => {
  const world = createWorldBoard(10, 10);
  const revealed = revealTiles(world, 5, 5, 1);
  
  // Should reveal 3x3 area around center
  expect(revealed).toHaveLength(9);
  
  // Check that fog of war is cleared
  expect(world.fogOfWar[5][5]).toBe(false);
  expect(world.fogOfWar[4][4]).toBe(false);
  expect(world.fogOfWar[6][6]).toBe(false);
});

test('claimTerritory works correctly', () => {
  const world = createWorldBoard(10, 10);
  const success = claimTerritory(world, 5, 5, 'player1');
  
  expect(success).toBe(true);
  expect(world.claimedTerritory.has('5,5')).toBe(true);
  expect(world.worldGrid[5][5]).toEqual({ type: 'claimed', player: 'player1' });
});

test('claimTerritory fails on already claimed territory', () => {
  const world = createWorldBoard(10, 10);
  claimTerritory(world, 5, 5, 'player1');
  const success = claimTerritory(world, 5, 5, 'player2');
  
  expect(success).toBe(false);
  expect(world.worldGrid[5][5].player).toBe('player1');
});

test('Army creation and piece management', () => {
  const army = new Army('army1', 'W');
  
  expect(army.armyId).toBe('army1');
  expect(army.playerSide).toBe('W');
  expect(army.pieces).toEqual([]);
  expect(army.consolidated).toBe(true);
  expect(army.armyStrength).toBe(0);
});

test('Army addPiece updates strength', () => {
  const army = new Army('army1', 'W');
  
  army.addPiece({ type: 'K', color: 'W' });
  army.addPiece({ type: 'Q', color: 'W' });
  
  expect(army.pieces).toHaveLength(2);
  expect(army.armyStrength).toBe(2);
});

test('Army getArmyBonuses works correctly', () => {
  const army = new Army('army1', 'W');
  
  // Add knights for extra move bonus
  army.addPiece({ type: 'N', color: 'W' });
  army.addPiece({ type: 'N', color: 'W' });
  
  // Add bishops for convert peasants bonus
  army.addPiece({ type: 'B', color: 'W' });
  
  // Add rooks for fortifications bonus
  army.addPiece({ type: 'R', color: 'W' });
  army.addPiece({ type: 'R', color: 'W' });
  
  const bonuses = army.getArmyBonuses();
  
  expect(bonuses).toHaveLength(3);
  expect(bonuses.find(b => b.type === 'extraMove').value).toBe(2);
  expect(bonuses.find(b => b.type === 'convertPeasants').value).toBe(1);
  expect(bonuses.find(b => b.type === 'fortifications').value).toBe(2);
});

test('Army getMostCommonPiece works correctly', () => {
  const army = new Army('army1', 'W');
  
  army.addPiece({ type: 'N', color: 'W' });
  army.addPiece({ type: 'N', color: 'W' });
  army.addPiece({ type: 'N', color: 'W' });
  army.addPiece({ type: 'B', color: 'W' });
  army.addPiece({ type: 'B', color: 'W' });
  
  expect(army.getMostCommonPiece()).toBe('N');
});
