import {
  generateAssistantIntent,
  getApplicationTimeZone,
} from "../providers/gemini.provider.js";
import {
  createTask,
  getTasks,
  updateTask,
} from "./task.service.js";
import {
  advanceFoodStep,
  createOrGetFoodSession,
  FoodApiResponse,
} from "./food.service.js";
import { FoodMockService } from "./food-mock.service.js";
import { AssistantIntent, OrderFoodIntent } from "../types/assistant.js";
import { FoodType, PartialFoodOrder } from "../types/food.js";
import { Task, UpdateTaskInput } from "../types/task.js";

export interface AssistantServiceResult {
  intent: AssistantIntent;
  message: string;
  task?: Task;
  tasks?: Task[];
  foodSession?: FoodApiResponse;
}

const CANONICAL_FOOD_TYPES: FoodType[] = [
  "PIZZA",
  "BURGER",
  "SUSHI",
  "INDIAN",
  "CHINESE",
  "MEXICAN",
  "ITALIAN",
  "THAI",
  "MEDITERRANEAN",
  "FAST_FOOD",
  "HEALTHY",
  "DESSERT",
  "OTHER",
];

function normalizeFoodType(value: string): FoodType | null {
  const normalized = value.trim().toUpperCase().replace(/[-\s]+/g, "_");
  const match = CANONICAL_FOOD_TYPES.find((ft) => ft === normalized);
  return match ?? null;
}

export function mapOrderFoodIntentToPartialOrder(
  intent: OrderFoodIntent,
): PartialFoodOrder {
  const foodOrder = intent.food_order;
  const partialOrder: PartialFoodOrder = {};

  if (!foodOrder) {
    return partialOrder;
  }

  if (
    foodOrder.delivery_mode === "DELIVERY" ||
    foodOrder.delivery_mode === "PICKUP" ||
    foodOrder.delivery_mode === "DINE_IN"
  ) {
    partialOrder.deliveryMode = foodOrder.delivery_mode;
  }

  if (typeof foodOrder.food_type === "string" && foodOrder.food_type.trim()) {
    const canonical = normalizeFoodType(foodOrder.food_type);
    if (canonical) {
      partialOrder.foodType = canonical;
    }
  }

  if (
    typeof foodOrder.restaurant_name === "string" &&
    foodOrder.restaurant_name.trim()
  ) {
    const restaurant = FoodMockService.findRestaurantByName(
      foodOrder.restaurant_name,
    );
    if (restaurant) {
      partialOrder.restaurant = restaurant;
      if (!partialOrder.foodType) {
        partialOrder.foodType = restaurant.cuisine;
      }
    }
  }

  if (typeof foodOrder.item_name === "string" && foodOrder.item_name.trim()) {
    const item = FoodMockService.findItemByName(
      foodOrder.item_name,
      partialOrder.restaurant?.id,
    );
    if (item) {
      partialOrder.items = [item];
      if (!partialOrder.restaurant) {
        const restaurant = FoodMockService.findRestaurantById(
          item.restaurantId,
        );
        if (restaurant) {
          partialOrder.restaurant = restaurant;
          if (!partialOrder.foodType) {
            partialOrder.foodType = restaurant.cuisine;
          }
        }
      }
    }
  }

  return partialOrder;
}

function parseDueDate(value: string | null): Date | null {
  if (value === null) {
    return null;
  }

  const dueDate = new Date(value);

  if (Number.isNaN(dueDate.getTime())) {
    throw new Error("Assistant returned an invalid task due date.");
  }

  return dueDate;
}

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase();
}

function matchesTaskReference(taskTitle: string, reference: string): boolean {
  const normalizedTitle = normalizeTitle(taskTitle);

  return (
    normalizedTitle === reference ||
    normalizedTitle.startsWith(`${reference} `)
  );
}

function getCalendarDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function isDueOnDate(task: Task, dueDate: Date, timeZone: string): boolean {
  return (
    task.due_date !== null &&
    getCalendarDate(task.due_date, timeZone) ===
      getCalendarDate(dueDate, timeZone)
  );
}

export async function handleAssistantMessage(
  message: string,
  sessionId?: string,
): Promise<AssistantServiceResult> {
  if (message.trim().length === 0) {
    throw new Error("Assistant message is required.");
  }

  const intent = await generateAssistantIntent(message.trim());

  if (intent.action === "CREATE_TASK") {
    const title = intent.task.title.trim();

    if (title.length === 0) {
      throw new Error("Assistant returned a task without a title.");
    }

    const task = await createTask({
      title,
      description: intent.task.description,
      priority: intent.task.priority,
      due_date: parseDueDate(intent.task.due_date),
    });

    return {
      intent,
      message: `Created task: ${task.title}`,
      task,
    };
  }

  if (intent.action === "LIST_TASKS") {
    const filterDueDate = parseDueDate(intent.filter.due_date);
    const timeZone = getApplicationTimeZone();
    const tasks = await getTasks();
    const filteredTasks = tasks.filter(
      (task) =>
        (intent.filter.completed === null ||
          task.completed === intent.filter.completed) &&
        (intent.filter.priority === null ||
          task.priority === intent.filter.priority) &&
        (filterDueDate === null ||
          isDueOnDate(task, filterDueDate, timeZone)),
    );

    return {
      intent,
      message:
        filteredTasks.length === 0
          ? "No tasks match that request."
          : `Found ${filteredTasks.length} task${
              filteredTasks.length === 1 ? "" : "s"
            }.`,
      tasks: filteredTasks,
    };
  }

  if (intent.action === "COMPLETE_TASK") {
    const reference = normalizeTitle(intent.task_reference.title);

    if (reference.length === 0) {
      throw new Error("Assistant returned a task reference without a title.");
    }

    const tasks = await getTasks();
    const matches = tasks.filter(
      (task) => matchesTaskReference(task.title, reference),
    );

    if (matches.length === 0) {
      return {
        intent,
        message: `No task found with the title "${intent.task_reference.title}".`,
      };
    }

    if (matches.length > 1) {
      return {
        intent,
        message: `More than one task matches "${intent.task_reference.title}". Please be more specific.`,
      };
    }

    const task = await updateTask(matches[0].id, { completed: true });

    if (!task) {
      return {
        intent,
        message: "The matching task is no longer available.",
      };
    }

    return {
      intent,
      message: `Completed task: ${task.title}`,
      task,
    };
  }

  if (intent.action === "UPDATE_TASK") {
    const reference = normalizeTitle(intent.task_reference.title);
    const tasks = await getTasks();
    const matches = tasks.filter(
      (task) => matchesTaskReference(task.title, reference),
    );

    if (matches.length === 0) {
      return {
        intent,
        message: `No task found with the title "${intent.task_reference.title}".`,
      };
    }

    if (matches.length > 1) {
      return {
        intent,
        message: `More than one task matches "${intent.task_reference.title}". Please be more specific.`,
      };
    }

    const input: UpdateTaskInput = {
      ...(intent.updates.title !== undefined && {
        title: intent.updates.title.trim(),
      }),
      ...(intent.updates.description !== undefined && {
        description: intent.updates.description,
      }),
      ...(intent.updates.priority !== undefined && {
        priority: intent.updates.priority,
      }),
      ...(intent.updates.due_date !== undefined && {
        due_date: parseDueDate(intent.updates.due_date),
      }),
    };

    const task = await updateTask(matches[0].id, input);

    if (!task) {
      return {
        intent,
        message: "The matching task is no longer available.",
      };
    }

    return {
      intent,
      message: `Updated task: ${task.title}`,
      task,
    };
  }

  if (intent.action === "ORDER_FOOD") {
    const partialOrder = mapOrderFoodIntentToPartialOrder(intent);
    let foodSession = createOrGetFoodSession(sessionId, partialOrder);

    if (foodSession.currentStep === "ORDER_FOOD") {
      foodSession = advanceFoodStep(foodSession.sessionId);
    }

    return {
      intent,
      message: foodSession.message,
      foodSession,
    };
  }

  return {
    intent,
    message: "I couldn't determine how to help with that request.",
  };
}
