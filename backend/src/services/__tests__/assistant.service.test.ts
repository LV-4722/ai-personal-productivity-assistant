import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  handleAssistantMessage,
  mapOrderFoodIntentToPartialOrder,
} from "../assistant.service.js";
import * as geminiProvider from "../../providers/gemini.provider.js";
import { clearAllFoodSessions } from "../food.service.js";
import { OrderFoodIntent } from "../../types/assistant.js";

vi.mock("../../providers/gemini.provider.js", async (importOriginal) => {
  const actual = await importOriginal<typeof geminiProvider>();
  return {
    ...actual,
    generateAssistantIntent: vi.fn(),
  };
});

describe("assistant.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllFoodSessions();
  });

  describe("mapOrderFoodIntentToPartialOrder", () => {
    it("should map delivery_mode DELIVERY accurately", () => {
      const intent: OrderFoodIntent = {
        action: "ORDER_FOOD",
        food_order: {
          delivery_mode: "DELIVERY",
          food_type: null,
          item_name: null,
          quantity: null,
          restaurant_name: null,
        },
      };

      const result = mapOrderFoodIntentToPartialOrder(intent);
      expect(result).toEqual({ deliveryMode: "DELIVERY" });
    });

    it("should map canonical food_type like 'INDIAN' or 'burger'", () => {
      const intent: OrderFoodIntent = {
        action: "ORDER_FOOD",
        food_order: {
          food_type: "burger",
          delivery_mode: null,
          item_name: null,
          quantity: null,
          restaurant_name: null,
        },
      };

      const result = mapOrderFoodIntentToPartialOrder(intent);
      expect(result).toEqual({ foodType: "BURGER" });
    });

    it("should map restaurant_name and infer cuisine foodType", () => {
      const intent: OrderFoodIntent = {
        action: "ORDER_FOOD",
        food_order: {
          restaurant_name: "Burger Haven",
          delivery_mode: null,
          food_type: null,
          item_name: null,
          quantity: null,
        },
      };

      const result = mapOrderFoodIntentToPartialOrder(intent);
      expect(result.restaurant?.name).toBe("Burger Haven");
      expect(result.foodType).toBe("BURGER");
    });

    it("should map item_name and infer restaurant and foodType", () => {
      const intent: OrderFoodIntent = {
        action: "ORDER_FOOD",
        food_order: {
          item_name: "Margherita Pizza",
          delivery_mode: null,
          food_type: null,
          quantity: null,
          restaurant_name: null,
        },
      };

      const result = mapOrderFoodIntentToPartialOrder(intent);
      expect(result.items?.[0].name).toBe("Margherita Pizza");
      expect(result.restaurant?.name).toBe("Pizza Piazza");
      expect(result.foodType).toBe("PIZZA");
    });

    it("should not invent a value if entity cannot be mapped", () => {
      const intent: OrderFoodIntent = {
        action: "ORDER_FOOD",
        food_order: {
          item_name: "nonexistent_dish_xyz",
          food_type: "unrecognized_cuisine",
          delivery_mode: null,
          quantity: null,
          restaurant_name: null,
        },
      };

      const result = mapOrderFoodIntentToPartialOrder(intent);
      expect(result).toEqual({});
    });
  });

  describe("handleAssistantMessage with ORDER_FOOD", () => {
    it("handles 'I want biryani' by starting session and advancing to DELIVERY_MODE", async () => {
      vi.mocked(geminiProvider.generateAssistantIntent).mockResolvedValue({
        action: "ORDER_FOOD",
        food_order: {
          item_name: "biryani",
          food_type: "biryani",
          delivery_mode: null,
          quantity: null,
          restaurant_name: null,
        },
      });

      const res = await handleAssistantMessage("I want biryani", "test-session-1");
      expect(res.intent.action).toBe("ORDER_FOOD");
      expect(res.foodSession).toBeDefined();
      expect(res.foodSession?.sessionId).toBe("test-session-1");
      // Since delivery mode was not provided, next step after ORDER_FOOD is DELIVERY_MODE
      expect(res.foodSession?.currentStep).toBe("DELIVERY_MODE");
    });

    it("handles 'I want chicken biryani delivered' by populating deliveryMode and auto-skipping to FOOD_TYPE", async () => {
      vi.mocked(geminiProvider.generateAssistantIntent).mockResolvedValue({
        action: "ORDER_FOOD",
        food_order: {
          item_name: "chicken biryani",
          delivery_mode: "DELIVERY",
          food_type: null,
          quantity: null,
          restaurant_name: null,
        },
      });

      const res = await handleAssistantMessage(
        "I want chicken biryani delivered",
        "test-session-2"
      );
      expect(res.intent.action).toBe("ORDER_FOOD");
      expect(res.foodSession).toBeDefined();
      expect(res.foodSession?.order.deliveryMode).toBe("DELIVERY");
      // DELIVERY_MODE is satisfied so engine automatically advances to FOOD_TYPE
      expect(res.foodSession?.currentStep).toBe("FOOD_TYPE");
    });
  });
});
