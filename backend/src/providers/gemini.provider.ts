import { GoogleGenAI } from "@google/genai";
import { AssistantContext, AssistantIntent } from "../types/assistant.js";
import { TaskPriority } from "../types/task.js";

const DEFAULT_MODEL = "gemini-3.6-flash";
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
        "ORDER_FOOD",
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
    food_order: {
      type: "object",
      properties: {
        item_name: { type: ["string", "null"] },
        food_type: { type: ["string", "null"] },
        delivery_mode: {
          type: ["string", "null"],
          enum: ["DELIVERY", "PICKUP", "DINE_IN", null],
        },
        quantity: { type: ["integer", "null"] },
        restaurant_name: { type: ["string", "null"] },
      },
      required: [
        "item_name",
        "food_type",
        "delivery_mode",
        "quantity",
        "restaurant_name",
      ],
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

  if (intent.action === "ORDER_FOOD") {
    const foodOrder = intent.food_order;
    return (
      isRecord(foodOrder) &&
      (foodOrder.item_name === null || typeof foodOrder.item_name === "string") &&
      (foodOrder.food_type === null || typeof foodOrder.food_type === "string") &&
      (foodOrder.delivery_mode === null ||
        foodOrder.delivery_mode === "DELIVERY" ||
        foodOrder.delivery_mode === "PICKUP" ||
        foodOrder.delivery_mode === "DINE_IN") &&
      (foodOrder.quantity === null ||
        (typeof foodOrder.quantity === "number" &&
          Number.isInteger(foodOrder.quantity) &&
          foodOrder.quantity > 0)) &&
      (foodOrder.restaurant_name === null ||
        typeof foodOrder.restaurant_name === "string")
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
For relative dates (e.g., "tomorrow at 10AM", "next Monday"), use the current date/time and timezone above, and return an ISO-8601 timestamp for due_date.
For task creation, map any task request, reminder, action command (e.g., "Call Rahul tomorrow at 10AM", "Remind me to...", "Buy groceries", "Schedule meeting"), or todo item to CREATE_TASK with an appropriate title, description, priority, and due_date.
For food ordering requests, set action to ORDER_FOOD and extract mentioned item names, food types, delivery modes, quantities, or restaurant names into food_order. Do not determine workflow steps, UI state, navigation, or available options.

User message: ${message}`;
}

export function generateFallbackIntent(message: string): AssistantIntent {
  const lower = message.toLowerCase().trim();

  if (
    lower.includes("food") ||
    lower.includes("order") ||
    lower.includes("biryani") ||
    lower.includes("pizza") ||
    lower.includes("burger") ||
    lower.includes("eat") ||
    lower.includes("dinner") ||
    lower.includes("lunch")
  ) {
    let foodType: string | null = null;
    if (lower.includes("biryani") || lower.includes("indian")) foodType = "INDIAN";
    else if (lower.includes("pizza") || lower.includes("italian")) foodType = "ITALIAN";
    else if (lower.includes("burger") || lower.includes("fast food")) foodType = "FAST_FOOD";
    else if (lower.includes("sushi")) foodType = "SUSHI";
    else if (lower.includes("chinese")) foodType = "CHINESE";
    else if (lower.includes("mexican")) foodType = "MEXICAN";

    let itemName: string | null = null;
    if (lower.includes("biryani")) itemName = "Chicken Biryani";
    else if (lower.includes("pizza")) itemName = "Margherita Pizza";
    else if (lower.includes("burger")) itemName = "Classic Cheeseburger";

    return {
      action: "ORDER_FOOD",
      food_order: {
        item_name: itemName,
        food_type: foodType,
        delivery_mode: "DELIVERY",
        quantity: 1,
        restaurant_name: null,
      },
    };
  }

  if (
    lower.includes("pending") ||
    lower.includes("tasks") ||
    lower.includes("list") ||
    lower.includes("show tasks") ||
    lower.includes("what tasks")
  ) {
    return {
      action: "LIST_TASKS",
      filter: {
        due_date: null,
        completed: lower.includes("completed") ? true : false,
        priority: lower.includes("high") ? "HIGH" : null,
      },
    };
  }

  if (
    lower.includes("plan") ||
    lower.includes("schedule") ||
    lower.includes("today")
  ) {
    return {
      action: "LIST_TASKS",
      filter: {
        due_date: null,
        completed: false,
        priority: null,
      },
    };
  }

  if (
    lower.startsWith("create") ||
    lower.startsWith("add") ||
    lower.startsWith("call") ||
    lower.startsWith("remind") ||
    lower.startsWith("schedule") ||
    lower.startsWith("buy") ||
    lower.startsWith("pay") ||
    lower.startsWith("email") ||
    lower.startsWith("send") ||
    lower.startsWith("meet") ||
    lower.startsWith("do") ||
    lower.startsWith("write") ||
    lower.includes("create a task") ||
    lower.includes("new task") ||
    lower.includes("task")
  ) {
    let title = message
      .replace(/^(create|add|new)\s+(a\s+)?(task\s+)?(for\s+)?/i, "")
      .replace(/^(remind\s+(me\s+)?(to\s+)?)/i, "")
      .trim();

    if (!title) {
      title = message.trim();
    }

    return {
      action: "CREATE_TASK",
      task: {
        title,
        description: null,
        priority: lower.includes("high") || lower.includes("urgent") ? "HIGH" : "MEDIUM",
        due_date: null,
      },
    };
  }

  return {
    action: "UNKNOWN",
  };
}

export async function generateAssistantIntent(
  message: string,
  context: AssistantContext = getAssistantContext(),
): Promise<AssistantIntent> {
  try {
    const { client, model } = getGeminiClient();

    let response;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        response = await client.models.generateContent({
          model,
          contents: buildPrompt(message, context),
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: ASSISTANT_INTENT_SCHEMA,
          },
        });
        break;
      } catch (error) {
        if (attempts >= maxAttempts) {
          console.warn(
            "Gemini API call rate limited or failed, falling back to rule-based intent parsing.",
          );
          return generateFallbackIntent(message);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (!response || !response.text?.trim()) {
      return generateFallbackIntent(message);
    }

    const intent: unknown = JSON.parse(response.text);

    if (!isAssistantIntent(intent)) {
      return generateFallbackIntent(message);
    }

    return intent;
  } catch (error) {
    console.warn(
      "Falling back to local intent parser due to error:",
      error instanceof Error ? error.message : error,
    );
    return generateFallbackIntent(message);
  }
}
