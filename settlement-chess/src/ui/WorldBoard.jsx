// src/ui/WorldBoard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { WorldBoard } from '../game/worldBoard.js';
import { Army } from '../game/army.js';

const TILE_SIZE = 32;
const BOARD_PADDING = 20;

export function WorldBoardComponent() {
  const [worldBoard, setWorldBoard] = useState(null);
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [gameState, setGameState] = useState('playing');
  const canvasRef = useRef(null);

  useEffect(() => {
    // Initialize the game
    const board = new WorldBoard();
    
    // Create initial armies
    const army1 = new Army('army1', 'W');
    army1.addPiece({ type: 'K', color: 'W' });
    army1.addPiece({ type: 'Q', color: 'W' });
    army1.addPiece({ type: 'R', color: 'W' });
    army1.addPiece({ type: 'B', color: 'W' });
    army1.addPiece({ type: 'N', color: 'W' });
    army1.addPiece({ type: 'P', color: 'W' });
    
    const army2 = new Army('army2', 'B');
    army2.addPiece({ type: 'K', color: 'B' });
    army2.addPiece({ type: 'Q', color: 'B' });
    army2.addPiece({ type: 'R', color: 'B' });
    army2.addPiece({ type: 'B', color: 'B' });
    army2.addPiece({ type: 'N', color: 'B' });
    army2.addPiece({ type: 'P', color: 'B' });
    
    board.addArmy(army1);
    board.addArmy(army2);
    
    setWorldBoard(board);
    setSelectedArmy(army1);
  }, []);

  useEffect(() => {
    if (!worldBoard) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawWorld(ctx, worldBoard, camera);
  }, [worldBoard, camera]);

  const drawWorld = (ctx, board, cam) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scaledTileSize = TILE_SIZE * cam.zoom;
    const startX = BOARD_PADDING - cam.x * scaledTileSize;
    const startY = BOARD_PADDING - cam.y * scaledTileSize;
    
    // Draw grid
    for (let y = 0; y < board.worldHeight; y++) {
      for (let x = 0; x < board.worldWidth; x++) {
        const screenX = startX + x * scaledTileSize;
        const screenY = startY + y * scaledTileSize;
        
        // Skip if tile is outside visible area
        if (screenX + scaledTileSize < 0 || screenX > canvas.width ||
            screenY + scaledTileSize < 0 || screenY > canvas.height) {
          continue;
        }
        
        // Draw fog of war
        if (board.fogOfWar[y][x]) {
          ctx.fillStyle = '#2a2a2a';
          ctx.fillRect(screenX, screenY, scaledTileSize, scaledTileSize);
          continue;
        }
        
        // Draw revealed tile
        const tile = board.worldGrid[y][x];
        if (tile) {
          if (tile.type === 'production') {
            ctx.fillStyle = '#8B4513'; // Brown for production nodes
          } else if (tile.type === 'claimed') {
            ctx.fillStyle = tile.player === 'W' ? '#87CEEB' : '#8B0000'; // Light blue for white, dark red for black
          } else if (tile.deployed) {
            ctx.fillStyle = tile.color === 'W' ? '#F0F0F0' : '#404040';
          } else {
            ctx.fillStyle = '#4a4a4a';
          }
        } else {
          ctx.fillStyle = '#4a4a4a'; // Dark gray for empty
        }
        
        ctx.fillRect(screenX, screenY, scaledTileSize, scaledTileSize);
        
        // Draw grid lines
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, scaledTileSize, scaledTileSize);
        
        // Draw piece symbols
        if (tile && tile.type !== 'production' && tile.type !== 'claimed') {
          ctx.fillStyle = tile.color === 'W' ? '#FFF' : '#000';
          ctx.font = `${scaledTileSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const pieceSymbol = getPieceSymbol(tile.type);
          ctx.fillText(pieceSymbol, screenX + scaledTileSize/2, screenY + scaledTileSize/2);
        }
        
        // Draw production node symbols
        if (tile && tile.type === 'production') {
          ctx.fillStyle = '#FFD700';
          ctx.font = `${scaledTileSize * 0.4}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const nodeSymbol = getProductionSymbol(tile.nodeType);
          ctx.fillText(nodeSymbol, screenX + scaledTileSize/2, screenY + scaledTileSize/2);
        }
      }
    }
  };

  const getPieceSymbol = (type) => {
    const symbols = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
    };
    return symbols[type] || '?';
  };

  const getProductionSymbol = (nodeType) => {
    const symbols = {
      'factory': '⚒', 'training': '⚔', 'monastery': '⛪', 'castle': '🏰', 'stable': '🐎'
    };
    return symbols[nodeType] || '?';
  };

  const handleCanvasClick = (event) => {
    if (!worldBoard || !selectedArmy) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const scaledTileSize = TILE_SIZE * camera.zoom;
    const worldX = Math.floor((x - BOARD_PADDING + camera.x * scaledTileSize) / scaledTileSize);
    const worldY = Math.floor((y - BOARD_PADDING + camera.y * scaledTileSize) / scaledTileSize);
    
    if (worldX >= 0 && worldX < worldBoard.worldWidth && 
        worldY >= 0 && worldY < worldBoard.worldHeight) {
      
      // Deploy army at clicked location
      const deployed = worldBoard.deployArmy(selectedArmy.armyId, worldX, worldY);
      if (deployed.length > 0) {
        setWorldBoard({...worldBoard}); // Trigger re-render
      }
    }
  };

  const handleKeyDown = (event) => {
    const moveSpeed = 1;
    const zoomSpeed = 0.1;
    
    switch(event.key.toLowerCase()) {
      case 'w':
        setCamera(prev => ({ ...prev, y: Math.max(0, prev.y - moveSpeed) }));
        break;
      case 's':
        setCamera(prev => ({ ...prev, y: Math.min(worldBoard.worldHeight - 10, prev.y + moveSpeed) }));
        break;
      case 'a':
        setCamera(prev => ({ ...prev, x: Math.max(0, prev.x - moveSpeed) }));
        break;
      case 'd':
        setCamera(prev => ({ ...prev, x: Math.min(worldBoard.worldWidth - 10, prev.x + moveSpeed) }));
        break;
      case '1':
        setSelectedArmy(worldBoard.getArmy('army1'));
        break;
      case '2':
        setSelectedArmy(worldBoard.getArmy('army2'));
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [worldBoard]);

  if (!worldBoard) {
    return <div>Loading...</div>;
  }

  return (
    <div className="world-board-container">
      <div className="game-info">
        <h2>Settlement Chess</h2>
        <p>Selected Army: {selectedArmy?.armyId} ({selectedArmy?.playerSide})</p>
        <p>Army Strength: {selectedArmy?.armyStrength}</p>
        <p>Controls: WASD to move camera, 1/2 to select army, Click to deploy</p>
      </div>
      
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        style={{ border: '1px solid #ccc', cursor: 'crosshair' }}
      />
      
      <div className="army-info">
        <h3>Army Bonuses</h3>
        {selectedArmy && selectedArmy.getArmyBonuses().map((bonus, index) => (
          <div key={index}>
            {bonus.type}: {bonus.value}
          </div>
        ))}
      </div>
    </div>
  );
}
