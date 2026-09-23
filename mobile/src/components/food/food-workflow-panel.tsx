import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AddressCardList } from './address-card';
import { ConfirmationCard } from './confirmation-card';
import { CustomizeCard } from './customize-card';
import { DeliveryModeCard } from './delivery-mode-card';
import { FoodTypeCard } from './food-type-card';
import { ItemCardList } from './item-card';
import { PaymentCardList } from './payment-card';
import { RestaurantCardList } from './restaurant-card';
import { ReviewCard } from './review-card';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  advanceFoodStep,
  createOrGetFoodSession,
  resetFoodSession,
  stepBackFoodSession,
} from '@/services/food-api';
import {
  Address,
  Customization,
  DeliveryMode,
  FoodApiResponse,
  FoodType,
  Item,
  PartialFoodOrder,
  PaymentMethod,
  Restaurant,
} from '@/types/food';

interface Props {
  sessionId?: string;
  initialOrder?: PartialFoodOrder;
  onStateChange?: (response: FoodApiResponse) => void;
  externalSession?: FoodApiResponse | null;
}

export function FoodWorkflowPanel({
  sessionId,
  initialOrder,
  onStateChange,
  externalSession,
}: Props) {
  const [session, setSession] = useState<FoodApiResponse | null>(externalSession || null);
  const [prevExternalSession, setPrevExternalSession] = useState<FoodApiResponse | null | undefined>(
    externalSession
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (externalSession !== prevExternalSession) {
    setPrevExternalSession(externalSession);
    if (externalSession) {
      setSession(externalSession);
    }
  }

  const activeSessionId =
    session?.sessionId || externalSession?.sessionId || sessionId || 'active-food-session';

  const handleStartSession = async (customInitialOrder?: PartialFoodOrder) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await createOrGetFoodSession(
        activeSessionId,
        customInitialOrder || initialOrder
      );
      setSession(res);
      onStateChange?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start food session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdvanceStep = async (data?: PartialFoodOrder) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await advanceFoodStep(activeSessionId, data);
      setSession(res);
      onStateChange?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance step.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepBack = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await stepBackFoodSession(activeSessionId);
      setSession(res);
      onStateChange?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to step back.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await resetFoodSession(activeSessionId);
      setSession(null);
      setPrevExternalSession(null);
      onStateChange?.(null as unknown as FoodApiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset session.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Initial launcher view if session hasn't started yet
  if (!session) {
    return (
      <ThemedView type="backgroundElement" style={styles.launcherCard}>
        <ThemedText type="subtitle">Food Ordering Workflow</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Start a step-by-step food order or test pre-populated checkout skipping.
        </ThemedText>

        {error ? (
          <ThemedView type="backgroundElement" style={styles.errorBox}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.launcherButtons}>
          <Pressable
            disabled={isLoading}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => handleStartSession()}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText type="smallBold" style={styles.buttonText}>
                Start New Food Order
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            disabled={isLoading}
            style={({ pressed }) => [
              styles.actionButton,
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              handleStartSession({
                deliveryMode: 'DELIVERY',
                foodType: 'INDIAN',
              })
            }>
            <ThemedText type="smallBold" style={styles.secondaryButtonText}>
              Fast Order: Chicken Biryani (Indian Delivery)
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // 2. Active Session Workflow View
  const currentStep = session.currentStep;

  // Total calculation for Payment step
  const items = session.order.items || [];
  const customizations = session.order.customizations || [];
  const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
  let extrasTotal = 0;
  for (const cust of customizations) {
    if (cust.extras.includes('Extra Cheese')) extrasTotal += 1.5;
    if (cust.extras.includes('Gluten-Free Crust')) extrasTotal += 2.5;
    if (cust.extras.includes('Extra Sauce')) extrasTotal += 0.75;
  }
  const grandTotal =
    session.confirmation?.totalAmount || Math.round((itemsTotal + extrasTotal) * 100) / 100;

  return (
    <View style={styles.panelContainer}>
      {/* Top Header Bar */}
      <ThemedView type="backgroundSelected" style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <ThemedText type="smallBold">Food Order</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Step: {currentStep}
          </ThemedText>
        </View>

        <View style={styles.headerControls}>
          {currentStep !== 'ORDER_FOOD' && currentStep !== 'CONFIRMED' ? (
            <Pressable disabled={isLoading} style={styles.controlLink} onPress={handleStepBack}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                ← Back
              </ThemedText>
            </Pressable>
          ) : null}
          <Pressable disabled={isLoading} style={styles.controlLink} onPress={handleReset}>
            <ThemedText type="smallBold" style={styles.resetText}>
              Reset
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>

      {/* Loading overlay indicator */}
      {isLoading ? (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color="#2563EB" />
          <ThemedText type="small" themeColor="textSecondary">
            Processing...
          </ThemedText>
        </View>
      ) : null}

      {/* Error notification banner */}
      {error ? (
        <ThemedView type="backgroundElement" style={styles.errorBox}>
          <ThemedText type="small" style={styles.errorText}>
            {error}
          </ThemedText>
        </ThemedView>
      ) : null}

      {/* Step Message */}
      {session.message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.statusMessage}>
          {session.message}
        </ThemedText>
      ) : null}

      {/* Active Step Content */}
      {currentStep === 'ORDER_FOOD' && (
        <ThemedView type="backgroundElement" style={styles.stepBox}>
          <ThemedText type="subtitle">Welcome to Food Order</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Click continue to start choosing your delivery mode.
          </ThemedText>
          <Pressable
            disabled={isLoading}
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={() => handleAdvanceStep()}>
            <ThemedText type="smallBold" style={styles.buttonText}>
              Begin Order →
            </ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {currentStep === 'DELIVERY_MODE' && (
        <DeliveryModeCard
          disabled={isLoading}
          onSelect={(mode: DeliveryMode) => handleAdvanceStep({ deliveryMode: mode })}
        />
      )}

      {currentStep === 'FOOD_TYPE' && (
        <FoodTypeCard
          disabled={isLoading}
          onSelect={(foodType: FoodType) => handleAdvanceStep({ foodType })}
        />
      )}

      {currentStep === 'RESTAURANT' && (
        <RestaurantCardList
          disabled={isLoading}
          restaurants={session.options.restaurants || []}
          onSelect={(restaurant: Restaurant) => handleAdvanceStep({ restaurant })}
        />
      )}

      {currentStep === 'ITEM' && (
        <ItemCardList
          disabled={isLoading}
          items={session.options.items || []}
          onSelect={(item: Item) => handleAdvanceStep({ items: [item] })}
        />
      )}

      {currentStep === 'CUSTOMIZE' && (
        <CustomizeCard
          disabled={isLoading}
          item={session.order.items?.[0]}
          options={session.options.customizations || []}
          onConfirm={(customization: Customization) =>
            handleAdvanceStep({ customizations: [customization] })
          }
        />
      )}

      {currentStep === 'ADDRESS' && (
        <AddressCardList
          addresses={session.options.addresses || []}
          disabled={isLoading}
          onSelect={(address: Address) => handleAdvanceStep({ address })}
        />
      )}

      {currentStep === 'REVIEW' && (
        <ReviewCard
          disabled={isLoading}
          order={session.order}
          onProceed={() => handleAdvanceStep()}
        />
      )}

      {currentStep === 'PAYMENT' && (
        <PaymentCardList
          disabled={isLoading}
          paymentMethods={session.options.paymentMethods || []}
          totalAmount={grandTotal}
          onPlaceOrder={(paymentMethod: PaymentMethod) => handleAdvanceStep({ paymentMethod })}
        />
      )}

      {currentStep === 'CONFIRMED' &&
        (session.confirmation ? (
          <ConfirmationCard
            confirmation={session.confirmation}
            disabled={isLoading}
            onReset={handleReset}
          />
        ) : (
          <ThemedView type="backgroundElement" style={styles.stepBox}>
            <ThemedText type="subtitle" style={styles.confirmedTitle}>
              ✓ Order Placed & Confirmed!
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your order has been placed successfully.
            </ThemedText>
            <Pressable
              disabled={isLoading}
              style={({ pressed }) => [styles.actionButton, styles.secondaryButton, pressed && styles.pressed]}
              onPress={handleReset}>
              <ThemedText type="smallBold" style={styles.secondaryButtonText}>
                Start New Order
              </ThemedText>
            </Pressable>
          </ThemedView>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  launcherCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    marginVertical: Spacing.two,
  },
  launcherButtons: {
    gap: Spacing.two,
  },
  panelContainer: {
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  headerLeft: {
    gap: Spacing.half,
  },
  headerControls: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  controlLink: {
    padding: Spacing.one,
  },
  resetText: {
    color: '#EF4444',
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  errorBox: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#DC2626',
  },
  statusMessage: {
    fontStyle: 'italic',
    paddingHorizontal: Spacing.one,
  },
  stepBox: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  confirmedTitle: {
    color: '#059669',
  },
  actionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  buttonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.7,
  },
});
