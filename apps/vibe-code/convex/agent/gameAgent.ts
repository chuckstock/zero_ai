import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { components } from "../_generated/api";
import { 
  codeGenerationTool, 
  codeImprovementTool,
  gameFeatureTool 
} from "./tools/codeGeneration";
import { imageGenerationTool } from "./tools/imageGeneration";
import { gameConfigTool } from "./tools/gameConfig";
import { GAME_DEV_SYSTEM_PROMPT } from "./prompts";

/**
 * Main AI agent for game development
 * Handles code generation, asset creation, and game configuration
 */
export const gameAgent = new Agent(components.agent, {
  name: "Vibe Code Game Agent",
  chat: openai.chat("gpt-4-turbo"),
  instructions: GAME_DEV_SYSTEM_PROMPT,
  tools: {
    generateGameCode: codeGenerationTool,
    improveGameCode: codeImprovementTool,
    addGameFeature: gameFeatureTool,
    generateImage: imageGenerationTool,
    updateGameConfig: gameConfigTool,
  },
});
