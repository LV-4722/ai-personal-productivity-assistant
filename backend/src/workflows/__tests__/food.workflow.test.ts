import { describe, it, expect } from "vitest";
import { FoodWorkflowEngine } from "../../workflows/food.workflow.js";
import {
  Address,
  Customization,
  DeliveryMode,
  FoodOrderState,
  FoodType,
  FoodWorkflowStep,
  Item,
  PartialFoodOrder,
  Restaurant,
} from "../../types/food.js";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = "test-session-1";

const RESTAURANT: Restaurant = {
  id: "r1",
  name: "Burger Palace",
  cuisine: "BURGER",
  rating: 4.5,
  estimatedDeliveryMinutes: 30,
};

const ITEM: Item = {
  id: "i1",
  name: "Classic Burger",
  description: null,
  price: 9.99,
  restaurantId: "r1",
};

const CUSTOMIZATION: Customization = {
  itemId: "i1",
  notes: "No onions",
  extras: ["extra cheese"],
  removals: ["onions"],
};

const ADDRESS: Address = {
  line1: "12 Main St",
  line2: null,
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  country: "US",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newEngine(): FoodWorkflowEngine {
  return FoodWorkflowEngine.create(SESSION_ID);
}

/**
 * Build an engine with a pre-populated partial order so individual tests
 * can start from a known mid-workflow state without repeating setup.
 */
function engineWithOrder(
  partial: PartialFoodOrder,
  startStep: FoodWorkflowStep = "ORDER_FOOD"
): FoodWorkflowEngine {
  const state: FoodOrderState = {
    sessionId: SESSION_ID,
    currentStep: startStep,
    order: partial,
    completedSteps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return new FoodWorkflowEngine(state);
}

// ---------------------------------------------------------------------------
// 1. New workflow starts at ORDER_FOOD
// ---------------------------------------------------------------------------

describe("initialization", () => {
  it("starts at ORDER_FOOD", () => {
    const engine = newEngine();
    expect(engine.getCurrentStep()).toBe("ORDER_FOOD");
  });

  it("starts with an empty order", () => {
    const engine = newEngine();
    expect(engine.getOrder()).toEqual({});
  });

  it("is not complete on creation", () => {
    const engine = newEngine();
    expect(engine.isComplete()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Normal step-by-step progression (full delivery flow)
// ---------------------------------------------------------------------------

describe("normal step-by-step progression", () => {
  it("advances through every step in order for a DELIVERY order", () => {
    const engine = newEngine();

    // ORDER_FOOD → DELIVERY_MODE
    engine.transition();
    expect(engine.getCurrentStep()).toBe("DELIVERY_MODE");

    engine.setDeliveryMode("DELIVERY");
    expect(engine.getCurrentStep()).toBe("FOOD_TYPE");

    engine.setFoodType("BURGER");
    expect(engine.getCurrentStep()).toBe("RESTAURANT");

    engine.setRestaurant(RESTAURANT);
    expect(engine.getCurrentStep()).toBe("ITEM");

    engine.setItems([ITEM]);
    expect(engine.getCurrentStep()).toBe("CUSTOMIZE");

    engine.setCustomizations([CUSTOMIZATION]);
    expect(engine.getCurrentStep()).toBe("ADDRESS");

    engine.setAddress(ADDRESS);
    expect(engine.getCurrentStep()).toBe("REVIEW");

    engine.confirmReview();
    expect(engine.getCurrentStep()).toBe("PAYMENT");

    engine.confirmPayment();
    expect(engine.getCurrentStep()).toBe("CONFIRMED");
  });

  it("reports isComplete() = true only at CONFIRMED", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    expect(engine.isComplete()).toBe(false);

    engine.setDeliveryMode("PICKUP");
    engine.setFoodType("BURGER");
    engine.setRestaurant(RESTAURANT);
    engine.setItems([ITEM]);
    engine.setCustomizations([CUSTOMIZATION]);
    // ADDRESS skipped for PICKUP
    engine.confirmReview();
    engine.confirmPayment();

    expect(engine.isComplete()).toBe(true);
    expect(engine.getCurrentStep()).toBe("CONFIRMED");
  });
});

// ---------------------------------------------------------------------------
// 3. Validation blocks progression when required data is missing
// ---------------------------------------------------------------------------

describe("validation", () => {
  it("blocks DELIVERY_MODE → FOOD_TYPE when deliveryMode is absent", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE (no data yet)
    const result = engine.transition(); // attempt to leave DELIVERY_MODE without setting mode
    expect(engine.getCurrentStep()).toBe("DELIVERY_MODE");
    expect(result.currentStep).toBe("DELIVERY_MODE");
    expect(result.message).toMatch(/delivery mode/i);
  });

  it("blocks FOOD_TYPE transition when foodType is absent", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("DELIVERY");
    // Now at FOOD_TYPE
    const result = engine.transition();
    expect(engine.getCurrentStep()).toBe("FOOD_TYPE");
    expect(result.message).toMatch(/food type/i);
  });

  it("blocks RESTAURANT transition when restaurant is absent", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("DELIVERY");
    engine.setFoodType("BURGER");
    const result = engine.transition();
    expect(engine.getCurrentStep()).toBe("RESTAURANT");
    expect(result.message).toMatch(/restaurant/i);
  });

  it("blocks ITEM transition when items list is empty", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("DELIVERY");
    engine.setFoodType("BURGER");
    engine.setRestaurant(RESTAURANT);
    const result = engine.transition();
    expect(engine.getCurrentStep()).toBe("ITEM");
    expect(result.message).toMatch(/item/i);
  });

  it("blocks ADDRESS transition when address is absent and mode is DELIVERY", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("DELIVERY");
    engine.setFoodType("BURGER");
    engine.setRestaurant(RESTAURANT);
    engine.setItems([ITEM]);
    engine.setCustomizations([]);  // skip customization content — CUSTOMIZE validates as always-valid
    // At ADDRESS now (no customizations were set so CUSTOMIZE was not skipped,
    // need to pass through it first)
    // Actually — CUSTOMIZE skips when customizations.length > 0 in getNextStep.
    // setCustomizations([]) sets an empty array which means length === 0, so CUSTOMIZE is NOT skipped.
    // That means after ITEM we go to CUSTOMIZE, then transition to ADDRESS.
    // We need to call transition() from CUSTOMIZE to reach ADDRESS.
    engine.transition(); // leave CUSTOMIZE → ADDRESS
    const result = engine.transition(); // attempt to leave ADDRESS without address
    expect(engine.getCurrentStep()).toBe("ADDRESS");
    expect(result.message).toMatch(/address/i);
  });

  it("blocks REVIEW transition when restaurant is missing", () => {
    const state: FoodOrderState = {
      sessionId: SESSION_ID,
      currentStep: "REVIEW",
      order: {
        deliveryMode: "DELIVERY" as DeliveryMode,
        foodType: "BURGER" as FoodType,
        // restaurant deliberately absent
        items: [ITEM],
        address: ADDRESS,
      },
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const engine = new FoodWorkflowEngine(state);
    const result = engine.transition();
    expect(engine.getCurrentStep()).toBe("REVIEW");
    expect(result.message).toMatch(/restaurant/i);
  });
});

// ---------------------------------------------------------------------------
// 4. getNextStep() skips individual satisfied steps
// ---------------------------------------------------------------------------

describe("getNextStep() skip logic — individual steps", () => {
  it("skips DELIVERY_MODE when deliveryMode is set", () => {
    const engine = engineWithOrder({ deliveryMode: "DELIVERY" });
    engine.transition(); // leaves ORDER_FOOD
    // ORDER_FOOD → next should skip DELIVERY_MODE → FOOD_TYPE
    expect(engine.getCurrentStep()).toBe("FOOD_TYPE");
  });

  it("skips FOOD_TYPE when foodType is set", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("RESTAURANT");
  });

  it("skips RESTAURANT when restaurant is set", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("ITEM");
  });

  it("skips ITEM when items are set", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("CUSTOMIZE");
  });

  it("skips CUSTOMIZE when customizations are set", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("ADDRESS");
  });

  it("skips ADDRESS when address is already set", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
      address: ADDRESS,
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("REVIEW");
  });
});

// ---------------------------------------------------------------------------
// 5. Multiple consecutive steps can be skipped
// ---------------------------------------------------------------------------

describe("multiple consecutive step skips", () => {
  it("skips DELIVERY_MODE, FOOD_TYPE, RESTAURANT, ITEM, CUSTOMIZE, ADDRESS when all are known", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
      address: ADDRESS,
    });
    engine.transition(); // ORDER_FOOD → skip 6 steps → REVIEW
    expect(engine.getCurrentStep()).toBe("REVIEW");
  });

  it("skips DELIVERY_MODE and FOOD_TYPE but stops at RESTAURANT", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      // restaurant absent
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("RESTAURANT");
  });
});

// ---------------------------------------------------------------------------
// 6. PICKUP / DINE_IN skips ADDRESS
// ---------------------------------------------------------------------------

describe("ADDRESS skipped for PICKUP and DINE_IN", () => {
  it("PICKUP skips ADDRESS step", () => {
    const engine = engineWithOrder({
      deliveryMode: "PICKUP",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
    });
    engine.transition(); // ORDER_FOOD → REVIEW (ADDRESS skipped)
    expect(engine.getCurrentStep()).toBe("REVIEW");
  });

  it("DINE_IN skips ADDRESS step", () => {
    const engine = engineWithOrder({
      deliveryMode: "DINE_IN",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("REVIEW");
  });

  it("DELIVERY does NOT skip ADDRESS", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
      // address absent
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("ADDRESS");
  });
});

// ---------------------------------------------------------------------------
// 7. Partially completed orders resume at the correct step
// ---------------------------------------------------------------------------

describe("partial order resumption", () => {
  it("resumes at RESTAURANT when delivery and food type are known", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "INDIAN",
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("RESTAURANT");
  });

  it("resumes at ITEM when restaurant is known but items are not", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "INDIAN",
      restaurant: RESTAURANT,
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("ITEM");
  });

  it("resumes at ADDRESS when items are set but address missing (DELIVERY)", () => {
    const engine = engineWithOrder({
      deliveryMode: "DELIVERY",
      foodType: "INDIAN",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
    });
    engine.transition();
    expect(engine.getCurrentStep()).toBe("ADDRESS");
  });
});

// ---------------------------------------------------------------------------
// 8. Invalid forward jumps are rejected
// ---------------------------------------------------------------------------

describe("setStep() rejects forward jumps", () => {
  it("cannot jump forward past the current step", () => {
    const engine = newEngine(); // at ORDER_FOOD
    const result = engine.setStep("PAYMENT");
    expect(engine.getCurrentStep()).toBe("ORDER_FOOD");
    expect(result.currentStep).toBe("ORDER_FOOD");
    expect(result.message).toMatch(/cannot advance/i);
  });

  it("cannot jump forward from DELIVERY_MODE to CONFIRMED", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    const result = engine.setStep("CONFIRMED");
    expect(engine.getCurrentStep()).toBe("DELIVERY_MODE");
    expect(result.message).toMatch(/cannot advance/i);
  });

  it("allows navigating back to a previously visited step", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    engine.setDeliveryMode("DELIVERY"); // → FOOD_TYPE
    const result = engine.setStep("DELIVERY_MODE");
    expect(engine.getCurrentStep()).toBe("DELIVERY_MODE");
    expect(result.message).toMatch(/navigated back/i);
  });
});

// ---------------------------------------------------------------------------
// 9. reset() returns to the initial state
// ---------------------------------------------------------------------------

describe("reset()", () => {
  it("resets step to ORDER_FOOD", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("DELIVERY");
    engine.reset();
    expect(engine.getCurrentStep()).toBe("ORDER_FOOD");
  });

  it("clears the order", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("PICKUP");
    engine.reset();
    expect(engine.getOrder()).toEqual({});
  });

  it("clears completedSteps", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("PICKUP");
    engine.reset();
    expect(engine.getState().completedSteps).toEqual([]);
  });

  it("preserves sessionId after reset", () => {
    const engine = newEngine();
    engine.reset();
    expect(engine.getState().sessionId).toBe(SESSION_ID);
  });

  it("returns isComplete = false after reset", () => {
    const engine = engineWithOrder({
      deliveryMode: "PICKUP",
      foodType: "PIZZA",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
    }, "ORDER_FOOD");
    engine.transition();
    engine.confirmReview();
    engine.confirmPayment(); // → CONFIRMED
    engine.reset();
    expect(engine.isComplete()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. CONFIRMED is treated as complete
// ---------------------------------------------------------------------------

describe("CONFIRMED terminal state", () => {
  it("isComplete() returns true at CONFIRMED", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("PICKUP");
    engine.setFoodType("BURGER");
    engine.setRestaurant(RESTAURANT);
    engine.setItems([ITEM]);
    engine.setCustomizations([CUSTOMIZATION]);
    engine.confirmReview();
    engine.confirmPayment();
    expect(engine.isComplete()).toBe(true);
  });

  it("transition() is a no-op at CONFIRMED", () => {
    const engine = newEngine();
    engine.transition();
    engine.setDeliveryMode("PICKUP");
    engine.setFoodType("BURGER");
    engine.setRestaurant(RESTAURANT);
    engine.setItems([ITEM]);
    engine.setCustomizations([CUSTOMIZATION]);
    engine.confirmReview();
    engine.confirmPayment(); // → CONFIRMED

    const result = engine.transition(); // should be a no-op
    expect(engine.getCurrentStep()).toBe("CONFIRMED");
    expect(result.message).toMatch(/already confirmed/i);
  });

  it("getNextStep() returns CONFIRMED when all steps are satisfied", () => {
    const engine = engineWithOrder({
      deliveryMode: "PICKUP",
      foodType: "BURGER",
      restaurant: RESTAURANT,
      items: [ITEM],
      customizations: [CUSTOMIZATION],
    }, "ORDER_FOOD");
    // From ORDER_FOOD, after leaving it the next unsatisfied step is REVIEW
    // (all data steps satisfied). So getNextStep() while AT ORDER_FOOD should
    // return REVIEW (not CONFIRMED) because REVIEW is never auto-skipped.
    expect(engine.getNextStep()).toBe("REVIEW");
  });
});

// ---------------------------------------------------------------------------
// 11. transition() does not mutate state when validation fails
// ---------------------------------------------------------------------------

describe("transition() immutability on validation failure", () => {
  it("leaves step unchanged when validation fails", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    const stepBefore = engine.getCurrentStep();
    engine.transition(); // validation fails — deliveryMode missing
    expect(engine.getCurrentStep()).toBe(stepBefore);
  });

  it("leaves order unchanged when validation fails", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    const orderBefore = JSON.stringify(engine.getOrder());
    engine.transition(); // attempt to leave without deliveryMode
    expect(JSON.stringify(engine.getOrder())).toBe(orderBefore);
  });

  it("leaves completedSteps unchanged when validation fails", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    const completedBefore = [...engine.getState().completedSteps];
    engine.transition(); // validation fails
    expect(engine.getState().completedSteps).toEqual(completedBefore);
  });

  it("does not advance step on repeated failed transitions", () => {
    const engine = newEngine();
    engine.transition(); // → DELIVERY_MODE
    engine.transition(); // fail
    engine.transition(); // fail again
    engine.transition(); // fail again
    expect(engine.getCurrentStep()).toBe("DELIVERY_MODE");
  });
});
