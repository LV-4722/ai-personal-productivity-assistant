import {
  createTask as createTaskRepository,
  getTasks as getTasksRepository,
  getTaskById as getTaskByIdRepository,
  updateTask as updateTaskRepository,
  deleteTask as deleteTaskRepository,
} from "../repositories/task.repository.js";

import {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from "../types/task.js";

export async function createTask(
  input: CreateTaskInput
): Promise<Task> {
  return createTaskRepository(input);
}

export async function getTasks(): Promise<Task[]> {
  return getTasksRepository();
}

export async function getTaskById(
  id: number
): Promise<Task | null> {
  return getTaskByIdRepository(id);
}

export async function updateTask(
  id: number,
  input: UpdateTaskInput
): Promise<Task | null> {
  return updateTaskRepository(id, input);
}

export async function deleteTask(
  id: number
): Promise<boolean> {
  return deleteTaskRepository(id);
}