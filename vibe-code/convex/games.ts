import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const gameId = await ctx.db.insert("games", {
      userId: user._id,
      name: args.name,
      description: args.description,
      code: `// Welcome to Vibe Code!\n// Start building your game by chatting with the AI\n\nfunction create() {\n  this.add.text(400, 300, 'Hello World!', { fontSize: '32px', fill: '#fff' });\n}\n`,
      config: {
        width: 800,
        height: 600,
        backgroundColor: "#000000",
      },
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return gameId;
  },
});

export const get = query({
  args: { id: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("games")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const updateCode = mutation({
  args: {
    gameId: v.id("games"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    await ctx.db.patch(args.gameId, {
      code: args.code,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateConfig = mutation({
  args: {
    gameId: v.id("games"),
    config: v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      backgroundColor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    await ctx.db.patch(args.gameId, {
      config: { ...game.config, ...args.config },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
