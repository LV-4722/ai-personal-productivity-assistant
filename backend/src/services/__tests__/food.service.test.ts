import { beforeEach, describe, expect, it } from "vitest";
import {
  advanceFoodStep,
  clearAllFoodSessions,
  createOrGetFoodSession,
  resetFoodSession,
  stepBackFoodSession,
} from "../food.service.js";
import { Restaurant, Item, Customization, Address, PaymentMethod } from "../../types/food.js";

const RESTAURANT: Restaurant = {
  id: "rest-1",
  name: "Burger Haven",
  cuisine: "BURGER",
  rating: 4.6,
  estimatedDeliveryMinutes: 25,
};

const ITEM: Item = {
  id: "item-1",
  name: "Classic Cheeseburger",
  description: null,
  price: 9.99,
  restaurantId: "rest-1",
};

const CUSTOMIZATION: Customization = {
  itemId: "item-1",
  notes: "Extra sauce",
  extras: ["Extra Cheese"],
  removals: [],
};

const ADDRESS: Address = {
  line1: "123 Tech Park Ave",
  line2: null,
  city: "San Francisco",
  state: "CA",
  postalCode: "94107",
  country: "US",
};

const PAYMENT_METHOD: PaymentMethod = {
  id: "pay-1",
  name: "Visa ending in 4242",
  type: "CREDIT_CARD",
};

describe("FoodService API & Session Store", () => {
  beforeEach(() => {
    clearAllFoodSessions();
  });

  it("creates a new session at ORDER_FOOD when no initial order is provided", () => {
    const res = createOrGetFoodSession("session-1");
    expect(res.sessionId).toBe("session-1");
    expect(res.currentStep).toBe("ORDER_FOOD");
    expect(res.order).toEqual({});
    expect(res.isComplete).toBe(false);
  });

  it("verifies 'I want chicken biryani delivered' skips DELIVERY_MODE and FOOD_TYPE to reach RESTAURANT directly", () => {
    const res = createOrGetFoodSession("biryani-session", {
      deliveryMode: "DELIVERY",
      foodType: "INDIAN",
    });

    expect(res.sessionId).toBe("biryani-session");
    expect(res.currentStep).toBe("RESTAURANT");
    expect(res.order.deliveryMode).toBe("DELIVERY");
    expect(res.order.foodType).toBe("INDIAN");
    expect(res.options.restaurants).toBeDefined();
    expect(res.options.restaurants?.length).toBeGreaterThan(0);
    expect(res.options.restaurants![0].cuisine).toBe("INDIAN");
    expect(res.isComplete).toBe(false);
  });

  it("advances step through workflow when step data is provided", () => {
    // 1. Session start
    let res = createOrGetFoodSession("adv-session");
    expect(res.currentStep).toBe("ORDER_FOOD");

    // 2. Advance from ORDER_FOOD -> DELIVERY_MODE
    res = advanceFoodStep("adv-session");
    expect(res.currentStep).toBe("DELIVERY_MODE");

    // 3. Set DELIVERY mode -> FOOD_TYPE
    res = advanceFoodStep("adv-session", { deliveryMode: "DELIVERY" });
    expect(res.currentStep).toBe("FOOD_TYPE");

    // 4. Set BURGER food type -> RESTAURANT
    res = advanceFoodStep("adv-session", { foodType: "BURGER" });
    expect(res.currentStep).toBe("RESTAURANT");
    expect(res.options.restaurants).toBeDefined();

    // 5. Select restaurant -> ITEM
    res = advanceFoodStep("adv-session", { restaurant: RESTAURANT });
    expect(res.currentStep).toBe("ITEM");
    expect(res.options.items).toBeDefined();

    // 6. Select items -> CUSTOMIZE
    res = advanceFoodStep("adv-session", { items: [ITEM] });
    expect(res.currentStep).toBe("CUSTOMIZE");
    expect(res.options.customizations).toBeDefined();

    // 7. Select customizations -> ADDRESS
    res = advanceFoodStep("adv-session", { customizations: [CUSTOMIZATION] });
    expect(res.currentStep).toBe("ADDRESS");
    expect(res.options.addresses).toBeDefined();

    // 8. Select address -> REVIEW
    res = advanceFoodStep("adv-session", { address: ADDRESS });
    expect(res.currentStep).toBe("REVIEW");

    // 9. Confirm review -> PAYMENT
    res = advanceFoodStep("adv-session");
    expect(res.currentStep).toBe("PAYMENT");
    expect(res.options.paymentMethods).toBeDefined();

    // 10. Confirm payment -> CONFIRMED
    res = advanceFoodStep("adv-session", { paymentMethod: PAYMENT_METHOD });
    expect(res.currentStep).toBe("CONFIRMED");
    expect(res.isComplete).toBe(true);
    expect(res.confirmation).toBeDefined();
    expect(res.confirmation?.restaurant.name).toBe("Burger Haven");
  });

  it("verifies step back navigation works", () => {
    createOrGetFoodSession("back-session", {
      deliveryMode: "DELIVERY",
      foodType: "INDIAN",
    });

    // Currently at RESTAURANT
    let res = stepBackFoodSession("back-session");
    // Steps back to FOOD_TYPE
    expect(res.currentStep).toBe("FOOD_TYPE");

    // Target step navigation back to DELIVERY_MODE
    res = stepBackFoodSession("back-session", "DELIVERY_MODE");
    expect(res.currentStep).toBe("DELIVERY_MODE");
  });

  it("verifies session reset works", () => {
    createOrGetFoodSession("reset-session", {
      deliveryMode: "DELIVERY",
      foodType: "INDIAN",
    });

    let res = resetFoodSession("reset-session");
    expect(res.currentStep).toBe("ORDER_FOOD");
    expect(res.order).toEqual({});
    expect(res.isComplete).toBe(false);
  });

  it("throws error for non-existent session ID", () => {
    expect(() => advanceFoodStep("non-existent")).toThrow(/not found/i);
    expect(() => stepBackFoodSession("non-existent")).toThrow(/not found/i);
    expect(() => resetFoodSession("non-existent")).toThrow(/not found/i);
  });
});
