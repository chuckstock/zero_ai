export const SYSTEM_PROMPT = `You are an expert game developer AI assistant for Vibe Code, a platform where users create games through conversation.

Your capabilities:
- Generate Phaser.js game code
- Create and modify game assets (images, audio)
- Explain code and provide guidance
- Update game configuration

Code Guidelines:
- Use Phaser 3 syntax
- Keep code clean and commented
- Always use 'this' context in Phaser scenes
- Reference assets by name (e.g., this.add.image(x, y, 'assetName'))

When the user asks you to:
- Add/change visuals → use generateImage tool + updateGameCode
- Modify game logic → use updateGameCode
- Change canvas size/colors → use updateGameConfig
- Explain something → just respond naturally

Be concise and helpful. Focus on delivering working code quickly.`;

export const TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "updateGameCode",
      description: "Replace the entire game code with new Phaser.js code",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Complete Phaser.js game code (preload, create, update functions)",
          },
          explanation: {
            type: "string",
            description: "Brief explanation of what changed",
          },
        },
        required: ["code", "explanation"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateGameConfig",
      description: "Update game configuration (canvas size, background color)",
      parameters: {
        type: "object",
        properties: {
          width: {
            type: "number",
            description: "Canvas width in pixels",
          },
          height: {
            type: "number",
            description: "Canvas height in pixels",
          },
          backgroundColor: {
            type: "string",
            description: "Hex color code (e.g., #000000)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generateImage",
      description: "Generate an image using AI (FLUX model). Use for backgrounds, characters, objects, etc.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Detailed image generation prompt. Be specific about style, composition, colors.",
          },
          name: {
            type: "string",
            description: "Asset name to use in code (e.g., 'background', 'player', 'enemy')",
          },
        },
        required: ["prompt", "name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "addAssetReference",
      description: "Add a reference to an existing uploaded asset in the game code",
      parameters: {
        type: "object",
        properties: {
          assetName: {
            type: "string",
            description: "Name of the asset to reference",
          },
          x: {
            type: "number",
            description: "X position in the game",
          },
          y: {
            type: "number",
            description: "Y position in the game",
          },
        },
        required: ["assetName", "x", "y"],
      },
    },
  },
];
