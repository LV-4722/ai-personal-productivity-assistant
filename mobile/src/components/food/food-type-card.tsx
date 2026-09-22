import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { FoodType } from '@/types/food';

interface Props {
  onSelect: (foodType: FoodType) => void;
  disabled?: boolean;
}

const CUISINES: { type: FoodType; label: string; emoji: string }[] = [
  { type: 'BURGER', label: 'Burger', emoji: '🍔' },
  { type: 'PIZZA', label: 'Pizza', emoji: '🍕' },
  { type: 'INDIAN', label: 'Indian', emoji: '🍛' },
  { type: 'CHINESE', label: 'Chinese', emoji: '🥢' },
  { type: 'SUSHI', label: 'Sushi', emoji: '🍣' },
  { type: 'MEXICAN', label: 'Mexican', emoji: '🌮' },
  { type: 'ITALIAN', label: 'Italian', emoji: '🍝' },
  { type: 'THAI', label: 'Thai', emoji: '🍲' },
  { type: 'MEDITERRANEAN', label: 'Mediterranean', emoji: '🥙' },
  { type: 'FAST_FOOD', label: 'Fast Food', emoji: '🍟' },
  { type: 'HEALTHY', label: 'Healthy', emoji: '🥗' },
  { type: 'DESSERT', label: 'Dessert', emoji: '🍰' },
];

export function FoodTypeCard({ onSelect, disabled }: Props) {
  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 2: SELECT CUISINE / FOOD TYPE
      </ThemedText>

      <View style={styles.grid}>
        {CUISINES.map((item) => (
          <Pressable
            key={item.type}
            disabled={disabled}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            onPress={() => onSelect(item.type)}>
            <ThemedText style={styles.emoji}>{item.emoji}</ThemedText>
            <ThemedText type="smallBold">{item.label}</ThemedText>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    backgroundColor: 'rgba(150, 150, 150, 0.12)',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
  emoji: {
    fontSize: 16,
  },
});
