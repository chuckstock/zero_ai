import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../../_generated/api";

/**
 * Generate images using AI (Replicate FLUX)
 */
export const imageGenerationTool = createTool({
  description: `Generate game assets (backgrounds, characters, objects, sprites) using AI.
Creates high-quality images with FLUX Schnell model.
Use descriptive prompts with style, composition, and color details.`,
  
  args: z.object({
    prompt: z.string().describe(
      "Detailed image generation prompt. Be specific about: style (pixel art, realistic, cartoon), subject, colors, composition, mood. Example: 'pixel art space background with stars and nebula, dark blue and purple colors, 8-bit style'"
    ),
    name: z.string().describe(
      "Asset name to use in code (alphanumeric, no spaces). Examples: 'background', 'player', 'enemy1', 'powerup'"
    ),
    purpose: z.string().describe(
      "What this asset will be used for in the game"
    ).optional(),
  }),

  handler: async (ctx, args) => {
    const { gameId } = ctx;
    
    if (!gameId) {
      throw new Error("No gameId in context");
    }

    const replicateApiKey = process.env.REPLICATE_API_TOKEN;
    if (!replicateApiKey) {
      throw new Error("REPLICATE_API_TOKEN not configured");
    }

    try {
      // Start prediction
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
          input: {
            prompt: args.prompt,
            num_outputs: 1,
            aspect_ratio: "1:1",
            output_format: "png",
            output_quality: 90,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`);
      }

      const prediction = await response.json();
      const predictionId = prediction.id;

      // Poll for completion (max 60 seconds)
      let imageUrl: string | null = null;
      const maxAttempts = 30;
      const pollInterval = 2000;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const statusResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              "Authorization": `Bearer ${replicateApiKey}`,
            },
          }
        );

        const status = await statusResponse.json();

        if (status.status === "succeeded") {
          imageUrl = status.output?.[0];
          break;
        } else if (status.status === "failed") {
          throw new Error(`Image generation failed: ${status.error || "unknown error"}`);
        }
        // Continue polling if still processing
      }

      if (!imageUrl) {
        throw new Error("Image generation timed out after 60 seconds");
      }

      // Download the generated image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }

      const imageBlob = await imageResponse.blob();

      // Upload to Convex storage
      const storageId = await ctx.storage.store(imageBlob);

      // Create asset record
      const assetId = await ctx.runMutation(api.assets.create, {
        gameId,
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
        purpose: args.purpose,
        message: `Generated image '${args.name}' and added to game assets. Use it in code with: this.load.image('${args.name}', url) in preload() and this.add.image(x, y, '${args.name}') in create().`,
      };

    } catch (error: any) {
      console.error("Image generation error:", error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  },
});
