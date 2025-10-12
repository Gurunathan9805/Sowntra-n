import WebSocket, { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { prisma } from '../config/database';
import http from 'http';

interface ClientConnection {
  ws: WebSocket;
  boardId: string;
  userId?: string;
  userName?: string;
  color?: string;
  cursor?: { x: number; y: number };
}

// Store active connections per board
const boardConnections = new Map<string, Set<ClientConnection>>();

// Store Yjs documents per board
const boardDocs = new Map<string, Y.Doc>();

/**
 * Initialize WebSocket server for real-time collaboration
 */
export function initWebSocketServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server,
    path: '/collaboration'
  });

  console.log('✅ WebSocket server initialized on path: /collaboration');

  wss.on('connection', (ws: WebSocket, _req) => {
    console.log('🔌 New WebSocket connection');

    let clientConnection: ClientConnection | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join':
            await handleJoin(ws, message, clientConnection);
            break;

          case 'sync':
            handleSync(ws, message, clientConnection);
            break;

          case 'update':
            handleUpdate(message, clientConnection);
            break;

          case 'awareness':
            handleAwareness(message, clientConnection);
            break;

          case 'cursor':
            handleCursor(message, clientConnection);
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(clientConnection);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      handleDisconnect(clientConnection);
    });

    /**
     * Handle client joining a board
     */
    async function handleJoin(
      ws: WebSocket,
      message: any,
      _currentConnection: ClientConnection | null
    ): Promise<void> {
      const { boardId, userId, userName } = message;

      if (!boardId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Board ID required' }));
        return;
      }

      // Load or create Yjs document for the board
      let yDoc = boardDocs.get(boardId);
      
      if (!yDoc) {
        yDoc = new Y.Doc();
        
        // Try to load persisted state from database
        try {
          const board = await prisma.board.findUnique({
            where: { id: boardId }
          });

          if (board && board.yDocState) {
            Y.applyUpdate(yDoc, new Uint8Array(board.yDocState));
          }
        } catch (error) {
          console.error('Error loading board state:', error);
        }

        boardDocs.set(boardId, yDoc);

        // Auto-save document changes to database
        yDoc.on('update', async (update: Uint8Array) => {
          try {
            await prisma.board.update({
              where: { id: boardId },
              data: { 
                yDocState: Buffer.from(update),
                lastModified: new Date()
              }
            });
          } catch (error) {
            console.error('Error saving board state:', error);
          }
        });
      }

      // Create client connection
      clientConnection = {
        ws,
        boardId,
        userId,
        userName: userName || 'Anonymous',
        color: getRandomColor(),
      };

      // Add to board connections
      if (!boardConnections.has(boardId)) {
        boardConnections.set(boardId, new Set());
      }
      boardConnections.get(boardId)!.add(clientConnection);

      // Send current document state to client
      const state = Y.encodeStateAsUpdate(yDoc);
      ws.send(JSON.stringify({
        type: 'sync',
        state: Array.from(state)
      }));

      // Notify other clients about new user
      broadcastToBoard(boardId, {
        type: 'user-joined',
        userId,
        userName: clientConnection.userName,
        color: clientConnection.color
      }, clientConnection);

      // Send list of active users to the new client
      const activeUsers = Array.from(boardConnections.get(boardId) || [])
        .filter(conn => conn !== clientConnection)
        .map(conn => ({
          userId: conn.userId,
          userName: conn.userName,
          color: conn.color,
          cursor: conn.cursor
        }));

      ws.send(JSON.stringify({
        type: 'active-users',
        users: activeUsers
      }));

      console.log(`✅ User ${userName} joined board ${boardId}`);
    }

    /**
     * Handle document sync
     */
    function handleSync(
      _ws: WebSocket,
      message: any,
      connection: ClientConnection | null
    ): void {
      if (!connection) return;

      const yDoc = boardDocs.get(connection.boardId);
      if (!yDoc) return;

      if (message.state) {
        Y.applyUpdate(yDoc, new Uint8Array(message.state));
      }
    }

    /**
     * Handle document updates
     */
    function handleUpdate(message: any, connection: ClientConnection | null): void {
      if (!connection) return;

      const yDoc = boardDocs.get(connection.boardId);
      if (!yDoc) return;

      if (message.update) {
        const update = new Uint8Array(message.update);
        Y.applyUpdate(yDoc, update);

        // Broadcast update to all other clients on the same board
        broadcastToBoard(connection.boardId, {
          type: 'update',
          update: Array.from(update)
        }, connection);
      }
    }

    /**
     * Handle awareness updates (user presence)
     */
    function handleAwareness(message: any, connection: ClientConnection | null): void {
      if (!connection) return;

      // Broadcast awareness to other clients
      broadcastToBoard(connection.boardId, {
        type: 'awareness',
        userId: connection.userId,
        userName: connection.userName,
        color: connection.color,
        state: message.state
      }, connection);
    }

    /**
     * Handle cursor position updates
     */
    function handleCursor(message: any, connection: ClientConnection | null): void {
      if (!connection) return;

      connection.cursor = message.cursor;

      // Broadcast cursor position to other clients
      broadcastToBoard(connection.boardId, {
        type: 'cursor',
        userId: connection.userId,
        userName: connection.userName,
        color: connection.color,
        cursor: message.cursor
      }, connection);
    }

    /**
     * Handle client disconnect
     */
    function handleDisconnect(connection: ClientConnection | null): void {
      if (!connection) return;

      const { boardId, userId, userName } = connection;

      // Remove from board connections
      const connections = boardConnections.get(boardId);
      if (connections) {
        connections.delete(connection);

        if (connections.size === 0) {
          boardConnections.delete(boardId);
          
          // Optionally clean up the Yjs document if no one is connected
          // boardDocs.delete(boardId);
        }
      }

      // Notify other clients
      broadcastToBoard(boardId, {
        type: 'user-left',
        userId,
        userName
      });

      console.log(`👋 User ${userName} left board ${boardId}`);
    }
  });

  return wss;
}

/**
 * Broadcast message to all clients on a board except sender
 */
function broadcastToBoard(
  boardId: string,
  message: any,
  sender?: ClientConnection | null
): void {
  const connections = boardConnections.get(boardId);
  
  if (!connections) return;

  const messageStr = JSON.stringify(message);

  connections.forEach((connection) => {
    if (connection !== sender && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(messageStr);
    }
  });
}

/**
 * Generate random color for user cursor/presence
 */
function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

