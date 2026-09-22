import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { FoodOrderConfirmation } from '@/types/food';

interface Props {
  confirmation: FoodOrderConfirmation;
  onReset: () => void;
  disabled?: boolean;
}

export function ConfirmationCard({ confirmation, onReset, disabled }: Props) {
  const {
    orderId,
    confirmedAt,
    restaurant,
    items,
    customizations,
    address,
    paymentMethod,
    totalAmount,
    estimatedDeliveryMinutes,
  } = confirmation;

  const formattedDate = confirmedAt
    ? new Date(confirmedAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Header Banner */}
      <View style={styles.successHeader}>
        <ThemedText style={styles.successIcon}>🎉</ThemedText>
        <View style={styles.headerText}>
          <ThemedText type="subtitle" style={styles.successTitle}>
            Order Placed Successfully!
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formattedDate}
          </ThemedText>
        </View>
      </View>

      {/* Order Reference Badge */}
      <View style={styles.orderIdBadge}>
        <ThemedText type="small" themeColor="textSecondary">
          Order ID:
        </ThemedText>
        <ThemedText type="smallBold" style={styles.orderIdText}>
          {orderId}
        </ThemedText>
      </View>

      {/* Estimated Delivery Time */}
      {estimatedDeliveryMinutes ? (
        <View style={styles.etaBox}>
          <ThemedText style={styles.etaIcon}>⏱️</ThemedText>
          <View>
            <ThemedText type="smallBold">Estimated Delivery Time</ThemedText>
            <ThemedText type="subtitle" style={styles.etaText}>
              ~{estimatedDeliveryMinutes} Minutes
            </ThemedText>
          </View>
        </View>
      ) : null}

      {/* Restaurant */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          RESTAURANT
        </ThemedText>
        <ThemedText type="subtitle">{restaurant.name}</ThemedText>
      </View>

      {/* Items & Customizations */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          ORDERED ITEMS
        </ThemedText>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.flex1}>
              <ThemedText type="subtitle">{item.name}</ThemedText>
              {customizations.length > 0
                ? customizations.map((c, idx) => (
                    <View key={idx} style={styles.custDetails}>
                      {c.extras.length > 0 ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          Extras: {c.extras.join(', ')}
                        </ThemedText>
                      ) : null}
                      {c.removals.length > 0 ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          No: {c.removals.join(', ')}
                        </ThemedText>
                      ) : null}
                      {c.notes ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          Note: {c.notes}
                        </ThemedText>
                      ) : null}
                    </View>
                  ))
                : null}
            </View>
            <ThemedText type="subtitle" style={styles.priceText}>
              ${item.price.toFixed(2)}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Address & Payment Method */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          DELIVERY & PAYMENT
        </ThemedText>
        {address ? (
          <ThemedText type="small" themeColor="textSecondary">
            📍 {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.postalCode}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Order Pickup / Dine In
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textSecondary" style={styles.marginTopHalf}>
          💳 Payment: {paymentMethod.name}
        </ThemedText>
      </View>

      {/* Final Total Amount */}
      <View style={styles.totalRow}>
        <ThemedText type="subtitle">Total Paid</ThemedText>
        <ThemedText type="subtitle" style={styles.totalPrice}>
          ${totalAmount.toFixed(2)}
        </ThemedText>
      </View>

      {/* Start New Order Button */}
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        onPress={onReset}>
        <ThemedText type="smallBold" style={styles.resetButtonText}>
          Start New Order
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  successIcon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  successTitle: {
    color: '#059669',
  },
  orderIdBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  orderIdText: {
    color: '#059669',
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    gap: Spacing.three,
  },
  etaIcon: {
    fontSize: 24,
  },
  etaText: {
    color: '#2563EB',
  },
  section: {
    gap: Spacing.half,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  custDetails: {
    marginTop: Spacing.half,
  },
  priceText: {
    color: '#059669',
  },
  marginTopHalf: {
    marginTop: Spacing.half,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
  },
  totalPrice: {
    color: '#059669',
    fontSize: 18,
  },
  resetButton: {
    backgroundColor: '#2563EB',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  resetButtonText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
