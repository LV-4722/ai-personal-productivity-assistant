import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { Restaurant } from '@/types/food';

interface Props {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
  disabled?: boolean;
}

export function RestaurantCardList({ restaurants, onSelect, disabled }: Props) {
  const { isWide } = useResponsive();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 3: CHOOSE A RESTAURANT
      </ThemedText>

      {restaurants.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No restaurants available.
        </ThemedText>
      ) : (
        <View style={[styles.list, isWide && styles.listWide]}>
          {restaurants.map((restaurant) => (
            <Pressable
              key={restaurant.id}
              disabled={disabled}
              style={({ pressed }) => [
                styles.card,
                isWide && styles.cardWide,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect(restaurant)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle">{restaurant.name}</ThemedText>
                {restaurant.rating ? (
                  <View style={styles.badge}>
                    <ThemedText type="smallBold" style={styles.badgeText}>
                      ★ {restaurant.rating.toFixed(1)}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cuisine: {restaurant.cuisine}
                </ThemedText>
                {restaurant.estimatedDeliveryMinutes ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    ⏱ ~{restaurant.estimatedDeliveryMinutes} mins
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}
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
  list: {
    gap: Spacing.two,
  },
  listWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    gap: Spacing.one,
  },
  cardWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    maxWidth: 440,
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.one,
  },
  badgeText: {
    color: '#D97706',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
