import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { DeliveryMode } from '@/types/food';

interface Props {
  onSelect: (mode: DeliveryMode) => void;
  disabled?: boolean;
}

const MODES: { mode: DeliveryMode; title: string; subtitle: string; icon: string }[] = [
  {
    mode: 'DELIVERY',
    title: 'Delivery',
    subtitle: 'Food delivered to your doorstep',
    icon: '🛵',
  },
  {
    mode: 'PICKUP',
    title: 'Pickup',
    subtitle: 'Pick up your order yourself',
    icon: '🏃',
  },
  {
    mode: 'DINE_IN',
    title: 'Dine In',
    subtitle: 'Eat at the restaurant',
    icon: '🍽️',
  },
];

export function DeliveryModeCard({ onSelect, disabled }: Props) {
  const { isWide } = useResponsive();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 1: SELECT DELIVERY MODE
      </ThemedText>

      <View style={[styles.optionsList, isWide && styles.optionsListWide]}>
        {MODES.map((item) => (
          <Pressable
            key={item.mode}
            disabled={disabled}
            style={({ pressed }) => [
              styles.optionCard,
              isWide && styles.optionCardWide,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(item.mode)}>
            <ThemedText style={styles.icon}>{item.icon}</ThemedText>
            <View style={styles.textContainer}>
              <ThemedText type="subtitle">{item.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.subtitle}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: Spacing.two,
  },
  optionsListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    gap: Spacing.three,
  },
  optionCardWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    maxWidth: 320,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.half,
  },
});
