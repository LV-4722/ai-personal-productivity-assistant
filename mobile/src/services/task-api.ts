import { CreateTaskInput, Task, UpdateTaskInput } from '@/types/task';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not configured. Set it in mobile/.env.local.',
    );
  }

  return API_BASE_URL.replace(/\/$/, '');
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
    ) {
      return body.message;
    }
  } catch {
    // Some error responses do not contain JSON.
  }

  return `Request failed (${response.status} ${response.statusText}).`;
}

async function getTaskResponse(response: Response): Promise<Task> {
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as Task;
}

export async function getTasks(): Promise<Task[]> {
  const response = await fetch(`${getApiBaseUrl()}/tasks`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const tasks: unknown = await response.json();

  if (!Array.isArray(tasks)) {
    throw new Error('The tasks API returned an unexpected response.');
  }

  return tasks as Task[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(`${getApiBaseUrl()}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return getTaskResponse(response);
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  const response = await fetch(`${getApiBaseUrl()}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return getTaskResponse(response);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/tasks/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}
