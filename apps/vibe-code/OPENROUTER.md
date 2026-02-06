# OpenRouter Integration

Vibe Code uses **OpenRouter** instead of direct OpenAI API. Here's why and how:

## Why OpenRouter?

**Benefits:**
1. **Multiple Models** - Access GPT-4, Claude, Llama, Mistral, etc. with one API key
2. **Cost Optimization** - Switch between models based on complexity and cost
3. **Fallback Support** - Automatically fall back if one model is unavailable
4. **Unified Interface** - OpenAI-compatible API for all models
5. **Better Pricing** - Often cheaper than direct API access

## Getting Started

### 1. Create Account

Visit https://openrouter.ai and sign up

### 2. Get API Key

1. Go to **Keys** section
2. Click **Create Key**
3. Copy your key (starts with `sk-or-v1-...`)

### 3. Add Credits

- Go to **Credits** section
- Add $5-10 to start (plenty for testing)
- Models charge per token, rates vary

### 4. Configure Vibe Code

```bash
# Set in Convex
npx convex env set OPENROUTER_API_KEY "sk-or-v1-..."
```

## Available Models

OpenRouter supports 50+ models. Here are good options for Vibe Code:

### Recommended for Code Generation

**GPT-4 Turbo** (current default)
- Model: `openai/gpt-4-turbo-preview`
- Best for complex game logic
- Cost: ~$0.01-0.03 per request

**Claude 3.5 Sonnet** (great alternative)
- Model: `anthropic/claude-3.5-sonnet`
- Excellent at code generation
- Cost: ~$0.015-0.075 per request

**GPT-4o** (fast + cheap)
- Model: `openai/gpt-4o`
- Good balance of speed/quality
- Cost: ~$0.0025-0.01 per request

### Budget Options

**Claude 3 Haiku**
- Model: `anthropic/claude-3-haiku`
- Fast and cheap
- Cost: ~$0.00025-0.00125 per request

**Llama 3.1 70B**
- Model: `meta-llama/llama-3.1-70b-instruct`
- Free or very cheap
- Good for simple requests

## Changing Models

Edit `convex/ai.ts`:

```typescript
body: JSON.stringify({
  model: "anthropic/claude-3.5-sonnet", // Change this line
  messages: openaiMessages,
  tools: TOOL_DEFINITIONS,
  tool_choice: "auto",
}),
```

## Model Selection Strategy

**For Vibe Code:**

1. **Code Generation** → GPT-4 Turbo or Claude 3.5 Sonnet
2. **Simple Changes** → GPT-4o or Claude 3 Haiku
3. **Explanations** → Any fast model (Llama, Haiku)
4. **Tool Calling** → GPT-4 Turbo (most reliable)

## Cost Estimates

**Typical Vibe Code Session (10 messages):**

- GPT-4 Turbo: $0.10-0.30
- Claude 3.5 Sonnet: $0.15-0.75
- GPT-4o: $0.025-0.10
- Claude 3 Haiku: $0.0025-0.0125

**Monthly (100 active users, 50 messages each):**
- GPT-4 Turbo: ~$50-150
- Claude 3.5 Sonnet: ~$75-375
- GPT-4o: ~$12-50
- Claude 3 Haiku: ~$1.25-6.25

## Advanced: Dynamic Model Selection

You can implement smart model routing:

```typescript
// Choose model based on request complexity
function selectModel(messageLength: number, hasTools: boolean) {
  if (hasTools || messageLength > 500) {
    return "openai/gpt-4-turbo-preview"; // Complex
  } else {
    return "openai/gpt-4o"; // Simple
  }
}
```

## Monitoring Usage

**OpenRouter Dashboard:**
1. Visit https://openrouter.ai
2. Go to **Activity** tab
3. See requests, costs, and errors
4. Set budget alerts

## Fallback Strategy

Add fallback for reliability:

```typescript
const models = [
  "openai/gpt-4-turbo-preview",
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
];

for (const model of models) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      // ... config
      body: JSON.stringify({ model, ...rest }),
    });
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    continue; // Try next model
  }
}
```

## Troubleshooting

### "Model not found"
- Check model name at https://openrouter.ai/models
- Verify model is active (not deprecated)

### "Insufficient credits"
- Add credits at https://openrouter.ai/credits
- Set up auto-reload

### "Rate limit exceeded"
- Upgrade plan or add rate limiting in your code
- Implement request queuing

### "Invalid API key"
- Verify key starts with `sk-or-v1-`
- Check key hasn't been revoked
- Regenerate if needed

## Resources

- **OpenRouter Docs:** https://openrouter.ai/docs
- **Model List:** https://openrouter.ai/models
- **Pricing:** https://openrouter.ai/models (shows cost per model)
- **API Reference:** https://openrouter.ai/docs#models

---

**Summary:** OpenRouter gives you flexibility, better pricing, and access to multiple models. Perfect for Vibe Code's needs. 🚀
