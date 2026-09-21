import {
  Address,
  Customization,
  DeliveryMode,
  FoodOrderState,
  FoodType,
  FoodWorkflowResult,
  FoodWorkflowStep,
  Item,
  PartialFoodOrder,
  Restaurant,
} from "../types/food.js";

// ---------------------------------------------------------------------------
// Step ordering — the canonical sequence of the workflow.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Step satisfaction — a step is "satisfied" when the order already contains
// everything that step is responsible for collecting. Satisfied steps are
// skipped automatically during getNextStep().
//
// ORDER_FOOD and REVIEW are never auto-skipped:
//   ORDER_FOOD is the entry point — it must always be visited first.
//   REVIEW is intentionally shown every time so the user can confirm.
// PAYMENT and CONFIRMED are never auto-skipped: they represent terminal
//   actions, not data-collection steps.
// ---------------------------------------------------------------------------

function isStepSatisfied(
  step: FoodWorkflowStep,
  order: PartialFoodOrder
): boolean {
  switch (step) {
    case "ORDER_FOOD":
      return false;
    case "DELIVERY_MODE":
      return order.deliveryMode !== undefined;
    case "FOOD_TYPE":
      return order.foodType !== undefined;
    case "RESTAURANT":
      return order.restaurant !== undefined;
    case "ITEM":
      return order.items !== undefined && order.items.length > 0;
    case "CUSTOMIZE":
      return (
        order.customizations !== undefined && order.customizations.length > 0
      );
    case "ADDRESS":
      // Only required for DELIVERY mode. PICKUP and DINE_IN skip it.
      if (
        order.deliveryMode === "PICKUP" ||
        order.deliveryMode === "DINE_IN"
      ) {
        return true;
      }
      return order.address !== undefined;
    case "REVIEW":
      return false;
    case "PAYMENT":
      return false;
    case "CONFIRMED":
      return false;
  }
}

// ---------------------------------------------------------------------------
// Step validation — asserts that everything required to *leave* the current
// step is present. Called before a transition is committed.
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

function validateStep(
  step: FoodWorkflowStep,
  order: PartialFoodOrder
): ValidationResult {
  switch (step) {
    case "ORDER_FOOD":
      return { valid: true };

    case "DELIVERY_MODE":
      if (order.deliveryMode === undefined) {
        return { valid: false, reason: "Delivery mode is required." };
      }
      return { valid: true };

    case "FOOD_TYPE":
      if (order.foodType === undefined) {
        return { valid: false, reason: "Food type is required." };
      }
      return { valid: true };

    case "RESTAURANT":
      if (order.restaurant === undefined) {
        return { valid: false, reason: "A restaurant must be selected." };
      }
      return { valid: true };

    case "ITEM":
      if (order.items === undefined || order.items.length === 0) {
        return {
          valid: false,
          reason: "At least one item must be selected.",
        };
      }
      return { valid: true };

    case "CUSTOMIZE":
      // Customization is optional — the step can be exited without it.
      return { valid: true };

    case "ADDRESS":
      if (
        order.deliveryMode !== "PICKUP" &&
        order.deliveryMode !== "DINE_IN" &&
        order.address === undefined
      ) {
        return {
          valid: false,
          reason: "A delivery address is required.",
        };
      }
      return { valid: true };

    case "REVIEW":
      // Validate that all mandatory upstream data is present before payment.
      if (order.deliveryMode === undefined) {
        return { valid: false, reason: "Delivery mode is missing." };
      }
      if (order.restaurant === undefined) {
        return { valid: false, reason: "Restaurant is missing." };
      }
      if (order.items === undefined || order.items.length === 0) {
        return { valid: false, reason: "No items in order." };
      }
      if (
        order.deliveryMode === "DELIVERY" &&
        order.address === undefined
      ) {
        return { valid: false, reason: "Delivery address is missing." };
      }
      return { valid: true };

    case "PAYMENT":
      return { valid: true };

    case "CONFIRMED":
      return { valid: true };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stepIndex(step: FoodWorkflowStep): number {
  return STEP_ORDER.indexOf(step);
}

function isValidStep(value: string): value is FoodWorkflowStep {
  return (STEP_ORDER as string[]).includes(value);
}

function nowDate(): Date {
  return new Date();
}

function cloneOrder(order: PartialFoodOrder): PartialFoodOrder {
  return {
    ...order,
    ...(order.items !== undefined && { items: [...order.items] }),
    ...(order.customizations !== undefined && {
      customizations: order.customizations.map((c) => ({
        ...c,
        extras: [...c.extras],
        removals: [...c.removals],
      })),
    }),
  };
}

function toResult(state: FoodOrderState, message: string): FoodWorkflowResult {
  return {
    sessionId: state.sessionId,
    currentStep: state.currentStep,
    order: cloneOrder(state.order),
    message,
    isComplete: state.currentStep === "CONFIRMED",
  };
}

// ---------------------------------------------------------------------------
// FoodWorkflowEngine
//
// Owns a single FoodOrderState. All methods are synchronous and free of I/O.
// The caller (service layer) is responsible for persisting and restoring state.
// ---------------------------------------------------------------------------

export class FoodWorkflowEngine {
  private state: FoodOrderState;

  constructor(state: FoodOrderState) {
    this.state = { ...state, order: { ...state.order } };
  }

  // -------------------------------------------------------------------------
  // Factory — create a brand-new session.
  // -------------------------------------------------------------------------

  static create(sessionId: string): FoodWorkflowEngine {
    const now = nowDate();
    const initialState: FoodOrderState = {
      sessionId,
      currentStep: "ORDER_FOOD",
      order: {},
      completedSteps: [],
      createdAt: now,
      updatedAt: now,
    };
    return new FoodWorkflowEngine(initialState);
  }

  // -------------------------------------------------------------------------
  // Read-only accessors
  // -------------------------------------------------------------------------

  getState(): FoodOrderState {
    return {
      ...this.state,
      order: cloneOrder(this.state.order),
      completedSteps: [...this.state.completedSteps],
    };
  }

  getCurrentStep(): FoodWorkflowStep {
    return this.state.currentStep;
  }

  getOrder(): PartialFoodOrder {
    return cloneOrder(this.state.order);
  }

  isComplete(): boolean {
    return this.state.currentStep === "CONFIRMED";
  }

  // -------------------------------------------------------------------------
  // getNextStep()
  //
  // Starting from the step *after* the current one, returns the first step
  // that is not already satisfied, or "CONFIRMED" if all steps are done.
  // Does NOT mutate state — purely a query.
  // -------------------------------------------------------------------------

  getNextStep(): FoodWorkflowStep {
    const currentIndex = stepIndex(this.state.currentStep);

    for (let i = currentIndex + 1; i < STEP_ORDER.length; i++) {
      const candidate = STEP_ORDER[i];
      if (!isStepSatisfied(candidate, this.state.order)) {
        return candidate;
      }
    }

    return "CONFIRMED";
  }

  // -------------------------------------------------------------------------
  // validate()
  //
  // Validates the *current* step against the current order data.
  // Returns a ValidationResult — does NOT mutate state.
  // -------------------------------------------------------------------------

  validate(): ValidationResult {
    return validateStep(this.state.currentStep, this.state.order);
  }

  // -------------------------------------------------------------------------
  // updateOrder()
  //
  // Merges partial order data into the current order without advancing the
  // step. Callers may call this to stage data before calling transition().
  // -------------------------------------------------------------------------

  updateOrder(partial: Partial<PartialFoodOrder>): FoodWorkflowResult {
    this.state = {
      ...this.state,
      order: { ...this.state.order, ...partial },
      updatedAt: nowDate(),
    };

    return toResult(this.state, "Order updated.");
  }

  // -------------------------------------------------------------------------
  // transition()
  //
  // Validates the current step, marks it completed, then advances to the
  // next unsatisfied step (skipping any already-satisfied ones).
  //
  // Returns an error result if validation fails — state is not mutated.
  // -------------------------------------------------------------------------

  transition(): FoodWorkflowResult {
    if (this.state.currentStep === "CONFIRMED") {
      return toResult(this.state, "Order is already confirmed.");
    }

    const validation = validateStep(this.state.currentStep, this.state.order);

    if (!validation.valid) {
      return toResult(this.state, validation.reason);
    }

    const completedStep = this.state.currentStep;
    const nextStep = this.getNextStep();

    this.state = {
      ...this.state,
      currentStep: nextStep,
      completedSteps: [...this.state.completedSteps, completedStep],
      updatedAt: nowDate(),
    };

    const message =
      nextStep === "CONFIRMED"
        ? "Order confirmed."
        : `Moved to step: ${nextStep}.`;

    return toResult(this.state, message);
  }

  // -------------------------------------------------------------------------
  // setStep()
  //
  // Directly navigates to a specific step, provided it exists in the workflow
  // and has already been reached (i.e., its index <= current step index OR
  // it is the next logical step). Used for back-navigation and corrections.
  //
  // Does NOT re-validate the target step.
  // -------------------------------------------------------------------------

  setStep(step: FoodWorkflowStep): FoodWorkflowResult {
    if (!isValidStep(step)) {
      return toResult(this.state, `Unknown workflow step: ${step}.`);
    }

    const targetIndex = stepIndex(step);
    const currentIndex = stepIndex(this.state.currentStep);

    // Allow navigating to any step that has already been visited or is current.
    if (targetIndex > currentIndex) {
      return toResult(
        this.state,
        `Cannot advance directly to ${step}. Call transition() to move forward.`
      );
    }

    this.state = {
      ...this.state,
      currentStep: step,
      updatedAt: nowDate(),
    };

    return toResult(this.state, `Navigated back to step: ${step}.`);
  }

  // -------------------------------------------------------------------------
  // reset()
  //
  // Clears all order data and returns the engine to ORDER_FOOD.
  // Preserves the sessionId and createdAt timestamp.
  // -------------------------------------------------------------------------

  reset(): FoodWorkflowResult {
    this.state = {
      ...this.state,
      currentStep: "ORDER_FOOD",
      order: {},
      completedSteps: [],
      updatedAt: nowDate(),
    };

    return toResult(this.state, "Workflow reset. Starting over.");
  }

  // -------------------------------------------------------------------------
  // Typed setters — convenience methods that stage data for a specific step
  // and immediately call transition() so each step can be handled atomically.
  // -------------------------------------------------------------------------

  setDeliveryMode(mode: DeliveryMode): FoodWorkflowResult {
    this.updateOrder({ deliveryMode: mode });
    return this.transition();
  }

  setFoodType(foodType: FoodType): FoodWorkflowResult {
    this.updateOrder({ foodType });
    return this.transition();
  }

  setRestaurant(restaurant: Restaurant): FoodWorkflowResult {
    this.updateOrder({ restaurant });
    return this.transition();
  }

  setItems(items: Item[]): FoodWorkflowResult {
    this.updateOrder({ items });
    return this.transition();
  }

  setCustomizations(customizations: Customization[]): FoodWorkflowResult {
    this.updateOrder({ customizations });
    return this.transition();
  }

  setAddress(address: Address): FoodWorkflowResult {
    this.updateOrder({ address });
    return this.transition();
  }

  confirmReview(): FoodWorkflowResult {
    return this.transition();
  }

  confirmPayment(): FoodWorkflowResult {
    return this.transition();
  }
}
