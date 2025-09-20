// src/ui/WorldBoard.jsx
import React, { useState, useEffect, useRef, use } from 'react';
import { WorldBoard } from '../game/worldBoard.js';
import { Army } from '../game/army.js';

const TILE_SIZE = 32;
const BOARD_PADDING = 20;

export function WorldBoardComponent() {
  const [worldBoard, setWorldBoard] = useState(null);
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [gameState, setGameState] = useState('playing');
  const selectedKingTileRef = useRef(null);
  const [, forceRender] = useState(0);
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

    // Add King in top left corner (x=0, y=0)
    board.worldGrid[0][0] = { type: 'K', color: 'W', deployed: true };
    board.worldGrid[0][5] = { type: 'K', color: 'B', deployed: true };

    
    setWorldBoard(board);
    setSelectedArmy(army1);
  }, []);

  useEffect(() => {
    if (!worldBoard) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    drawWorld(ctx, worldBoard, camera);
  }, [worldBoard, camera, selectedKingTileRef.current]); // ← Add selectedKingTile here

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
        
        // Draw revealed tile - unified fill for all tiles
        const tile = board.worldGrid[y][x];
        
        // All tiles get the same base fill
        ctx.fillStyle = '#4a4a4a'; // Dark gray for all tiles
        ctx.fillRect(screenX, screenY, scaledTileSize, scaledTileSize);
        
        // Draw grid lines
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, scaledTileSize, scaledTileSize);
        
        // Draw informational borders based on tile state
        if (tile) {
          // Production tile border (green)
          if (tile.hasProduction) {
            ctx.strokeStyle = '#00b14d'; // Green color
            ctx.lineWidth = 4;
            ctx.strokeRect(screenX + 2, screenY + 2, scaledTileSize - 4, scaledTileSize - 4);
          }
          
          // Claimed territory border (blue for white player, red for black)
          if (tile.claimedBy) {
            const claimColor = tile.claimedBy === 'W' ? '#87CEEB' : '#8B0000';
            ctx.strokeStyle = claimColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(screenX + 1, screenY + 1, scaledTileSize - 2, scaledTileSize - 2);
          }
          
          // Deployed piece border (white for white pieces, dark gray for black)
          if (tile.deployed) {
            const pieceColor = tile.color === 'W' ? '#F0F0F0' : '#404040';
            ctx.strokeStyle = pieceColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX + 3, screenY + 3, scaledTileSize - 6, scaledTileSize - 6);
          }
        }
        
        // Draw gold border for selected King tile (highest priority)
        if (selectedKingTileRef.current && selectedKingTileRef.current.x === x && selectedKingTileRef.current.y === y) {
          ctx.strokeStyle = '#FFD700'; // Gold color
          ctx.lineWidth = 4;
          ctx.strokeRect(screenX + 2, screenY + 2, scaledTileSize - 4, scaledTileSize - 4);
        }

        // Draw blue borders for adjacent tiles (second highest priority)
        if (selectedKingTileRef.current && isAdjacent(selectedKingTileRef.current.x, selectedKingTileRef.current.y, x, y)) {
          ctx.strokeStyle = '#0066FF'; // Blue color
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX + 1, screenY + 1, scaledTileSize - 2, scaledTileSize - 2);
        }

        // Draw piece symbols
        if (tile && tile.type === 'K') {
          ctx.fillStyle = tile.color === 'W' ? '#FFF' : '#000';
          ctx.font = `${scaledTileSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const pieceSymbol = getPieceSymbol(tile.type);
          ctx.fillText(pieceSymbol, screenX + scaledTileSize/2, screenY + scaledTileSize/2);
        }
        
        // Draw production node symbols
        if (tile && tile.hasProduction) {
          ctx.fillStyle = '#FFD700';
          ctx.font = `${scaledTileSize * 0.6}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const nodeSymbol = getProductionSymbol(tile.nodeType);
          ctx.fillText(nodeSymbol, screenX + scaledTileSize/2, screenY + scaledTileSize/2);
        }
      }
    }
  };

  const isAdjacent = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1);
  };

  const getPieceSymbol = (type) => {
    const symbols = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
    };
    return symbols[type] || '?';
  };

  const getProductionSymbol = (nodeType) => {
    const symbols = {
      'training': '♙', 'monastery': '♗', 'castle': '♖', 'stable': '♘'
    };
    return symbols[nodeType] || '?';
  };

  const moveKing = (fromX, fromY, toX, toY) => {
    const fromTile = worldBoard.worldGrid[fromY][fromX];
    
    if (fromTile && fromTile.type === 'K') {
      // Move the King to new position
      worldBoard.worldGrid[toY][toX] = {
        ...fromTile,
        type: 'K',
        color: fromTile.color
      };
      
      // Clear the original position
      worldBoard.worldGrid[fromY][fromX] = null;
      
      // Update selected King position
      selectedKingTileRef.current = { x: toX, y: toY };
      
      // Trigger re-render
      setWorldBoard({...worldBoard});
      
      console.log(`King moved successfully to (${toX}, ${toY})`);
    }
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
    
    // if (worldX >= 0 && worldX < worldBoard.worldWidth && 
    //     worldY >= 0 && worldY < worldBoard.worldHeight) {
      
    //   // Deploy army at clicked location
    //   const deployed = worldBoard.deployArmy(selectedArmy.armyId, worldX, worldY);
    //   if (deployed.length > 0) {
    //     setWorldBoard({...worldBoard}); // Trigger re-render
    //   }
    // }
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
      case 'escape':
      // Clear King selection
      selectedKingTileRef.current = null;
      forceRender(prev => prev + 1); // Trigger re-render
      break;
    }
  };

  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const scaledTileSize = TILE_SIZE * camera.zoom;
      const worldX = Math.floor((x - BOARD_PADDING + camera.x * scaledTileSize) / scaledTileSize);
      const worldY = Math.floor((y - BOARD_PADDING + camera.y * scaledTileSize) / scaledTileSize);
      
      if (worldX >= 0 && worldX < worldBoard.worldWidth && 
        worldY >= 0 && worldY < worldBoard.worldHeight) {
          
        const tile = worldBoard.worldGrid[worldY][worldX];
        console.log(`Board clicked at coordinates (${worldX}, ${worldY}):`, tile);
        
        // Check if clicked on a King piece
        if (tile && tile.type === 'K') {
          selectedKingTileRef.current = { x: worldX, y: worldY };
          forceRender(prev => prev + 1); // Trigger re-render
          console.log(`King selected at (${worldX}, ${worldY})`);
        } else {
          console.log(`Clicked on non-King tile. selectedKingTile:`, selectedKingTileRef.current);
          
          if (selectedKingTileRef.current) {
            // Debug: Check if we're trying to move
            const isAdj = isAdjacent(selectedKingTileRef.current.x, selectedKingTileRef.current.y, worldX, worldY);
            console.log(`King at (${selectedKingTileRef.current.x}, ${selectedKingTileRef.current.y}), clicked (${worldX}, ${worldY}), adjacent: ${isAdj}`);
            
            if (isAdj) {
              // Check if destination tile has production - prevent king movement
              if (tile && tile.hasProduction) {
                console.log(`Cannot move King to production tile at (${worldX}, ${worldY})`);
                // Clear selection since move is not allowed
                selectedKingTileRef.current = null;
                forceRender(prev => prev + 1);
                return;
              }
              
              // Move King to adjacent tile
              console.log(`Moving King from (${selectedKingTileRef.current.x}, ${selectedKingTileRef.current.y}) to (${worldX}, ${worldY})`);
              moveKing(selectedKingTileRef.current.x, selectedKingTileRef.current.y, worldX, worldY);
            } else {
              // Clear selection if clicking on non-adjacent tile
              console.log(`Clearing King selection - not adjacent`);
              selectedKingTileRef.current = null;
              forceRender(prev => prev + 1); // Trigger re-render
            }
          } else {
            console.log(`No King selected, clearing selection`);
            selectedKingTileRef.current = null;
          }
        }

        } else {
          console.log(`Click outside board bounds: screen(${x}, ${y}) -> world(${worldX}, ${worldY})`);
        }
      };
      
      canvas.addEventListener('click', handleCanvasClick);
      
      return () => {
        canvas.removeEventListener('click', handleCanvasClick);
      };
    }, [worldBoard, camera]);
    
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
        <p>Controls: WASD to move camera, 1/2 to select army, Click King to select, Escape to deselect</p>
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
