import { TaskPriority } from "./task.js";

export type AssistantAction =
  | "CREATE_TASK"
  | "LIST_TASKS"
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
  };
}

export interface CompleteTaskIntent {
  action: "COMPLETE_TASK";
  task_reference: {
    title: string;
  };
}

export interface UnknownIntent {
  action: "UNKNOWN";
}

export type AssistantIntent =
  | CreateTaskIntent
  | ListTasksIntent
  | CompleteTaskIntent
  | UnknownIntent;

export interface AssistantContext {
  currentDateTime: string;
  timeZone: string;
}
