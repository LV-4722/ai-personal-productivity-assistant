import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { PaymentMethod } from '@/types/food';

interface Props {
  paymentMethods: PaymentMethod[];
  totalAmount: number;
  onPlaceOrder: (paymentMethod: PaymentMethod) => void;
  disabled?: boolean;
}

const METHOD_ICONS: Record<string, string> = {
  CREDIT_CARD: '💳',
  UPI: '📱',
  CASH_ON_DELIVERY: '💵',
};

export function PaymentCardList({
  paymentMethods,
  totalAmount,
  onPlaceOrder,
  disabled,
}: Props) {
  const { isWide } = useResponsive();
  const [selectedId, setSelectedId] = useState<string>(
    paymentMethods[0]?.id || 'pay-1'
  );

  const selectedMethod =
    paymentMethods.find((m) => m.id === selectedId) || paymentMethods[0];

  const handleConfirm = () => {
    if (selectedMethod) {
      onPlaceOrder(selectedMethod);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 8: SELECT PAYMENT METHOD
      </ThemedText>

      {/* Payment Method Cards */}
      <View style={[styles.list, isWide && styles.listWide]}>
        {paymentMethods.map((method) => {
          const isSelected = method.id === selectedId;
          const icon = METHOD_ICONS[method.type] || '💳';

          return (
            <Pressable
              key={method.id}
              disabled={disabled}
              style={({ pressed }) => [
                styles.methodCard,
                isWide && styles.methodCardWide,
                isSelected && styles.methodCardSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => setSelectedId(method.id)}>
              <ThemedText style={styles.icon}>{icon}</ThemedText>
              <View style={styles.methodText}>
                <ThemedText type="subtitle">{method.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {method.type.replace(/_/g, ' ')}
                </ThemedText>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Visible Total Price */}
      <View style={styles.totalBanner}>
        <ThemedText type="subtitle">Total Amount Due:</ThemedText>
        <ThemedText type="subtitle" style={styles.totalPrice}>
          ${totalAmount.toFixed(2)}
        </ThemedText>
      </View>

      {/* Place Order Button */}
      <Pressable
        disabled={disabled || !selectedMethod}
        style={({ pressed }) => [
          styles.placeOrderButton,
          (!selectedMethod || disabled) && styles.disabledButton,
          pressed && styles.pressed,
        ]}
        onPress={handleConfirm}>
        <ThemedText type="smallBold" style={styles.placeOrderButtonText}>
          {disabled ? 'Placing Order...' : `Place Order · $${totalAmount.toFixed(2)}`}
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
  list: {
    gap: Spacing.two,
  },
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodCardWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    maxWidth: 320,
  },
  methodCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 22,
  },
  methodText: {
    flex: 1,
    gap: Spacing.half,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  totalPrice: {
    color: '#059669',
    fontSize: 18,
  },
  placeOrderButton: {
    backgroundColor: '#059669',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  disabledButton: {
    opacity: 0.5,
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
