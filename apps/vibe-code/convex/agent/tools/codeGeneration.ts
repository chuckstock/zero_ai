import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../../_generated/api";

/**
 * Generate complete game code from scratch
 */
export const codeGenerationTool = createTool({
  description: `Generate a complete Phaser.js game from a description. 
Use this when creating a new game or doing a full rewrite.
The code should include preload(), create(), and update() functions.`,
  
  args: z.object({
    code: z.string().describe(
      "Complete Phaser.js game code with preload, create, and update functions"
    ),
    explanation: z.string().describe(
      "Clear explanation of what the game does and how it works"
    ),
    features: z.array(z.string()).describe(
      "List of features implemented (e.g., ['player movement', 'scoring', 'collision detection'])"
    ).optional(),
  }),

  handler: async (ctx, args) => {
    const { gameId } = ctx;
    
    if (!gameId) {
      throw new Error("No gameId in context - this tool requires a game context");
    }

    // Update the game code
    await ctx.runMutation(api.games.updateCode, {
      gameId,
      code: args.code,
    });

    return {
      success: true,
      message: args.explanation,
      features: args.features || [],
      codeLength: args.code.length,
    };
  },
});

/**
 * Add a specific feature to existing game code
 */
export const gameFeatureTool = createTool({
  description: `Add a specific feature to the existing game code.
Use this for incremental additions like: scoring systems, new enemies, 
power-ups, levels, animations, etc.`,
  
  args: z.object({
    feature: z.string().describe(
      "Name of the feature being added (e.g., 'scoring system', 'enemy AI')"
    ),
    code: z.string().describe(
      "Updated complete game code with the new feature integrated"
    ),
    explanation: z.string().describe(
      "Explanation of what was added and how it works"
    ),
    integration: z.string().describe(
      "How this feature integrates with existing code"
    ).optional(),
  }),

  handler: async (ctx, args) => {
    const { gameId } = ctx;
    
    if (!gameId) {
      throw new Error("No gameId in context");
    }

    await ctx.runMutation(api.games.updateCode, {
      gameId,
      code: args.code,
    });

    return {
      success: true,
      feature: args.feature,
      message: args.explanation,
      integration: args.integration,
    };
  },
});

/**
 * Improve/refactor existing game code
 */
export const codeImprovementTool = createTool({
  description: `Refactor and improve existing game code.
Use for: performance optimization, code cleanup, bug fixes, 
better organization, adding comments, removing redundancy.`,
  
  args: z.object({
    code: z.string().describe(
      "Improved version of the game code"
    ),
    improvements: z.array(z.string()).describe(
      "List of improvements made (e.g., ['optimized collision detection', 'added comments', 'fixed memory leak'])"
    ),
    explanation: z.string().describe(
      "Summary of what was improved and why"
    ),
  }),

  handler: async (ctx, args) => {
    const { gameId } = ctx;
    
    if (!gameId) {
      throw new Error("No gameId in context");
    }

    await ctx.runMutation(api.games.updateCode, {
      gameId,
      code: args.code,
    });

    return {
      success: true,
      improvements: args.improvements,
      message: args.explanation,
      codeQuality: "improved",
    };
  },
});
