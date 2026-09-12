import {
  generateAssistantIntent,
  getApplicationTimeZone,
} from "../providers/gemini.provider.js";
import {
  createTask,
  getTasks,
  updateTask,
} from "./task.service.js";
import { AssistantIntent } from "../types/assistant.js";
import { Task } from "../types/task.js";

export interface AssistantServiceResult {
  intent: AssistantIntent;
  message: string;
  task?: Task;
  tasks?: Task[];
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
      (task) => normalizeTitle(task.title) === reference,
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

  return {
    intent,
    message: "I couldn't determine how to help with that request.",
  };
}
