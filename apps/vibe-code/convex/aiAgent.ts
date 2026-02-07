/**
 * AI Agent actions using Convex Agent with streaming support
 * 
 * This replaces the old ai.ts with a modern tool-based architecture
 */

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { gameAgent } from "./agent/gameAgent";
import { buildGameContext } from "./agent/prompts";

/**
 * Start a new conversation thread for a game
 */
export const createGameThread = action({
  args: {
    gameId: v.id("games"),
    initialPrompt: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get game context
      const game = await ctx.runQuery(api.games.get, { id: args.gameId });
      const assets = await ctx.runQuery(api.assets.listByGame, { gameId: args.gameId });

      if (!game) {
        throw new Error("Game not found");
      }

      // Create thread with context
      const { threadId, thread } = await gameAgent.createThread(ctx, {
        // Pass gameId in context so tools can access it
        gameId: args.gameId,
      });

      // Build current game context
      const gameContext = buildGameContext(game, assets);

      // Generate response with streaming
      const result = await thread.streamText(
        { 
          prompt: `${gameContext}\n\nUser: ${args.initialPrompt}` 
        },
        { 
          saveStreamDeltas: {
            chunking: "line",
            throttleMs: 300, // Update every 300ms
          }
        }
      );

      return {
        threadId,
        message: result.text || "Processing...",
      };
    } catch (error: any) {
      console.error("Thread creation error:", error);
      throw new Error(`Failed to create thread: ${error.message}`);
    }
  },
});

/**
 * Continue an existing conversation thread
 */
export const continueGameThread = action({
  args: {
    gameId: v.id("games"),
    threadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get game context
      const game = await ctx.runQuery(api.games.get, { id: args.gameId });
      const assets = await ctx.runQuery(api.assets.listByGame, { gameId: args.gameId });

      if (!game) {
        throw new Error("Game not found");
      }

      // Continue thread
      const { thread } = await gameAgent.continueThread(ctx, {
        threadId: args.threadId,
        gameId: args.gameId, // Pass gameId for tools
      });

      // Build current game context
      const gameContext = buildGameContext(game, assets);

      // Generate response with streaming
      const result = await thread.streamText(
        { 
          prompt: `${gameContext}\n\nUser: ${args.prompt}` 
        },
        { 
          saveStreamDeltas: {
            chunking: "line",
            throttleMs: 300,
          }
        }
      );

      return {
        message: result.text || "Processing...",
      };
    } catch (error: any) {
      console.error("Thread continuation error:", error);
      throw new Error(`Failed to continue thread: ${error.message}`);
    }
  },
});

/**
 * Get messages for a thread with streaming support
 * This query will be called from the frontend to subscribe to messages
 */
export const getThreadMessages = action({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a simple pass-through for now
    // In production, you'd add authorization checks here
    return {
      threadId: args.threadId,
    };
  },
});
