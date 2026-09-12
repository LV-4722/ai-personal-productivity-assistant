import { Request, Response } from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../services/task.service.js";
import {
  CreateTaskInput,
  TaskPriority,
  UpdateTaskInput,
} from "../types/task.js";

const VALID_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
];

function isValidPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    VALID_PRIORITIES.includes(value as TaskPriority)
  );
}

function parseTaskId(
  value: string | string[]
): number | null {
  if (Array.isArray(value)) {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function createTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { title, description, priority, due_date } = req.body;

    if (typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({
        message: "Title is required",
      });
      return;
    }

    if (priority !== undefined && !isValidPriority(priority)) {
      res.status(400).json({
        message: "Priority must be LOW, MEDIUM, or HIGH",
      });
      return;
    }

    let parsedDueDate: Date | null | undefined;

    if (due_date !== undefined && due_date !== null) {
      const date = new Date(due_date);

      if (Number.isNaN(date.getTime())) {
        res.status(400).json({
          message: "Invalid due_date",
        });
        return;
      }

      parsedDueDate = date;
    }

    const input: CreateTaskInput = {
      title: title.trim(),
      description:
        description === undefined || description === null
          ? null
          : String(description),
      priority,
      due_date: parsedDueDate,
    };

    const task = await createTask(input);

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);

    res.status(500).json({
      message: "Failed to create task",
    });
  }
}

export async function getTasksController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const tasks = await getTasks();

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);

    res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
}

export async function getTaskByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = parseTaskId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "Invalid task ID",
      });
      return;
    }

    const task = await getTaskById(id);

    if (!task) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error fetching task:", error);

    res.status(500).json({
      message: "Failed to fetch task",
    });
  }
}

export async function updateTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = parseTaskId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "Invalid task ID",
      });
      return;
    }

    const {
      title,
      description,
      priority,
      due_date,
      completed,
    } = req.body;

    if (
      title !== undefined &&
      (typeof title !== "string" || title.trim().length === 0)
    ) {
      res.status(400).json({
        message: "Title must be a non-empty string",
      });
      return;
    }

    if (priority !== undefined && !isValidPriority(priority)) {
      res.status(400).json({
        message: "Priority must be LOW, MEDIUM, or HIGH",
      });
      return;
    }

    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      res.status(400).json({
        message: "Completed must be a boolean",
      });
      return;
    }

    let parsedDueDate: Date | null | undefined;

    if (due_date !== undefined && due_date !== null) {
      const date = new Date(due_date);

      if (Number.isNaN(date.getTime())) {
        res.status(400).json({
          message: "Invalid due_date",
        });
        return;
      }

      parsedDueDate = date;
    } else if (due_date === null) {
      parsedDueDate = null;
    }

    const input: UpdateTaskInput = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && {
        description:
          description === null ? null : String(description),
      }),
      ...(priority !== undefined && { priority }),
      ...(due_date !== undefined && {
        due_date: parsedDueDate,
      }),
      ...(completed !== undefined && { completed }),
    };

    const task = await updateTask(id, input);

    if (!task) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task:", error);

    res.status(500).json({
      message: "Failed to update task",
    });
  }
}

export async function deleteTaskController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = parseTaskId(req.params.id);

    if (id === null) {
      res.status(400).json({
        message: "Invalid task ID",
      });
      return;
    }

    const deleted = await deleteTask(id);

    if (!deleted) {
      res.status(404).json({
        message: "Task not found",
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting task:", error);

    res.status(500).json({
      message: "Failed to delete task",
    });
  }
}