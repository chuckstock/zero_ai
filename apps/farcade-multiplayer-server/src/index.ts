/**
 * Farcade Multiplayer Server
 * Cloudflare Workers entry point with WebSocket routing to Durable Objects
 */

import { GameRoom } from './GameRoom';

export { GameRoom };

export interface Env {
  GAME_ROOMS: DurableObjectNamespace;
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
};

// Generate random room code (6 alphanumeric characters)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Error response helper
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (path === '/health' || path === '/') {
        return jsonResponse({
          status: 'ok',
          service: 'farcade-multiplayer',
          timestamp: new Date().toISOString(),
        });
      }

      // Create new room endpoint
      if (path === '/create-room') {
        const roomCode = generateRoomCode();
        return jsonResponse({
          roomId: roomCode,
          wsUrl: `wss://${url.host}/room/${roomCode}`,
        });
      }

      // Room WebSocket endpoint: /room/:roomId
      const roomMatch = path.match(/^\/room\/([A-Za-z0-9]+)$/);
      if (roomMatch) {
        const roomId = roomMatch[1].toUpperCase();

        // Validate room ID format
        if (roomId.length < 4 || roomId.length > 20) {
          return errorResponse('Invalid room ID format', 400);
        }

        // Check for WebSocket upgrade
        const upgradeHeader = request.headers.get('Upgrade');
        if (upgradeHeader?.toLowerCase() !== 'websocket') {
          // Return room info for non-WebSocket requests
          return jsonResponse({
            roomId,
            wsUrl: `wss://${url.host}/room/${roomId}`,
            message: 'Connect via WebSocket to join this room',
          });
        }

        // Get or create the Durable Object for this room
        const durableObjectId = env.GAME_ROOMS.idFromName(roomId);
        const roomStub = env.GAME_ROOMS.get(durableObjectId);

        // Forward the WebSocket request to the Durable Object
        return roomStub.fetch(request);
      }

      // 404 for unknown routes
      return errorResponse('Not found', 404);
    } catch (error) {
      console.error('Worker error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      return errorResponse(message, 500);
    }
  },
};
