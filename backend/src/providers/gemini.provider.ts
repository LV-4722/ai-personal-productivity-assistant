import { GoogleGenAI } from "@google/genai";
import { AssistantContext, AssistantIntent } from "../types/assistant.js";
import { TaskPriority } from "../types/task.js";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_APP_TIMEZONE = "Asia/Kolkata";

const ASSISTANT_INTENT_SCHEMA = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: [
        "CREATE_TASK",
        "LIST_TASKS",
        "UPDATE_TASK",
        "COMPLETE_TASK",
        "UNKNOWN",
      ],
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
        priority: { type: ["string", "null"], enum: ["LOW", "MEDIUM", "HIGH", null] },
      },
      required: ["due_date", "completed", "priority"],
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
    updates: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: ["string", "null"] },
        priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
        due_date: { type: ["string", "null"], format: "date-time" },
      },
      additionalProperties: false,
    },
  },
  required: ["action"],
  additionalProperties: false,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidDateOrNull(value: unknown): value is string | null {
  if (value === null) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    value === "LOW" ||
    value === "MEDIUM" ||
    value === "HIGH"
  );
}

function isTaskPriorityOrNull(value: unknown): value is TaskPriority | null {
  return value === null || isTaskPriority(value);
}

function hasOwnProperty(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isUpdateFields(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const hasUpdate =
    hasOwnProperty(value, "title") ||
    hasOwnProperty(value, "description") ||
    hasOwnProperty(value, "priority") ||
    hasOwnProperty(value, "due_date");

  return (
    hasUpdate &&
    (!hasOwnProperty(value, "title") || isNonEmptyString(value.title)) &&
    (!hasOwnProperty(value, "description") ||
      value.description === null ||
      typeof value.description === "string") &&
    (!hasOwnProperty(value, "priority") || isTaskPriority(value.priority)) &&
    (!hasOwnProperty(value, "due_date") || isValidDateOrNull(value.due_date))
  );
}

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
      isRecord(task) &&
      isNonEmptyString(task.title) &&
      (task.description === null || typeof task.description === "string") &&
      isTaskPriority(task.priority) &&
      isValidDateOrNull(task.due_date)
    );
  }

  if (intent.action === "LIST_TASKS") {
    const filter = intent.filter;
    return (
      isRecord(filter) &&
      isValidDateOrNull(filter.due_date) &&
      (filter.completed === null || typeof filter.completed === "boolean") &&
      isTaskPriorityOrNull(filter.priority)
    );
  }

  if (intent.action === "COMPLETE_TASK") {
    const taskReference = intent.task_reference;
    return (
      isRecord(taskReference) && isNonEmptyString(taskReference.title)
    );
  }

  if (intent.action === "UPDATE_TASK") {
    const taskReference = intent.task_reference;
    return (
      isRecord(taskReference) &&
      isNonEmptyString(taskReference.title) &&
      isUpdateFields(intent.updates)
    );
  }

  return false;
}

export function getApplicationTimeZone(): string {
  return process.env.APP_TIMEZONE || DEFAULT_APP_TIMEZONE;
}

function getAssistantContext(): AssistantContext {
  return {
    currentDateTime: new Date().toISOString(),
    timeZone: getApplicationTimeZone(),
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
