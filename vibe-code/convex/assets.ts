import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("model3d")
    ),
    storageId: v.id("_storage"),
    metadata: v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      size: v.number(),
      mimeType: v.string(),
    }),
    source: v.union(v.literal("upload"), v.literal("generated")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Failed to get storage URL");

    const assetId = await ctx.db.insert("assets", {
      gameId: args.gameId,
      userId: user._id,
      name: args.name,
      type: args.type,
      storageId: args.storageId,
      url,
      metadata: args.metadata,
      source: args.source,
      createdAt: Date.now(),
    });

    return assetId;
  },
});

export const listByGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assets")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .collect();
  },
});

export const deleteAsset = mutation({
  args: { assetId: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.assetId);
    if (!asset) throw new Error("Asset not found");

    await ctx.storage.delete(asset.storageId);
    await ctx.db.delete(args.assetId);

    return { success: true };
  },
});
