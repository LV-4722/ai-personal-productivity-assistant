import { TaskPriority } from "./task.js";

export type AssistantAction =
  | "CREATE_TASK"
  | "LIST_TASKS"
  | "UPDATE_TASK"
  | "COMPLETE_TASK"
  | "ORDER_FOOD"
  | "UNKNOWN";

export interface CreateTaskIntent {
  action: "CREATE_TASK";
  task: {
    title: string;
    description: string | null;
    priority: TaskPriority;
    due_date: string | null;
  };
}

export interface ListTasksIntent {
  action: "LIST_TASKS";
  filter: {
    due_date: string | null;
    completed: boolean | null;
    priority: TaskPriority | null;
  };
}

export interface CompleteTaskIntent {
  action: "COMPLETE_TASK";
  task_reference: {
    title: string;
  };
}

export interface UpdateTaskIntent {
  action: "UPDATE_TASK";
  task_reference: {
    title: string;
  };
  updates: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    due_date?: string | null;
  };
}

export interface OrderFoodIntent {
  action: "ORDER_FOOD";
  food_order: {
    item_name?: string | null;
    food_type?: string | null;
    delivery_mode?: "DELIVERY" | "PICKUP" | "DINE_IN" | null;
    quantity?: number | null;
    restaurant_name?: string | null;
  };
}

export interface UnknownIntent {
  action: "UNKNOWN";
}

export type AssistantIntent =
  | CreateTaskIntent
  | ListTasksIntent
  | UpdateTaskIntent
  | CompleteTaskIntent
  | OrderFoodIntent
  | UnknownIntent;

export interface AssistantContext {
  currentDateTime: string;
  timeZone: string;
}
