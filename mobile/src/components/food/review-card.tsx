import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PartialFoodOrder } from '@/types/food';

interface Props {
  order: PartialFoodOrder;
  onProceed: () => void;
  disabled?: boolean;
}

export function ReviewCard({ order, onProceed, disabled }: Props) {
  const restaurant = order.restaurant;
  const items = order.items || [];
  const customizations = order.customizations || [];
  const address = order.address;
  const deliveryMode = order.deliveryMode || 'DELIVERY';

  // Calculate pricing breakdown using order data
  const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
  let extrasTotal = 0;

  for (const cust of customizations) {
    if (cust.extras.includes('Extra Cheese')) extrasTotal += 1.5;
    if (cust.extras.includes('Gluten-Free Crust')) extrasTotal += 2.5;
    if (cust.extras.includes('Extra Sauce')) extrasTotal += 0.75;
  }

  const grandTotal = Math.round((itemsTotal + extrasTotal) * 100) / 100;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 7: REVIEW YOUR ORDER
      </ThemedText>

      {/* Restaurant Section */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          RESTAURANT
        </ThemedText>
        {restaurant ? (
          <View style={styles.rowBetween}>
            <ThemedText type="subtitle">{restaurant.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {restaurant.cuisine}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="small">No restaurant selected</ThemedText>
        )}
      </View>

      {/* Items Section */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          ITEMS
        </ThemedText>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.flex1}>
              <ThemedText type="subtitle">{item.name}</ThemedText>
              {customizations.length > 0
                ? customizations.map((c, i) => (
                    <View key={i} style={styles.custDetails}>
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

      {/* Delivery / Address Section */}
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          DELIVERY DETAILS
        </ThemedText>
        <ThemedText type="subtitle">Mode: {deliveryMode}</ThemedText>
        {deliveryMode === 'DELIVERY' && address ? (
          <ThemedText type="small" themeColor="textSecondary">
            📍 {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.postalCode}
          </ThemedText>
        ) : deliveryMode !== 'DELIVERY' ? (
          <ThemedText type="small" themeColor="textSecondary">
            No delivery address required for {deliveryMode}.
          </ThemedText>
        ) : null}
      </View>

      {/* Price Summary Breakdown */}
      <View style={styles.summaryBox}>
        <View style={styles.rowBetween}>
          <ThemedText type="small" themeColor="textSecondary">
            Items Subtotal
          </ThemedText>
          <ThemedText type="small">${itemsTotal.toFixed(2)}</ThemedText>
        </View>

        {extrasTotal > 0 ? (
          <View style={styles.rowBetween}>
            <ThemedText type="small" themeColor="textSecondary">
              Add-ons / Extras
            </ThemedText>
            <ThemedText type="small">${extrasTotal.toFixed(2)}</ThemedText>
          </View>
        ) : null}

        <View style={styles.rowBetween}>
          <ThemedText type="small" themeColor="textSecondary">
            Delivery Fee
          </ThemedText>
          <ThemedText type="small" style={styles.freeText}>
            FREE
          </ThemedText>
        </View>

        <View style={[styles.rowBetween, styles.totalRow]}>
          <ThemedText type="subtitle">Total Amount</ThemedText>
          <ThemedText type="subtitle" style={styles.totalPrice}>
            ${grandTotal.toFixed(2)}
          </ThemedText>
        </View>
      </View>

      {/* Proceed Button */}
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [styles.proceedButton, pressed && styles.pressed]}
        onPress={onProceed}>
        <ThemedText type="smallBold" style={styles.proceedButtonText}>
          Proceed to Payment →
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
  header: {
    letterSpacing: 0.5,
  },
  section: {
    gap: Spacing.half,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  summaryBox: {
    gap: Spacing.one,
    paddingTop: Spacing.one,
  },
  freeText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.3)',
  },
  totalPrice: {
    color: '#2563EB',
  },
  proceedButton: {
    backgroundColor: '#2563EB',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  proceedButtonText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
