import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// --- Zod Schemas ---

const AttributeSchema = z.object({
  description: z
    .string()
    .optional()
    .describe("Physical or personality description"),
  traits: z.array(z.string()).optional().describe("Key personality traits"),
  current_emotion: z
    .string()
    .optional()
    .describe("Emotion shown in this specific narration"),
  sentiment_score: z
    .number()
    .min(-10)
    .max(10)
    .optional()
    .describe("Sentiment analysis score"),
  type: z.string().optional().describe("Type of location/org if applicable"),
});

const CharacterSchema = z.object({
  name: z.string().describe("The resolved full name of the character."),
  mention_phrase: z
    .string()
    .describe("The exact phrase used to refer to them."),
  attributes: AttributeSchema,
  confidence: z.number().min(0).max(1).describe("Confidence score 0.0-1.0"),
});

const SimpleElementSchema = z.object({
  name: z.string().describe("The resolved full name."),
  mention_phrase: z.string().describe("The exact phrase used."),
  attributes: AttributeSchema,
  confidence: z.number().min(0).max(1).describe("Confidence score 0.0-1.0"),
});

const EventSchema = z.object({
  title: z.string().describe("Short title for the event"),
  description: z.string().describe("Detailed significance of the event"),
  characters_involved: z
    .array(z.string())
    .describe("Names of characters involved"),
  location: z.string().optional().describe("Location name where it happened"),
  emotional_tone: z.string().describe("e.g. Hopeful, Tense, Tragic"),
  importance: z.number().min(1).max(10).describe("Narrative weight 1-10"),
  is_turning_point: z
    .boolean()
    .describe("If this changes the story significantly"),
});

const ConnectionSchema = z.object({
  from: z.string().describe("Source entity name"),
  to: z.string().describe("Target entity name"),
  type: z.string().describe("Nature of connection (e.g. loves, hates)"),
  weight: z.number().min(1).max(10).describe("Strength 1-10"),
  emotional_charge: z
    .number()
    .min(-10)
    .max(10)
    .describe("Positive/Negative charge"),
  description: z.string().describe("Reason for the connection"),
});

const AnalysisSchema = z.object({
  extracted: z.object({
    characters: z.array(CharacterSchema).default([]),
    locations: z.array(SimpleElementSchema).default([]),
    organizations: z.array(SimpleElementSchema).default([]),
    events: z.array(EventSchema).default([]),
    connections: z.array(ConnectionSchema).default([]),
  }),
  listener_response: z
    .string()
    .describe("Empathetic 1-sentence listener response"),
});

@Injectable()
export class AiService {
  private aiClient: GoogleGenAI | null = null;
  private readonly logger = new Logger(AiService.name);
  private readonly aiProvider: "ollama" | "gemini";
  private readonly ollamaHost: string;
  private readonly ollamaModel: string;

  constructor(private configService: ConfigService) {
    const configuredProvider = this.configService
      .get<string>("AI_PROVIDER")
      ?.toLowerCase();
    this.aiProvider = configuredProvider === "gemini" ? "gemini" : "ollama";
    this.ollamaHost = (
      this.configService.get<string>("OLLAMA_HOST") || "http://127.0.0.1:11434"
    ).replace(/\/$/, "");
    this.ollamaModel =
      this.configService.get<string>("OLLAMA_MODEL") || "llama3.2";

    const apiKey = this.configService.get<string>("GEMINI_API_KEY");

    if (this.aiProvider === "gemini" && apiKey) {
      try {
        this.aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        this.logger.log("[AiService] GoogleGenAI client initialized with GEMINI_API_KEY");
      } catch (err) {
        this.logger.warn("[AiService] Error initializing GoogleGenAI:", err);
      }
    } else if (this.aiProvider === "gemini") {
      this.logger.warn("[AiService] GEMINI_API_KEY is not configured. Narrative intelligence will use smart local fallbacks.");
    } else {
      this.logger.log(`[AiService] Ollama provider enabled: ${this.ollamaHost} (${this.ollamaModel})`);
    }
  }

  private readonly PRIMARY_MODEL = "gemini-3.6-flash";
  private readonly FALLBACK_MODEL = "gemini-3.8-flash";

  private getClient(): GoogleGenAI | null {
    if (!this.aiClient) {
      const apiKey = this.configService.get<string>("GEMINI_API_KEY");
      if (apiKey) {
        try {
          this.aiClient = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                "User-Agent": "aistudio-build",
              },
            },
          });
        } catch (e) {
          // ignore
        }
      }
    }
    return this.aiClient;
  }

  private async generateWithFallback(client: GoogleGenAI, params: any) {
    try {
      return await client.models.generateContent({
        ...params,
        model: this.PRIMARY_MODEL,
      });
    } catch (err: any) {
      this.logger.warn(
        `[AiService] Primary model (${this.PRIMARY_MODEL}) encountered: ${err.message || err}. Attempting fallback (${this.FALLBACK_MODEL})...`
      );
      return await client.models.generateContent({
        ...params,
        model: this.FALLBACK_MODEL,
      });
    }
  }

  private async generateWithOllama(prompt: string, format?: unknown): Promise<string> {
    const response = await fetch(`${this.ollamaHost}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.ollamaModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        ...(format ? { format } : {}),
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}: ${await response.text()}`);
    }

    const result = (await response.json()) as { message?: { content?: string } };
    return result.message?.content?.trim() || "";
  }

  private normalizeAnalysis(value: any) {
    const clamp = (input: unknown, minimum: number, maximum: number) => {
      const number = typeof input === "number" ? input : Number(input);
      if (!Number.isFinite(number)) return minimum;
      return Math.min(maximum, Math.max(minimum, number));
    };

    for (const event of value?.extracted?.events || []) {
      event.importance = clamp(event.importance, 1, 10);
    }
    for (const connection of value?.extracted?.connections || []) {
      connection.weight = clamp(connection.weight, 1, 10);
      connection.emotional_charge = clamp(connection.emotional_charge, -10, 10);
    }
    for (const character of value?.extracted?.characters || []) {
      character.confidence = clamp(character.confidence, 0, 1);
      if (character.attributes?.sentiment_score !== undefined) {
        character.attributes.sentiment_score = clamp(
          character.attributes.sentiment_score,
          -10,
          10,
        );
      }
    }
    for (const element of [
      ...(value?.extracted?.locations || []),
      ...(value?.extracted?.organizations || []),
    ]) {
      element.confidence = clamp(element.confidence, 0, 1);
      if (element.attributes?.sentiment_score !== undefined) {
        element.attributes.sentiment_score = clamp(
          element.attributes.sentiment_score,
          -10,
          10,
        );
      }
    }

    return value;
  }

  /**
   * Analyze narration to extract elements and generate a response in a single pass.
   */
  async analyzeNarration(narration: string, context?: any) {
    const existingEntities =
      context?.entities?.length > 0
        ? `Existing Story Entities: ${context.entities.join(", ")}`
        : "No existing entities yet.";

    const prompt = `You are a hyper-competent Narrative Intelligence Engine. 
    
    TASK: Analyze the narration and extract key narrative components (characters, locations, events, connections).
    Also generate a brief, empathetic 1-sentence "listener_response" acknowledging the developments.

    Narration: "${narration}"
    ${existingEntities}
    ${context?.recentEvents ? `Recent Story Events: ${JSON.stringify(context.recentEvents)}` : ""}

    CRITICAL: 
    1. If a character/location matches an existing entity name, use that EXACT name.
    2. Do not invent details not present in the text.
    3. Numeric ranges are strict: importance and connection weight must be 1-10, confidence 0-1, sentiment_score and emotional_charge -10 to 10.
    `;

    if (this.aiProvider === "ollama") {
      try {
        const jsonSchema = zodToJsonSchema(AnalysisSchema as any, {
          $refStrategy: "none",
        });
        const responseText = await this.generateWithOllama(prompt, jsonSchema);
        if (responseText) {
          return AnalysisSchema.parse(
            this.normalizeAnalysis(JSON.parse(responseText)),
          );
        }
      } catch (error) {
        this.logger.error("[AiService] Ollama analysis failed:", error);
      }
    } else {
      const client = this.getClient();
      if (client) {
      try {
        this.logger.log(`[AiService] Analyzing narration with Structured Output via ${this.PRIMARY_MODEL}...`);

        const jsonSchema = zodToJsonSchema(AnalysisSchema as any, {
          $refStrategy: "none",
        });

        const cleanSchema = (schema: any) => {
          if (!schema || typeof schema !== "object") return;
          delete schema.$schema;
          delete schema.additionalProperties;

          if (schema.properties) {
            Object.values(schema.properties).forEach(cleanSchema);
          }
          if (schema.items) {
            cleanSchema(schema.items);
          }
          if (schema.anyOf) {
            schema.anyOf.forEach(cleanSchema);
          }
          if (schema.allOf) {
            schema.allOf.forEach(cleanSchema);
          }
          if (schema.oneOf) {
            schema.oneOf.forEach(cleanSchema);
          }
        };

        cleanSchema(jsonSchema);

        const result = await this.generateWithFallback(client, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
          },
        });

        const responseText = result.text;
        if (responseText) {
          const parsed = AnalysisSchema.parse(JSON.parse(responseText));
          return parsed;
        }
      } catch (error) {
        this.logger.error("[AiService] Gemini analysis failed:", error);
      }
      }
    }

    // Heuristic fallback for offline/demo operation
    return this.generateHeuristicAnalysis(narration, context);
  }

  private generateHeuristicAnalysis(narration: string, context?: any) {
    const words = narration.split(/\s+/);
    const capitalized = words.filter(
      (w) => /^[A-Z][a-z]+$/.test(w) && !['The', 'A', 'An', 'He', 'She', 'They', 'It', 'In', 'On', 'At', 'From', 'With', 'Then', 'When'].includes(w)
    );
    const uniqueNames = Array.from(new Set(capitalized));
    const mainCharacter = uniqueNames[0] || (context?.entities?.[0] ? context.entities[0] : 'Narrator');

    const characters = uniqueNames.slice(0, 2).map((name) => ({
      name,
      mention_phrase: name,
      attributes: {
        traits: ['Key Narrative Figure'],
        current_emotion: 'Intrigued',
        sentiment_score: 2,
      },
      confidence: 0.85,
    }));

    const events = [
      {
        title: narration.length > 40 ? `${narration.slice(0, 36)}...` : narration,
        description: narration,
        characters_involved: characters.map((c) => c.name),
        emotional_tone: 'Mysterious',
        importance: 6,
        is_turning_point: false,
      },
    ];

    return {
      extracted: {
        characters,
        locations: [],
        organizations: [],
        events,
        connections: characters.length >= 2 ? [
          {
            from: characters[0].name,
            to: characters[1].name,
            type: 'interacts_with',
            weight: 5,
            emotional_charge: 1,
            description: 'Encountered in the scene',
          },
        ] : [],
      },
      listener_response: `A compelling development unfolds involving ${mainCharacter}. The scene deepens.`,
    };
  }

  /**
   * Brainstorm story title and description options based on context
   */
  async brainstormStoryTheme(context: any) {
    const prompt = `You are a world-class narrative architect. Based on the following world bible and timeline, suggest 3 distinct "Vibes" for this story.
Each vibe should have a compelling title and a 1-sentence evocative description.

World Bible (Characters, Places, etc.): ${JSON.stringify(context.entities)}
Timeline (Key Events): ${JSON.stringify(context.moments)}

Return ONLY a valid JSON array of objects:
[
  { "title": "Option 1 Title", "description": "Evocative summary" },
  { "title": "Option 2 Title", "description": "Evocative summary" },
  { "title": "Option 3 Title", "description": "Evocative summary" }
]`;

    if (this.aiProvider === "ollama") {
      try {
        const text = await this.generateWithOllama(prompt, "json");
        const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
      } catch (error) {
        this.logger.error("[AiService] Error brainstorming theme with Ollama:", error);
      }
    } else {
      const client = this.getClient();
      if (client) {
      try {
        const result = await this.generateWithFallback(client, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const text = result.text || "";
        const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(clean);
      } catch (error) {
        this.logger.error("[AiService] Error brainstorming theme:", error);
      }
      }
    }

    return [
      { title: "Echoes of the Unseen", description: "A mystical journey into forgotten realms where memory shapes reality." },
      { title: "The Obsidian Frontier", description: "High-stakes exploration of ancient ruins holding cosmic machinery." },
      { title: "Whispers in the Starlight", description: "An intimate character drama set against the backdrop of an awakening mystery." },
    ];
  }

  /**
   * Simulate a conversation with a specific character
   */
  async simulateCharacterDialogue(
    characterName: string,
    attributes: any,
    userPrompt: string,
    context: any,
  ) {
    const prompt = `You are playing the role of a character in a story.
    
Character Name: ${characterName}
Character Attributes/Traits: ${JSON.stringify(attributes)}
Recent Story Events: ${JSON.stringify(context.moments)}

The creator (User) asks you: "${userPrompt}"

CRITICAL RULE:
1. Speak ONLY as this character. Use their voice, slang, world-view, and limitations.
2. Keep it brief (2-3 sentences max).
3. If the user asks about something you shouldn't know, express confusion.

Your Response:`;

    if (this.aiProvider === "ollama") {
      try {
        const dialogue = await this.generateWithOllama(prompt);
        if (dialogue) return dialogue;
      } catch (error) {
        this.logger.error("[AiService] Error simulating dialogue with Ollama:", error);
      }
    } else {
      const client = this.getClient();
      if (client) {
      try {
        const result = await this.generateWithFallback(client, {
          contents: prompt,
        });
        const dialogue = result.text?.trim();
        if (dialogue) return dialogue;
      } catch (error) {
        this.logger.error("[AiService] Error simulating dialogue:", error);
      }
      }
    }

    const traits = attributes?.traits?.join(", ") || "mysterious persona";
    return `"${userPrompt}?" ${characterName} turns to face you, exhibiting traits of ${traits}. "Some questions unearth truths neither of us are prepared to face."`;
  }

  /**
   * Generate cinematic portrait or concept visual for an entity
   */
  async generateEntityVisual(
    name: string,
    type: string,
    description: string = "",
    traits: string[] = [],
  ): Promise<string> {
    const prompt = `Cinematic high-detail ${type} concept art portrait of "${name}". Context: ${description || "legendary figure"}. Key traits: ${traits.join(", ") || "evocative atmosphere"}. Dramatic volumetric lighting, rich color, 8k resolution fantasy/sci-fi illustration.`;

    const client = this.aiProvider === "gemini" ? this.getClient() : null;
    if (client) {
      try {
        const response = await (client as any).models.generateImages({
          model: "imagen-3.0-generate-002",
          prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            aspectRatio: "1:1",
          },
        });
        const bytes = response?.generatedImages?.[0]?.image?.imageBytes;
        if (bytes) {
          return `data:image/jpeg;base64,${bytes}`;
        }
      } catch (err) {
        this.logger.warn(`[AiService] Imagen generation not available, falling back to curated cinematic visual: ${err}`);
      }
    }

    // High quality thematic fallbacks based on type and keywords
    const keywords = `${name} ${description} ${traits.join(" ")}`.toLowerCase();
    if (type === "location") {
      if (keywords.includes("spire") || keywords.includes("tower") || keywords.includes("castle") || keywords.includes("citadel")) {
        return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80";
      }
      if (keywords.includes("forest") || keywords.includes("tree") || keywords.includes("woods") || keywords.includes("grove")) {
        return "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80";
      }
      if (keywords.includes("cyber") || keywords.includes("neon") || keywords.includes("future") || keywords.includes("city")) {
        return "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80";
      }
      return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
    } else if (type === "organization") {
      return "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80";
    } else {
      // Character
      if (keywords.includes("karen") || keywords.includes("lady") || keywords.includes("queen") || keywords.includes("sorceress") || keywords.includes("woman")) {
        return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80";
      }
      if (keywords.includes("ronald") || keywords.includes("lord") || keywords.includes("king") || keywords.includes("warrior") || keywords.includes("knight")) {
        return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80";
      }
      return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80";
    }
  }
}
