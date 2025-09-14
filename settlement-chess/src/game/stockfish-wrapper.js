// src/game/stockfish-wrapper.js
// Stockfish worker wrapper for chess engine integration

export function createWorkerEngine(workerUrl = '/stockfish.js') {
  const worker = new Worker(workerUrl);

  const listeners = new Set();
  worker.onmessage = (ev) => {
    const data = ev.data?.data ?? ev.data; // worker wrappers vary
    listeners.forEach(fn => fn(data));
  };

  return {
    post: (cmd) => worker.postMessage(cmd),
    onMessage: (fn) => listeners.add(fn),
    removeMessage: (fn) => listeners.delete(fn),
    terminate: () => worker.terminate(),
  };
}

export class ChessEngine {
  constructor() {
    this.engine = null;
    this.isReady = false;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Try to use stockfish.wasm if available
      const { default: Stockfish } = await import('stockfish.wasm');
      this.engine = await Stockfish();
      this.isInitialized = true;
      this.isReady = true;
    } catch (error) {
      console.warn('Stockfish.wasm not available, falling back to worker:', error);
      // Fallback to worker-based engine
      this.engine = createWorkerEngine();
      this.setupWorkerListeners();
      this.isInitialized = true;
    }
  }

  setupWorkerListeners() {
    if (!this.engine || !this.engine.onMessage) return;

    this.engine.onMessage((line) => {
      if (line === 'uciok') {
        this.isReady = true;
      }
    });

    // Initialize UCI
    this.engine.post('uci');
    this.engine.post('isready');
  }

  async getBestMove(fen, depth = 15) {
    if (!this.isReady) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      let bestMove = null;
      let bestScore = null;

      const messageHandler = (line) => {
        if (line.startsWith('bestmove')) {
          const move = line.split(' ')[1];
          this.engine.removeMessage(messageHandler);
          resolve({ move, score: bestScore });
        } else if (line.startsWith('info') && line.includes('score')) {
          // Extract score from info line
          const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
          if (scoreMatch) {
            bestScore = {
              type: scoreMatch[1],
              value: parseInt(scoreMatch[2])
            };
          }
        }
      };

      this.engine.onMessage(messageHandler);
      this.engine.post(`position fen ${fen}`);
      this.engine.post(`go depth ${depth}`);
    });
  }

  async evaluatePosition(fen) {
    if (!this.isReady) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      let evaluation = null;

      const messageHandler = (line) => {
        if (line.startsWith('info') && line.includes('score')) {
          const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
          if (scoreMatch) {
            evaluation = {
              type: scoreMatch[1],
              value: parseInt(scoreMatch[2])
            };
          }
        } else if (line.startsWith('bestmove')) {
          this.engine.removeMessage(messageHandler);
          resolve(evaluation);
        }
      };

      this.engine.onMessage(messageHandler);
      this.engine.post(`position fen ${fen}`);
      this.engine.post('go depth 1');
    });
  }

  terminate() {
    if (this.engine && this.engine.terminate) {
      this.engine.terminate();
    }
    this.isReady = false;
    this.isInitialized = false;
  }
}
