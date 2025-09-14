// src/game/board.js
// Pure JS board representation and helpers for Settlement Chess

export function createEmptyBoard(width = 8, height = 8) {
  const board = Array.from({length: height}, () => Array(width).fill(null));
  return board;
}

export function cloneBoard(board) {
  return board.map(row => row.slice());
}

export function coordToIndex(square) {
  // e.g. 'a1' -> {x:0,y:7} for standard chess if you want algebraic; adjust for your needs
  const file = square[0];
  const rank = parseInt(square.slice(1), 10);
  return { x: file.charCodeAt(0) - 97, y: rank - 1 };
}

// Example: simple API to put a piece
export function setPiece(board, x, y, piece) {
  const b = cloneBoard(board);
  b[y][x] = piece; // piece could be {type:'pawn',color:'w'}
  return b;
}

// Settlement Chess specific functions
export function createWorldBoard(width = 20, height = 20) {
  const worldGrid = Array.from({length: height}, () => Array(width).fill(null));
  const fogOfWar = Array.from({length: height}, () => Array(width).fill(true));
  const productionNodes = [];
  const claimedTerritory = new Set();
  
  return {
    worldGrid,
    fogOfWar,
    productionNodes,
    claimedTerritory,
    width,
    height
  };
}

export function revealTiles(worldBoard, centerX, centerY, radius = 1) {
  const { fogOfWar, width, height } = worldBoard;
  const revealed = [];
  
  for (let y = Math.max(0, centerY - radius); y <= Math.min(height - 1, centerY + radius); y++) {
    for (let x = Math.max(0, centerX - radius); x <= Math.min(width - 1, centerX + radius); x++) {
      if (fogOfWar[y][x]) {
        fogOfWar[y][x] = false;
        revealed.push({ x, y, tile: worldBoard.worldGrid[y][x] });
      }
    }
  }
  
  return revealed;
}

export function claimTerritory(worldBoard, x, y, playerId) {
  const { claimedTerritory, worldGrid } = worldBoard;
  const key = `${x},${y}`;
  
  if (!claimedTerritory.has(key) && worldGrid[y][x] === null) {
    claimedTerritory.add(key);
    worldGrid[y][x] = { type: 'claimed', player: playerId };
    return true;
  }
  
  return false;
}
