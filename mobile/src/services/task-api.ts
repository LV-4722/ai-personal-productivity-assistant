import { Task } from '@/types/task';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export async function getTasks(): Promise<Task[]> {
  if (!API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not configured. Set it in mobile/.env.local.',
    );
  }

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/tasks`);

  if (!response.ok) {
    throw new Error(`Unable to load tasks (${response.status} ${response.statusText}).`);
  }

  const tasks: unknown = await response.json();

  if (!Array.isArray(tasks)) {
    throw new Error('The tasks API returned an unexpected response.');
  }

  return tasks as Task[];
}
