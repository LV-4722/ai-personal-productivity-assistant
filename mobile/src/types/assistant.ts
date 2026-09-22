import { FoodApiResponse } from './food';

export type AssistantAction =
  | 'CREATE_TASK'
  | 'LIST_TASKS'
  | 'UPDATE_TASK'
  | 'COMPLETE_TASK'
  | 'ORDER_FOOD'
  | 'UNKNOWN';

export interface AssistantIntent {
  action: AssistantAction;
}

export interface AssistantTask {
  id: number;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  due_date: string | null;
  completed: boolean;
}

export interface AssistantResponse {
  intent: AssistantIntent;
  message: string;
  task?: AssistantTask;
  tasks?: AssistantTask[];
  foodSession?: FoodApiResponse;
}
