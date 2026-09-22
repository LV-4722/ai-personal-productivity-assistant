import { describe, expect, it } from "vitest";
import { FoodMockService } from "../food-mock.service.js";
import { FoodWorkflowEngine } from "../../workflows/food.workflow.js";

describe("FoodMockService", () => {
  describe("getAvailableRestaurants", () => {
    it("returns all restaurants when no foodType filter is passed", () => {
      const restaurants = FoodMockService.getAvailableRestaurants();
      expect(restaurants.length).toBeGreaterThanOrEqual(4);
    });

    it("filters restaurants by foodType (BURGER)", () => {
      const restaurants = FoodMockService.getAvailableRestaurants("BURGER");
      expect(restaurants).toHaveLength(1);
      expect(restaurants[0].name).toBe("Burger Haven");
      expect(restaurants[0].cuisine).toBe("BURGER");
    });

    it("falls back to all restaurants if foodType has no match", () => {
      const restaurants = FoodMockService.getAvailableRestaurants("MEXICAN");
      expect(restaurants.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("getAvailableItems", () => {
    it("returns all items when no restaurantId is passed", () => {
      const items = FoodMockService.getAvailableItems();
      expect(items.length).toBeGreaterThanOrEqual(6);
    });

    it("filters items by restaurantId", () => {
      const items = FoodMockService.getAvailableItems("rest-1");
      expect(items).toHaveLength(2);
      expect(items.every((i) => i.restaurantId === "rest-1")).toBe(true);
    });
  });

  describe("getAvailableCustomizations", () => {
    it("returns list of customization options", () => {
      const options = FoodMockService.getAvailableCustomizations();
      expect(options.length).toBeGreaterThanOrEqual(4);
      expect(options[0]).toHaveProperty("price");
      expect(options[0]).toHaveProperty("type");
    });
  });

  describe("getSavedAddresses", () => {
    it("returns list of saved addresses", () => {
      const addresses = FoodMockService.getSavedAddresses();
      expect(addresses).toHaveLength(2);
      expect(addresses[0]).toHaveProperty("city");
    });
  });

  describe("getPaymentMethods", () => {
    it("returns list of payment methods", () => {
      const methods = FoodMockService.getPaymentMethods();
      expect(methods).toHaveLength(3);
      expect(methods.map((m) => m.type)).toEqual([
        "CREDIT_CARD",
        "UPI",
        "CASH_ON_DELIVERY",
      ]);
    });
  });

  describe("lookups", () => {
    it("finds restaurant by ID and name", () => {
      const byId = FoodMockService.findRestaurantById("rest-2");
      expect(byId?.name).toBe("Pizza Piazza");

      const byName = FoodMockService.findRestaurantByName("burger");
      expect(byName?.id).toBe("rest-1");
    });

    it("finds item by ID and name", () => {
      const byId = FoodMockService.findItemById("item-3");
      expect(byId?.name).toBe("Margherita Pizza");

      const byName = FoodMockService.findItemByName("Butter Chicken");
      expect(byName?.id).toBe("item-5");
    });
  });

  describe("getOptionsForCurrentStep", () => {
    it("returns restaurants when current step is RESTAURANT", () => {
      const engine = FoodWorkflowEngine.create("s1");
      engine.transition(); // → DELIVERY_MODE
      engine.setDeliveryMode("DELIVERY"); // → FOOD_TYPE
      engine.setFoodType("PIZZA"); // → RESTAURANT

      const options = FoodMockService.getOptionsForCurrentStep(engine);
      expect(options.restaurants).toBeDefined();
      expect(options.restaurants).toHaveLength(1);
      expect(options.restaurants![0].cuisine).toBe("PIZZA");
    });

    it("returns items when current step is ITEM", () => {
      const engine = FoodWorkflowEngine.create("s2");
      engine.transition();
      engine.setDeliveryMode("DELIVERY");
      engine.setFoodType("BURGER");
      engine.setRestaurant({
        id: "rest-1",
        name: "Burger Haven",
        cuisine: "BURGER",
        rating: 4.6,
        estimatedDeliveryMinutes: 25,
      });

      const options = FoodMockService.getOptionsForCurrentStep(engine);
      expect(options.items).toBeDefined();
      expect(options.items).toHaveLength(2);
    });

    it("returns addresses when current step is ADDRESS", () => {
      const engine = FoodWorkflowEngine.create("s3");
      engine.transition();
      engine.setDeliveryMode("DELIVERY");
      engine.setFoodType("BURGER");
      engine.setRestaurant({
        id: "rest-1",
        name: "Burger Haven",
        cuisine: "BURGER",
        rating: 4.6,
        estimatedDeliveryMinutes: 25,
      });
      engine.setItems([
        {
          id: "item-1",
          restaurantId: "rest-1",
          name: "Classic Cheeseburger",
          description: null,
          price: 9.99,
        },
      ]);
      engine.setCustomizations([]);
      engine.transition(); // leave CUSTOMIZE → ADDRESS

      const options = FoodMockService.getOptionsForCurrentStep(engine);
      expect(options.addresses).toBeDefined();
      expect(options.addresses).toHaveLength(2);
    });
  });

  describe("generateOrderConfirmation", () => {
    it("calculates total amount including item prices and extra customizations", () => {
      const items = [
        { id: "i1", restaurantId: "r1", name: "Burger", description: null, price: 10.0 },
      ];
      const customizations = [
        { itemId: "i1", notes: null, extras: ["Extra Cheese"], removals: [] },
      ];
      const total = FoodMockService.calculateTotalAmount(items, customizations);
      // 10.00 + 1.50 = 11.50
      expect(total).toBe(11.5);
    });

    it("generates deterministic order confirmation summary", () => {
      const timestamp = new Date("2026-09-22T10:00:00Z");
      const order = {
        deliveryMode: "DELIVERY" as const,
        restaurant: {
          id: "rest-1",
          name: "Burger Haven",
          cuisine: "BURGER" as const,
          rating: 4.6,
          estimatedDeliveryMinutes: 25,
        },
        items: [
          { id: "item-1", restaurantId: "rest-1", name: "Classic Cheeseburger", description: null, price: 9.99 },
        ],
        customizations: [
          { itemId: "item-1", notes: null, extras: ["Extra Cheese"], removals: [] },
        ],
        address: {
          line1: "123 Tech Park Ave",
          line2: null,
          city: "San Francisco",
          state: "CA",
          postalCode: "94107",
          country: "US",
        },
        paymentMethod: {
          id: "pay-1",
          name: "Visa ending in 4242",
          type: "CREDIT_CARD" as const,
        },
      };

      const confirmation = FoodMockService.generateOrderConfirmation(order, "session-123", timestamp);
      expect(confirmation.orderId).toMatch(/^ORD-SESSION123-/);
      expect(confirmation.confirmedAt).toBe(timestamp);
      expect(confirmation.restaurant.name).toBe("Burger Haven");
      expect(confirmation.items).toHaveLength(1);
      expect(confirmation.totalAmount).toBe(11.49); // 9.99 + 1.50
      expect(confirmation.estimatedDeliveryMinutes).toBe(25);
      expect(confirmation.paymentMethod.type).toBe("CREDIT_CARD");
    });
  });
});
