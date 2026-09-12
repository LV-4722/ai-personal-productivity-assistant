import { GoogleGenAI } from "@google/genai";
import { AssistantContext, AssistantIntent } from "../types/assistant.js";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

const ASSISTANT_INTENT_SCHEMA = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["CREATE_TASK", "LIST_TASKS", "COMPLETE_TASK", "UNKNOWN"],
    },
    task: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: ["string", "null"] },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        due_date: { type: ["string", "null"], format: "date-time" },
      },
      required: ["title", "description", "priority", "due_date"],
      additionalProperties: false,
    },
    filter: {
      type: "object",
      properties: {
        due_date: { type: ["string", "null"], format: "date-time" },
        completed: { type: ["boolean", "null"] },
      },
      required: ["due_date", "completed"],
      additionalProperties: false,
    },
    task_reference: {
      type: "object",
      properties: {
        title: { type: "string" },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  required: ["action"],
  additionalProperties: false,
} as const;

function isAssistantIntent(value: unknown): value is AssistantIntent {
  if (typeof value !== "object" || value === null || !("action" in value)) {
    return false;
  }

  const intent = value as Record<string, unknown>;

  if (intent.action === "UNKNOWN") {
    return true;
  }

  if (intent.action === "CREATE_TASK") {
    const task = intent.task;
    return (
      typeof task === "object" &&
      task !== null &&
      typeof (task as Record<string, unknown>).title === "string" &&
      ((task as Record<string, unknown>).description === null ||
        typeof (task as Record<string, unknown>).description === "string") &&
      ["LOW", "MEDIUM", "HIGH"].includes(
        String((task as Record<string, unknown>).priority),
      ) &&
      ((task as Record<string, unknown>).due_date === null ||
        typeof (task as Record<string, unknown>).due_date === "string")
    );
  }

  if (intent.action === "LIST_TASKS") {
    const filter = intent.filter;
    return (
      typeof filter === "object" &&
      filter !== null &&
      ((filter as Record<string, unknown>).due_date === null ||
        typeof (filter as Record<string, unknown>).due_date === "string") &&
      ((filter as Record<string, unknown>).completed === null ||
        typeof (filter as Record<string, unknown>).completed === "boolean")
    );
  }

  if (intent.action === "COMPLETE_TASK") {
    const taskReference = intent.task_reference;
    return (
      typeof taskReference === "object" &&
      taskReference !== null &&
      typeof (taskReference as Record<string, unknown>).title === "string"
    );
  }

  return false;
}

function getAssistantContext(): AssistantContext {
  return {
    currentDateTime: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

function getGeminiClient(): { client: GoogleGenAI; model: string } {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return {
    client: new GoogleGenAI({ apiKey }),
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  };
}

function buildPrompt(message: string, context: AssistantContext): string {
  return `You are an intent extraction layer for a personal productivity assistant.

Current date/time: ${context.currentDateTime}
Timezone: ${context.timeZone}

Determine the user's requested action. Return only JSON matching the supplied schema.
Do not return markdown or explanations. Do not execute actions. Do not invent database IDs.
Do not generate SQL. Use only the supported actions.
For relative dates, use the current date/time and timezone above, and return an ISO-8601 timestamp.

User message: ${message}`;
}

export async function generateAssistantIntent(
  message: string,
  context: AssistantContext = getAssistantContext(),
): Promise<AssistantIntent> {
  const { client, model } = getGeminiClient();

  let response;

  try {
    response = await client.models.generateContent({
      model,
      contents: buildPrompt(message, context),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ASSISTANT_INTENT_SCHEMA,
      },
    });
  } catch (error) {
    throw new Error("Gemini intent generation failed.", { cause: error });
  }

  if (!response.text?.trim()) {
    throw new Error("Gemini returned an empty intent response.");
  }

  let intent: unknown;

  try {
    intent = JSON.parse(response.text);
  } catch (error) {
    throw new Error("Gemini returned invalid JSON for the assistant intent.", {
      cause: error,
    });
  }

  if (!isAssistantIntent(intent)) {
    throw new Error("Gemini returned an invalid assistant intent structure.");
  }

  return intent;
}
