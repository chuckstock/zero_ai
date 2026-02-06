import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { SYSTEM_PROMPT, TOOL_DEFINITIONS } from "./ai/prompts";

export const processMessage = internalAction({
  args: {
    gameId: v.id("games"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    try {
      // Fetch context
      const game = await ctx.runQuery(api.games.get, { id: args.gameId });
      const messages = await ctx.runQuery(api.messages.list, { gameId: args.gameId });
      const assets = await ctx.runQuery(api.assets.listByGame, { gameId: args.gameId });

      if (!game) throw new Error("Game not found");

      // Build context for AI
      const assetList = assets.map(a => `- ${a.name} (${a.type})`).join("\n");
      const contextMessage = `Current game state:
Width: ${game.config.width}px, Height: ${game.config.height}px
Background: ${game.config.backgroundColor}

Available assets:
${assetList || "(none)"}

Current code:
\`\`\`javascript
${game.code}
\`\`\``;

      // Build OpenAI messages
      const openaiMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: contextMessage },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Call OpenRouter (OpenAI-compatible API)
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/chuckstock/zero_ai", // Optional: for rankings
          "X-Title": "Vibe Code", // Optional: for rankings
        },
        body: JSON.stringify({
          model: "openai/gpt-4-turbo-preview", // OpenRouter model format
          messages: openaiMessages,
          tools: TOOL_DEFINITIONS,
          tool_choice: "auto",
        }),
      });

      const result = await response.json();
      const assistantMessage = result.choices[0].message;

      // Handle tool calls
      const toolCalls = assistantMessage.tool_calls || [];
      const toolResults = [];

      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        let result;
        switch (toolName) {
          case "updateGameCode":
            result = await ctx.runAction(internal.ai.tools.updateGameCode, {
              gameId: args.gameId,
              code: toolArgs.code,
              explanation: toolArgs.explanation,
            });
            break;
          case "updateGameConfig":
            result = await ctx.runAction(internal.ai.tools.updateGameConfig, {
              gameId: args.gameId,
              config: toolArgs,
            });
            break;
          case "generateImage":
            result = await ctx.runAction(internal.ai.tools.generateImage, {
              gameId: args.gameId,
              prompt: toolArgs.prompt,
              name: toolArgs.name,
            });
            break;
          default:
            result = { error: `Unknown tool: ${toolName}` };
        }

        toolResults.push({
          id: toolCall.id,
          name: toolName,
          arguments: JSON.stringify(toolArgs),
          result: JSON.stringify(result),
        });
      }

      // Store AI response
      await ctx.runMutation(api.messages.create, {
        gameId: args.gameId,
        role: "assistant",
        content: assistantMessage.content || "✓ Done",
        toolCalls: toolResults.length > 0 ? toolResults : undefined,
      });

      return { success: true };
    } catch (error) {
      console.error("AI processing error:", error);
      
      // Store error message
      await ctx.runMutation(api.messages.create, {
        gameId: args.gameId,
        role: "system",
        content: `Error: ${error.message}`,
      });

      throw error;
    }
  },
});
