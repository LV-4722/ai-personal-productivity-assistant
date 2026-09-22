import {
  Address,
  CustomizationOption,
  Item,
  PaymentMethod,
  Restaurant,
} from "../types/food.js";

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "rest-1",
    name: "Burger Haven",
    cuisine: "BURGER",
    rating: 4.6,
    estimatedDeliveryMinutes: 25,
  },
  {
    id: "rest-2",
    name: "Pizza Piazza",
    cuisine: "PIZZA",
    rating: 4.8,
    estimatedDeliveryMinutes: 30,
  },
  {
    id: "rest-3",
    name: "Spice Garden",
    cuisine: "INDIAN",
    rating: 4.5,
    estimatedDeliveryMinutes: 35,
  },
  {
    id: "rest-4",
    name: "Dragon Wok",
    cuisine: "CHINESE",
    rating: 4.4,
    estimatedDeliveryMinutes: 20,
  },
];

export const MOCK_ITEMS: Item[] = [
  {
    id: "item-1",
    restaurantId: "rest-1",
    name: "Classic Cheeseburger",
    description: "Juicy beef patty with cheddar cheese, lettuce, and special sauce.",
    price: 9.99,
  },
  {
    id: "item-2",
    restaurantId: "rest-1",
    name: "Bacon Avocado Burger",
    description: "Beef patty topped with crispy bacon and fresh avocado slices.",
    price: 12.49,
  },
  {
    id: "item-3",
    restaurantId: "rest-2",
    name: "Margherita Pizza",
    description: "Classic pizza with fresh mozzarella, tomato sauce, and basil.",
    price: 14.99,
  },
  {
    id: "item-4",
    restaurantId: "rest-2",
    name: "Pepperoni Passion",
    description: "Loaded with double pepperoni and extra cheese.",
    price: 16.99,
  },
  {
    id: "item-5",
    restaurantId: "rest-3",
    name: "Butter Chicken",
    description: "Tender chicken cooked in a rich, creamy tomato gravy.",
    price: 13.99,
  },
  {
    id: "item-6",
    restaurantId: "rest-4",
    name: "Kung Pao Chicken",
    description: "Spicy stir-fried chicken with peanuts and vegetables.",
    price: 11.99,
  },
];

export const MOCK_CUSTOMIZATION_OPTIONS: CustomizationOption[] = [
  {
    id: "cust-1",
    name: "Extra Cheese",
    price: 1.5,
    type: "EXTRA",
  },
  {
    id: "cust-2",
    name: "Gluten-Free Crust",
    price: 2.5,
    type: "EXTRA",
  },
  {
    id: "cust-3",
    name: "No Onions",
    price: 0.0,
    type: "REMOVAL",
  },
  {
    id: "cust-4",
    name: "Extra Sauce",
    price: 0.75,
    type: "EXTRA",
  },
];

export const MOCK_ADDRESSES: Address[] = [
  {
    line1: "123 Tech Park Ave",
    line2: "Suite 400",
    city: "San Francisco",
    state: "CA",
    postalCode: "94107",
    country: "US",
  },
  {
    line1: "456 Residence Lane",
    line2: "Apt 2B",
    city: "San Francisco",
    state: "CA",
    postalCode: "94110",
    country: "US",
  },
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pay-1",
    name: "Visa ending in 4242",
    type: "CREDIT_CARD",
  },
  {
    id: "pay-2",
    name: "UPI (user@okbank)",
    type: "UPI",
  },
  {
    id: "pay-3",
    name: "Cash on Delivery",
    type: "CASH_ON_DELIVERY",
  },
];
