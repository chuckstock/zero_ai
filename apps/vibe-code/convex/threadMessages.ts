/**
 * Queries for streaming thread messages
 * Frontend subscribes to these for real-time updates
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { 
  listUIMessages, 
  syncStreams, 
  vStreamArgs,
  paginationOptsValidator 
} from "@convex-dev/agent";

/**
 * List messages for a thread with streaming support
 * 
 * Usage in React:
 * const { results, status, loadMore } = useUIMessages(
 *   api.threadMessages.list,
 *   { threadId },
 *   { initialNumItems: 20, stream: true }
 * );
 */
export const list = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // TODO: Add authorization check
    // const userId = await getUserId(ctx);
    // await authorizeThreadAccess(ctx, args.threadId, userId);

    // Fetch regular messages with pagination
    const paginated = await listUIMessages(ctx, components.agent, args);

    // Fetch streaming message deltas
    const streams = await syncStreams(ctx, components.agent, args);

    return {
      ...paginated,
      streams,
    };
  },
});

/**
 * Get the latest messages (simplified, no pagination)
 * Useful for simple chat displays
 */
export const listSimple = query({
  args: {
    threadId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Use the agent component to fetch messages
    const messages = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("threadId"), args.threadId))
      .order("desc")
      .take(limit);

    return messages.reverse(); // Return in chronological order
  },
});
