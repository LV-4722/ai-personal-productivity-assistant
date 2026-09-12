import { AssistantResponse } from '@/types/assistant';

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

export async function sendAssistantMessage(message: string): Promise<AssistantResponse> {
  const response = await fetch(`${getApiBaseUrl()}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body: unknown = await response.json();

  if (
    typeof body !== 'object' ||
    body === null ||
    !('message' in body) ||
    typeof body.message !== 'string' ||
    !('intent' in body) ||
    typeof body.intent !== 'object' ||
    body.intent === null ||
    !('action' in body.intent) ||
    typeof body.intent.action !== 'string'
  ) {
    throw new Error('The assistant API returned an unexpected response.');
  }

  return body as AssistantResponse;
}
