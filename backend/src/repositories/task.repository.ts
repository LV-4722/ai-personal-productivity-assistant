import { pool } from "../db.js";
import {
  CreateTaskInput,
  Task,
  UpdateTaskInput,
} from "../types/task.js";

export async function createTask(
  input: CreateTaskInput
): Promise<Task> {
  const result = await pool.query<Task>(
    `
      INSERT INTO tasks (
        title,
        description,
        priority,
        due_date
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      input.title,
      input.description ?? null,
      input.priority ?? "MEDIUM",
      input.due_date ?? null,
    ]
  );

  return result.rows[0];
}

export async function getTasks(): Promise<Task[]> {
  const result = await pool.query<Task>(
    `
      SELECT *
      FROM tasks
      ORDER BY completed ASC, due_date ASC NULLS LAST, created_at DESC
    `
  );

  return result.rows;
}

export async function getTaskById(
  id: number
): Promise<Task | null> {
  const result = await pool.query<Task>(
    `
      SELECT *
      FROM tasks
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function updateTask(
  id: number,
  input: UpdateTaskInput
): Promise<Task | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    fields.push(`title = $${values.length + 1}`);
    values.push(input.title);
  }

  if (input.description !== undefined) {
    fields.push(`description = $${values.length + 1}`);
    values.push(input.description);
  }

  if (input.priority !== undefined) {
    fields.push(`priority = $${values.length + 1}`);
    values.push(input.priority);
  }

  if (input.due_date !== undefined) {
    fields.push(`due_date = $${values.length + 1}`);
    values.push(input.due_date);
  }

  if (input.completed !== undefined) {
    fields.push(`completed = $${values.length + 1}`);
    values.push(input.completed);
  }

  if (fields.length === 0) {
    return getTaskById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(id);

  const result = await pool.query<Task>(
    `
      UPDATE tasks
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteTask(
  id: number
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM tasks
      WHERE id = $1
    `,
    [id]
  );

  return result.rowCount === 1;
}