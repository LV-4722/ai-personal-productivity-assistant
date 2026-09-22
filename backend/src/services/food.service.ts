import { FoodWorkflowEngine } from "../workflows/food.workflow.js";
import { FoodMockService } from "./food-mock.service.js";
import {
  CustomizationOption,
  FoodOrderConfirmation,
  FoodWorkflowStep,
  Item,
  PartialFoodOrder,
  PaymentMethod,
  Restaurant,
  Address,
} from "../types/food.js";

const STEP_ORDER: FoodWorkflowStep[] = [
  "ORDER_FOOD",
  "DELIVERY_MODE",
  "FOOD_TYPE",
  "RESTAURANT",
  "ITEM",
  "CUSTOMIZE",
  "ADDRESS",
  "REVIEW",
  "PAYMENT",
  "CONFIRMED",
];

export interface FoodApiResponse {
  sessionId: string;
  currentStep: FoodWorkflowStep;
  order: PartialFoodOrder;
  options: {
    restaurants?: Restaurant[];
    items?: Item[];
    customizations?: CustomizationOption[];
    addresses?: Address[];
    paymentMethods?: PaymentMethod[];
  };
  message: string;
  isComplete: boolean;
  confirmation?: FoodOrderConfirmation;
}

// In-memory session store mapping session IDs to FoodWorkflowEngine instances
const sessionStore = new Map<string, FoodWorkflowEngine>();

export function buildFoodApiResponse(
  engine: FoodWorkflowEngine,
  message: string
): FoodApiResponse {
  const state = engine.getState();
  const options = FoodMockService.getOptionsForCurrentStep(engine);

  return {
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    order: state.order,
    options,
    message,
    isComplete: engine.isComplete(),
    ...(state.confirmation && { confirmation: state.confirmation }),
  };
}

export function clearAllFoodSessions(): void {
  sessionStore.clear();
}

export function createOrGetFoodSession(
  sessionId?: string,
  initialOrder?: PartialFoodOrder
): FoodApiResponse {
  let engine: FoodWorkflowEngine;
  let isNew = false;

  if (sessionId && sessionStore.has(sessionId)) {
    engine = sessionStore.get(sessionId)!;
  } else {
    const id =
      sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    engine = FoodWorkflowEngine.create(id);
    sessionStore.set(id, engine);
    isNew = true;
  }

  let message = isNew ? "Session started." : "Session retrieved.";

  if (initialOrder && Object.keys(initialOrder).length > 0) {
    engine.updateOrder(initialOrder);
    if (engine.getCurrentStep() === "ORDER_FOOD") {
      const result = engine.transition();
      message = result.message;
    } else {
      message = "Order updated.";
    }
  }

  return buildFoodApiResponse(engine, message);
}

export function advanceFoodStep(
  sessionId: string,
  data?: PartialFoodOrder
): FoodApiResponse {
  const engine = sessionStore.get(sessionId);

  if (!engine) {
    throw new Error(`Food session "${sessionId}" not found.`);
  }

  if (data && Object.keys(data).length > 0) {
    engine.updateOrder(data);
  }

  const result = engine.transition();
  return buildFoodApiResponse(engine, result.message);
}

export function stepBackFoodSession(
  sessionId: string,
  targetStep?: FoodWorkflowStep
): FoodApiResponse {
  const engine = sessionStore.get(sessionId);

  if (!engine) {
    throw new Error(`Food session "${sessionId}" not found.`);
  }

  let stepToNavigate = targetStep;

  if (!stepToNavigate) {
    const currentIndex = STEP_ORDER.indexOf(engine.getCurrentStep());
    const prevIndex = Math.max(0, currentIndex - 1);
    stepToNavigate = STEP_ORDER[prevIndex];
  }

  const result = engine.setStep(stepToNavigate);
  return buildFoodApiResponse(engine, result.message);
}

export function resetFoodSession(sessionId: string): FoodApiResponse {
  const engine = sessionStore.get(sessionId);

  if (!engine) {
    throw new Error(`Food session "${sessionId}" not found.`);
  }

  const result = engine.reset();
  return buildFoodApiResponse(engine, result.message);
}
