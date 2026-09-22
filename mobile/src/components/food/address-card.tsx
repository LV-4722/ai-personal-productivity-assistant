import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { Address } from '@/types/food';

interface Props {
  addresses: Address[];
  onSelect: (address: Address) => void;
  disabled?: boolean;
}

export function AddressCardList({ addresses, onSelect, disabled }: Props) {
  const { isWide } = useResponsive();
  const [showForm, setShowForm] = useState(false);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const theme = useTheme();

  const handleAddCustomAddress = () => {
    if (!line1.trim() || !city.trim() || !postalCode.trim()) {
      return;
    }

    const newAddress: Address = {
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      state: state.trim() || null,
      postalCode: postalCode.trim(),
      country: country.trim() || 'US',
    };

    onSelect(newAddress);
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
        STEP 6: SELECT DELIVERY ADDRESS
      </ThemedText>

      {/* Saved Addresses List */}
      <View style={[styles.list, isWide && styles.listWide]}>
        {addresses.map((addr, index) => (
          <Pressable
            key={`${addr.line1}-${index}`}
            disabled={disabled}
            style={({ pressed }) => [
              styles.addressCard,
              isWide && styles.addressCardWide,
              pressed && styles.pressed,
            ]}
            onPress={() => onSelect(addr)}>
            <ThemedText style={styles.icon}>📍</ThemedText>
            <View style={styles.addressText}>
              <ThemedText type="subtitle">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}, {addr.country}
              </ThemedText>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Add New Address Toggle / Form */}
      {!showForm ? (
        <Pressable
          disabled={disabled}
          style={({ pressed }) => [styles.addAddressButton, pressed && styles.pressed]}
          onPress={() => setShowForm(true)}>
          <ThemedText type="smallBold" style={styles.addAddressText}>
            + Add New Address
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.formContainer}>
          <ThemedText type="smallBold">New Address Details</ThemedText>

          <TextInput
            editable={!disabled}
            onChangeText={setLine1}
            placeholder="Address Line 1 *"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
            value={line1}
          />
          <TextInput
            editable={!disabled}
            onChangeText={setLine2}
            placeholder="Address Line 2 (Apt, Suite, optional)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
            value={line2}
          />
          <View style={styles.row}>
            <TextInput
              editable={!disabled}
              onChangeText={setCity}
              placeholder="City *"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.flex1, { borderColor: theme.backgroundSelected, color: theme.text }]}
              value={city}
            />
            <TextInput
              editable={!disabled}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.flex1, { borderColor: theme.backgroundSelected, color: theme.text }]}
              value={state}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              editable={!disabled}
              onChangeText={setPostalCode}
              placeholder="Postal Code *"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.flex1, { borderColor: theme.backgroundSelected, color: theme.text }]}
              value={postalCode}
            />
            <TextInput
              editable={!disabled}
              onChangeText={setCountry}
              placeholder="Country"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.flex1, { borderColor: theme.backgroundSelected, color: theme.text }]}
              value={country}
            />
          </View>

          <View style={styles.formActions}>
            <Pressable
              disabled={disabled}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={() => setShowForm(false)}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable
              disabled={disabled || !line1.trim() || !city.trim() || !postalCode.trim()}
              style={({ pressed }) => [
                styles.saveButton,
                (!line1.trim() || !city.trim() || !postalCode.trim()) && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              onPress={handleAddCustomAddress}>
              <ThemedText type="smallBold" style={styles.saveButtonText}>
                Use This Address
              </ThemedText>
            </Pressable>
          </View>
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
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(150, 150, 150, 0.08)',
    gap: Spacing.three,
  },
  addressCardWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    maxWidth: 440,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 20,
  },
  addressText: {
    flex: 1,
    gap: Spacing.half,
  },
  addAddressButton: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  addAddressText: {
    color: '#2563EB',
  },
  formContainer: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    padding: Spacing.two,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  cancelButton: {
    padding: Spacing.two,
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});
