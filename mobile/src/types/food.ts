export type FoodWorkflowStep =
  | 'ORDER_FOOD'
  | 'DELIVERY_MODE'
  | 'FOOD_TYPE'
  | 'RESTAURANT'
  | 'ITEM'
  | 'CUSTOMIZE'
  | 'ADDRESS'
  | 'REVIEW'
  | 'PAYMENT'
  | 'CONFIRMED';

export type DeliveryMode = 'DELIVERY' | 'PICKUP' | 'DINE_IN';

export type FoodType =
  | 'PIZZA'
  | 'BURGER'
  | 'SUSHI'
  | 'INDIAN'
  | 'CHINESE'
  | 'MEXICAN'
  | 'ITALIAN'
  | 'THAI'
  | 'MEDITERRANEAN'
  | 'FAST_FOOD'
  | 'HEALTHY'
  | 'DESSERT'
  | 'OTHER';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: FoodType;
  rating: number | null;
  estimatedDeliveryMinutes: number | null;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  price: number;
  restaurantId: string;
}

export interface Customization {
  itemId: string;
  notes: string | null;
  extras: string[];
  removals: string[];
}

export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
  type: 'EXTRA' | 'REMOVAL';
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'CREDIT_CARD' | 'UPI' | 'CASH_ON_DELIVERY';
}

export interface FoodOrderConfirmation {
  orderId: string;
  confirmedAt: string;
  restaurant: Restaurant;
  items: Item[];
  customizations: Customization[];
  address: Address | null;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  estimatedDeliveryMinutes: number | null;
}

export interface PartialFoodOrder {
  deliveryMode?: DeliveryMode;
  foodType?: FoodType;
  restaurant?: Restaurant;
  items?: Item[];
  customizations?: Customization[];
  address?: Address;
  paymentMethod?: PaymentMethod;
}

export interface FoodStepOptions {
  restaurants?: Restaurant[];
  items?: Item[];
  customizations?: CustomizationOption[];
  addresses?: Address[];
  paymentMethods?: PaymentMethod[];
}

export interface FoodApiResponse {
  sessionId: string;
  currentStep: FoodWorkflowStep;
  order: PartialFoodOrder;
  options: FoodStepOptions;
  message: string;
  isComplete: boolean;
  confirmation?: FoodOrderConfirmation;
}
