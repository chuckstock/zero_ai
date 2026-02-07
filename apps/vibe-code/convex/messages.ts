import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    gameId: v.id("games"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    toolCalls: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      arguments: v.string(),
      result: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      gameId: args.gameId,
      role: args.role,
      content: args.content,
      toolCalls: args.toolCalls,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const list = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .collect();
  },
});

export const send = mutation({
  args: {
    gameId: v.id("games"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      gameId: args.gameId,
      role: "user",
      content: args.content,
      createdAt: Date.now(),
    });

    // Trigger AI processing (scheduled action)
    await ctx.scheduler.runAfter(0, internal.ai.processMessage, {
      gameId: args.gameId,
      messageId,
    });

    return messageId;
  },
});
