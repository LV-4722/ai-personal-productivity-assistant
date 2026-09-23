import { Platform } from 'react-native';

import { FoodApiResponse, FoodWorkflowStep, PartialFoodOrder } from '@/types/food';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not configured. Set it in mobile/.env.local.',
    );
  }

  let url = API_BASE_URL.replace(/\/$/, '');
  if (Platform.OS === 'android') {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return url;
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
    // Ignore JSON parse failures
  }

  return `Request failed (${response.status} ${response.statusText}).`;
}

export async function createOrGetFoodSession(
  sessionId?: string,
  initialOrder?: PartialFoodOrder,
): Promise<FoodApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}/food/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, initialOrder }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as FoodApiResponse;
}

export async function advanceFoodStep(
  sessionId: string,
  data?: PartialFoodOrder,
): Promise<FoodApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}/food/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, data }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as FoodApiResponse;
}

export async function stepBackFoodSession(
  sessionId: string,
  targetStep?: FoodWorkflowStep,
): Promise<FoodApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}/food/back`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, targetStep }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as FoodApiResponse;
}

export async function resetFoodSession(sessionId: string): Promise<FoodApiResponse> {
  const response = await fetch(`${getApiBaseUrl()}/food/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as FoodApiResponse;
}
