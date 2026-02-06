import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    credits: v.number(),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  games: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    code: v.string(),
    config: v.object({
      width: v.number(),
      height: v.number(),
      backgroundColor: v.string(),
    }),
    thumbnail: v.optional(v.id("_storage")),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId", "createdAt"]),

  messages: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    toolCalls: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      arguments: v.string(),
      result: v.optional(v.string()),
    }))),
    createdAt: v.number(),
  }).index("by_game", ["gameId", "createdAt"]),

  assets: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    name: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("audio"),
      v.literal("video"),
      v.literal("model3d")
    ),
    storageId: v.id("_storage"),
    url: v.string(),
    metadata: v.object({
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      size: v.number(),
      mimeType: v.string(),
    }),
    source: v.union(
      v.literal("upload"),
      v.literal("generated")
    ),
    createdAt: v.number(),
  }).index("by_game", ["gameId", "createdAt"]),
});
