import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { Item } from '@/types/food';

interface Props {
  items: Item[];
  onSelect: (item: Item) => void;
  disabled?: boolean;
}

export function ItemCardList({ items, onSelect, disabled }: Props) {
  const { isWide } = useResponsive();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 4: SELECT MENU ITEM
      </ThemedText>

      {items.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No items available for this restaurant.
        </ThemedText>
      ) : (
        <View style={[styles.list, isWide && styles.listWide]}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              disabled={disabled}
              style={({ pressed }) => [
                styles.card,
                isWide && styles.cardWide,
                pressed && styles.pressed,
              ]}
              onPress={() => onSelect(item)}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.itemName}>
                  {item.name}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.price}>
                  ${item.price.toFixed(2)}
                </ThemedText>
              </View>

              {item.description ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.description}
                </ThemedText>
              ) : null}
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
  itemName: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  price: {
    color: '#059669',
  },
});
