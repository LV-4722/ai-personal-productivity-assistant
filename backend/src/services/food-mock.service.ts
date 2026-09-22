import {
  MOCK_ADDRESSES,
  MOCK_CUSTOMIZATION_OPTIONS,
  MOCK_ITEMS,
  MOCK_PAYMENT_METHODS,
  MOCK_RESTAURANTS,
} from "../data/mock-food.data.js";
import {
  Address,
  Customization,
  CustomizationOption,
  FoodOrderConfirmation,
  FoodType,
  Item,
  PartialFoodOrder,
  PaymentMethod,
  Restaurant,
} from "../types/food.js";
import { FoodWorkflowEngine } from "../workflows/food.workflow.js";

/**
 * Data access service connecting mock food dataset with workflow states.
 */
export class FoodMockService {
  /**
   * Retrieve available restaurants, optionally filtered by food type (cuisine).
   */
  static getAvailableRestaurants(foodType?: FoodType): Restaurant[] {
    if (!foodType) {
      return [...MOCK_RESTAURANTS];
    }
    const filtered = MOCK_RESTAURANTS.filter((r) => r.cuisine === foodType);
    return filtered.length > 0 ? filtered : [...MOCK_RESTAURANTS];
  }

  /**
   * Retrieve menu items, optionally filtered by restaurant ID.
   */
  static getAvailableItems(restaurantId?: string): Item[] {
    if (!restaurantId) {
      return [...MOCK_ITEMS];
    }
    const filtered = MOCK_ITEMS.filter((item) => item.restaurantId === restaurantId);
    return filtered.length > 0 ? filtered : [...MOCK_ITEMS];
  }

  /**
   * Retrieve available customization options for food items.
   */
  static getAvailableCustomizations(): CustomizationOption[] {
    return [...MOCK_CUSTOMIZATION_OPTIONS];
  }

  /**
   * Retrieve saved delivery addresses.
   */
  static getSavedAddresses(): Address[] {
    return [...MOCK_ADDRESSES];
  }

  /**
   * Retrieve available payment methods.
   */
  static getPaymentMethods(): PaymentMethod[] {
    return [...MOCK_PAYMENT_METHODS];
  }

  /**
   * Find a restaurant by its ID.
   */
  static findRestaurantById(id: string): Restaurant | null {
    return MOCK_RESTAURANTS.find((r) => r.id === id) ?? null;
  }

  /**
   * Find a restaurant by name (case-insensitive substring match).
   */
  static findRestaurantByName(name: string): Restaurant | null {
    const normalized = name.trim().toLowerCase();
    return (
      MOCK_RESTAURANTS.find((r) => r.name.toLowerCase().includes(normalized)) ??
      null
    );
  }

  /**
   * Find a menu item by its ID.
   */
  static findItemById(id: string): Item | null {
    return MOCK_ITEMS.find((item) => item.id === id) ?? null;
  }

  /**
   * Find a menu item by name (case-insensitive substring match).
   */
  static findItemByName(name: string, restaurantId?: string): Item | null {
    const normalized = name.trim().toLowerCase();
    const items = restaurantId
      ? MOCK_ITEMS.filter((i) => i.restaurantId === restaurantId)
      : MOCK_ITEMS;
    return items.find((item) => item.name.toLowerCase().includes(normalized)) ?? null;
  }

  /**
   * Retrieve options relevant to the current step of a FoodWorkflowEngine instance.
   */
  static getOptionsForCurrentStep(engine: FoodWorkflowEngine): {
    restaurants?: Restaurant[];
    items?: Item[];
    customizations?: CustomizationOption[];
    addresses?: Address[];
    paymentMethods?: PaymentMethod[];
  } {
    const currentStep = engine.getCurrentStep();
    const order = engine.getOrder();

    switch (currentStep) {
      case "RESTAURANT":
        return { restaurants: FoodMockService.getAvailableRestaurants(order.foodType) };
      case "ITEM":
        return { items: FoodMockService.getAvailableItems(order.restaurant?.id) };
      case "CUSTOMIZE":
        return { customizations: FoodMockService.getAvailableCustomizations() };
      case "ADDRESS":
        return { addresses: FoodMockService.getSavedAddresses() };
      case "PAYMENT":
        return { paymentMethods: FoodMockService.getPaymentMethods() };
      default:
        return {};
    }
  }

  /**
   * Calculate total order amount based on item prices and customization extras.
   */
  static calculateTotalAmount(
    items: Item[] = [],
    customizations: Customization[] = []
  ): number {
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    let extrasTotal = 0;

    for (const cust of customizations) {
      for (const extraName of cust.extras) {
        const option = MOCK_CUSTOMIZATION_OPTIONS.find(
          (opt) => opt.name.toLowerCase() === extraName.toLowerCase()
        );
        if (option) {
          extrasTotal += option.price;
        }
      }
    }

    return Math.round((itemsTotal + extrasTotal) * 100) / 100;
  }

  /**
   * Generate deterministic order confirmation details upon workflow completion.
   */
  static generateOrderConfirmation(
    order: PartialFoodOrder,
    sessionId: string,
    confirmedAt: Date = new Date()
  ): FoodOrderConfirmation {
    const defaultRestaurant: Restaurant = MOCK_RESTAURANTS[0];
    const defaultItems: Item[] = [MOCK_ITEMS[0]];

    const restaurant = order.restaurant ?? defaultRestaurant;
    const items = order.items && order.items.length > 0 ? order.items : defaultItems;
    const customizations = order.customizations ? [...order.customizations] : [];
    const paymentMethod = order.paymentMethod ?? MOCK_PAYMENT_METHODS[0];
    const address = order.deliveryMode === "DELIVERY" ? (order.address ?? null) : null;
    const totalAmount = FoodMockService.calculateTotalAmount(items, customizations);

    const cleanSession = sessionId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const orderId = `ORD-${cleanSession || "MOCK"}-${confirmedAt.getTime().toString().slice(-4)}`;

    return {
      orderId,
      confirmedAt,
      restaurant,
      items: [...items],
      customizations,
      address,
      paymentMethod,
      totalAmount,
      estimatedDeliveryMinutes: restaurant.estimatedDeliveryMinutes,
    };
  }
}
