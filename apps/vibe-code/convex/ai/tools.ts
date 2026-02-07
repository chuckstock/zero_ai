import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { internalAction } from "../_generated/server";

export const generateImage = internalAction({
	args: {
		gameId: v.id("games"),
		prompt: v.string(),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		// Get Replicate API key from environment
		const replicateApiKey = process.env.REPLICATE_API_TOKEN;
		if (!replicateApiKey) {
			throw new Error("REPLICATE_API_TOKEN not configured");
		}

		try {
			// Call Replicate API
			const response = await fetch("https://api.replicate.com/v1/predictions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${replicateApiKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					version:
						"5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637", // FLUX Schnell latest
					input: {
						prompt: args.prompt,
						num_outputs: 1,
						aspect_ratio: "1:1",
						output_format: "png",
						output_quality: 90,
					},
				}),
			});

			const prediction = await response.json();
			const predictionId = prediction.id;

			// Poll for completion (max 60 seconds)
			let imageUrl = null;
			for (let i = 0; i < 30; i++) {
				await new Promise((resolve) => setTimeout(resolve, 2000));

				const statusResponse = await fetch(
					`https://api.replicate.com/v1/predictions/${predictionId}`,
					{
						headers: {
							Authorization: `Bearer ${replicateApiKey}`,
						},
					},
				);

				const status = await statusResponse.json();

				if (status.status === "succeeded") {
					imageUrl = status.output?.[0];
					break;
				} else if (status.status === "failed") {
					throw new Error("Image generation failed");
				}
			}

			if (!imageUrl) {
				throw new Error("Image generation timed out");
			}

			// Download image
			const imageResponse = await fetch(imageUrl);
			const imageBlob = await imageResponse.blob();

			// Upload to Convex storage
			const storageId = await ctx.storage.store(imageBlob);

			// Create asset record
			const assetId: Id<"assets"> = await ctx.runMutation(api.assets.create, {
				gameId: args.gameId,
				name: args.name,
				type: "image",
				storageId,
				metadata: {
					width: 1024,
					height: 1024,
					size: imageBlob.size,
					mimeType: "image/png",
				},
				source: "generated",
			});

			return {
				success: true,
				assetId,
				assetName: args.name,
				prompt: args.prompt,
			};
		} catch (error) {
			console.error("Image generation error:", error);
			throw new Error(
				`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	},
});

export const updateGameCode = internalAction({
	args: {
		gameId: v.id("games"),
		code: v.string(),
		explanation: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.runMutation(api.games.updateCode, {
			gameId: args.gameId,
			code: args.code,
		});

		return {
			success: true,
			explanation: args.explanation,
		};
	},
});

export const updateGameConfig = internalAction({
	args: {
		gameId: v.id("games"),
		config: v.object({
			width: v.optional(v.number()),
			height: v.optional(v.number()),
			backgroundColor: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		await ctx.runMutation(api.games.updateConfig, {
			gameId: args.gameId,
			config: args.config,
		});

		return {
			success: true,
			config: args.config,
		};
	},
});
