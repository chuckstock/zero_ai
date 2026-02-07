import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../../_generated/api";

/**
 * Update game configuration (canvas size, colors, etc.)
 */
export const gameConfigTool = createTool({
  description: `Update game configuration settings like canvas size and background color.
Use when the user wants to change the game's dimensions or visual appearance.`,
  
  args: z.object({
    width: z.number()
      .min(100)
      .max(2000)
      .describe("Canvas width in pixels (100-2000)")
      .optional(),
    
    height: z.number()
      .min(100)
      .max(2000)
      .describe("Canvas height in pixels (100-2000)")
      .optional(),
    
    backgroundColor: z.string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .describe("Background color as hex code (e.g., #000000 for black, #ffffff for white)")
      .optional(),
    
    explanation: z.string()
      .describe("Brief explanation of what was changed")
      .optional(),
  }),

  handler: async (ctx, args) => {
    const { gameId } = ctx;
    
    if (!gameId) {
      throw new Error("No gameId in context");
    }

    // Build config update object
    const config: {
      width?: number;
      height?: number;
      backgroundColor?: string;
    } = {};

    if (args.width !== undefined) config.width = args.width;
    if (args.height !== undefined) config.height = args.height;
    if (args.backgroundColor !== undefined) config.backgroundColor = args.backgroundColor;

    if (Object.keys(config).length === 0) {
      return {
        success: false,
        message: "No configuration changes specified",
      };
    }

    // Update game configuration
    await ctx.runMutation(api.games.updateConfig, {
      gameId,
      config,
    });

    // Build response message
    const changes = [];
    if (config.width || config.height) {
      changes.push(`Canvas size: ${config.width || "unchanged"}×${config.height || "unchanged"}px`);
    }
    if (config.backgroundColor) {
      changes.push(`Background color: ${config.backgroundColor}`);
    }

    return {
      success: true,
      config,
      changes,
      message: args.explanation || `Updated game configuration: ${changes.join(", ")}`,
    };
  },
});
