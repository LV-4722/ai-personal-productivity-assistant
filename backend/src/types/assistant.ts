import { TaskPriority } from "./task.js";

export type AssistantAction =
  | "CREATE_TASK"
  | "LIST_TASKS"
  | "UPDATE_TASK"
  | "COMPLETE_TASK"
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

export interface UnknownIntent {
  action: "UNKNOWN";
}

export type AssistantIntent =
  | CreateTaskIntent
  | ListTasksIntent
  | UpdateTaskIntent
  | CompleteTaskIntent
  | UnknownIntent;

export interface AssistantContext {
  currentDateTime: string;
  timeZone: string;
}
