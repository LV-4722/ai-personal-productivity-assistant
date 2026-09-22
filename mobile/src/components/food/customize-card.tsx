import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Customization, CustomizationOption, Item } from '@/types/food';

interface Props {
  item: Item | undefined;
  options: CustomizationOption[];
  onConfirm: (customization: Customization, quantity: number) => void;
  disabled?: boolean;
}

export function CustomizeCard({ item, options, onConfirm, disabled }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const theme = useTheme();

  const toggleOption = (optionName: string) => {
    setSelectedOptions((current) =>
      current.includes(optionName)
        ? current.filter((name) => name !== optionName)
        : [...current, optionName]
    );
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncreaseQuantity = () => {
    if (quantity < 10) {
      setQuantity((q) => q + 1);
    }
  };

  const calculateTotal = () => {
    const basePrice = item ? item.price : 0;
    const extrasPrice = selectedOptions.reduce((acc, optName) => {
      const found = options.find((o) => o.name === optName);
      return acc + (found ? found.price : 0);
    }, 0);
    return (basePrice + extrasPrice) * quantity;
  };

  const handleContinue = () => {
    const extras: string[] = [];
    const removals: string[] = [];

    for (const optName of selectedOptions) {
      const found = options.find((o) => o.name === optName);
      if (found && found.type === 'REMOVAL') {
        removals.push(optName);
      } else {
        extras.push(optName);
      }
    }

    const customization: Customization = {
      itemId: item ? item.id : 'unknown',
      notes: notes.trim() || null,
      extras,
      removals,
    };

    onConfirm(customization, quantity);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 5: CUSTOMIZE ITEM
      </ThemedText>

      {item ? (
        <View style={styles.itemHeader}>
          <ThemedText type="subtitle">{item.name}</ThemedText>
          <ThemedText type="smallBold" style={styles.price}>
            ${item.price.toFixed(2)} each
          </ThemedText>
        </View>
      ) : null}

      {/* Quantity Selector */}
      <View style={styles.section}>
        <ThemedText type="smallBold">Quantity</ThemedText>
        <View style={styles.quantityRow}>
          <Pressable
            disabled={disabled || quantity <= 1}
            style={({ pressed }) => [
              styles.quantityButton,
              (disabled || quantity <= 1) && styles.disabledButton,
              pressed && styles.pressed,
            ]}
            onPress={handleDecreaseQuantity}>
            <ThemedText type="subtitle">-</ThemedText>
          </Pressable>

          <ThemedText type="subtitle" style={styles.quantityText}>
            {quantity}
          </ThemedText>

          <Pressable
            disabled={disabled || quantity >= 10}
            style={({ pressed }) => [
              styles.quantityButton,
              (disabled || quantity >= 10) && styles.disabledButton,
              pressed && styles.pressed,
            ]}
            onPress={handleIncreaseQuantity}>
            <ThemedText type="subtitle">+</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Customization Options */}
      {options.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="smallBold">Options & Add-ons</ThemedText>
          <View style={styles.optionsGrid}>
            {options.map((opt) => {
              const isSelected = selectedOptions.includes(opt.name);
              return (
                <Pressable
                  key={opt.id}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.optChip,
                    isSelected && styles.optChipSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => toggleOption(opt.name)}>
                  <ThemedText type="smallBold">
                    {isSelected ? '✓ ' : '+ '}
                    {opt.name}
                    {opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Special Instructions */}
      <View style={styles.section}>
        <ThemedText type="smallBold">Special Instructions / Notes</ThemedText>
        <TextInput
          editable={!disabled}
          multiline
          onChangeText={setNotes}
          placeholder="E.g. Extra spicy, sauce on the side..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.notesInput, { borderColor: theme.backgroundSelected, color: theme.text }]}
          value={notes}
        />
      </View>

      {/* Confirm Action */}
      <Pressable
        disabled={disabled}
        style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        onPress={handleContinue}>
        <ThemedText type="smallBold" style={styles.continueButtonText}>
          Continue · Total ${calculateTotal().toFixed(2)}
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  price: {
    color: '#059669',
  },
  section: {
    gap: Spacing.one,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  quantityText: {
    minWidth: 24,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  optChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  optChipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  notesInput: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    minHeight: 40,
    maxHeight: 80,
    padding: Spacing.two,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  continueButtonText: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
  },
});
