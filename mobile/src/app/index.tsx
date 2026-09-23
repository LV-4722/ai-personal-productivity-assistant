import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

const SAMPLE_PROMPTS = [
  'Create a high priority task for tomorrow',
  'Order Indian food for dinner',
  'What tasks are pending?',
];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isWide } = useResponsive();
  const [prompt, setPrompt] = useState('');

  const handleAskAssistant = (customText?: string) => {
    const textToSend = (customText ?? prompt).trim();
    if (!textToSend) {
      return;
    }
    setPrompt('');
    router.push({
      pathname: '/assistant',
      params: { q: textToSend },
    });
  };

  const handleNavigateOrderFood = () => {
    router.push({
      pathname: '/assistant',
      params: { action: 'food' },
    });
  };

  const handleNavigateManageTasks = () => {
    router.push('/tasks');
  };

  const handleNavigateReminders = () => {
    router.push({
      pathname: '/tasks',
      params: { filter: 'reminders' },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header Greeting */}
            <View style={styles.header}>
              <ThemedText type="title">Welcome Back</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Your AI Assistant is ready to help you manage tasks and order food.
              </ThemedText>
            </View>

            {/* Assistant Input Hero Section */}
            <ThemedView type="backgroundElement" style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <ThemedText type="subtitle">Ask Assistant</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Type any request or question in natural language
                </ThemedText>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  multiline
                  onChangeText={setPrompt}
                  onSubmitEditing={() => handleAskAssistant()}
                  placeholder="e.g. Schedule a meeting tomorrow at 3 PM..."
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    { borderColor: theme.backgroundSelected, color: theme.text },
                  ]}
                  value={prompt}
                />
                <Pressable
                  disabled={!prompt.trim()}
                  onPress={() => handleAskAssistant()}
                  style={({ pressed }) => [
                    styles.submitButton,
                    !prompt.trim() && styles.disabledButton,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedView type="backgroundSelected" style={styles.submitButtonContent}>
                    <ThemedText type="smallBold">Ask →</ThemedText>
                  </ThemedView>
                </Pressable>
              </View>

              {/* Quick sample prompt chips */}
              <View style={styles.samplePromptsContainer}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sampleLabel}>
                  Try asking:
                </ThemedText>
                <View style={styles.sampleChipsRow}>
                  {SAMPLE_PROMPTS.map((sample, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleAskAssistant(sample)}
                      style={({ pressed }) => [
                        styles.chipButton,
                        pressed && styles.pressed,
                      ]}>
                      <ThemedView type="backgroundSelected" style={styles.chipContent}>
                        <ThemedText type="small">“{sample}”</ThemedText>
                      </ThemedView>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ThemedView>

            {/* Quick Actions Section */}
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Quick Actions</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Direct shortcuts to your assistant workflows
              </ThemedText>
            </View>

            <View style={[styles.quickActionsGrid, isWide && styles.quickActionsGridWide]}>
              {/* Card 1: Order Food */}
              <Pressable
                onPress={handleNavigateOrderFood}
                style={({ pressed }) => [
                  styles.actionCardWrapper,
                  isWide && styles.actionCardWrapperWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.actionCard, isWide && styles.actionCardWide]}>
                  <View style={styles.cardHeaderRow}>
                    <ThemedText type="subtitle">🍔 Order Food</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    Order meals with multi-step interactive checkout or AI assistance.
                  </ThemedText>
                  <View style={styles.cardFooter}>
                    <ThemedText type="smallBold" style={styles.actionLinkText}>
                      Start Order →
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>

              {/* Card 2: Manage Tasks */}
              <Pressable
                onPress={handleNavigateManageTasks}
                style={({ pressed }) => [
                  styles.actionCardWrapper,
                  isWide && styles.actionCardWrapperWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.actionCard, isWide && styles.actionCardWide]}>
                  <View style={styles.cardHeaderRow}>
                    <ThemedText type="subtitle">📋 Manage Tasks</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    View, create, edit, or complete your task items directly.
                  </ThemedText>
                  <View style={styles.cardFooter}>
                    <ThemedText type="smallBold" style={styles.actionLinkText}>
                      Open Tasks →
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>

              {/* Card 3: Reminders */}
              <Pressable
                onPress={handleNavigateReminders}
                style={({ pressed }) => [
                  styles.actionCardWrapper,
                  isWide && styles.actionCardWrapperWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView
                  type="backgroundElement"
                  style={[styles.actionCard, isWide && styles.actionCardWide]}>
                  <View style={styles.cardHeaderRow}>
                    <ThemedText type="subtitle">⏰ Reminders</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    Check tasks scheduled with due dates and upcoming reminders.
                  </ThemedText>
                  <View style={styles.cardFooter}>
                    <ThemedText type="smallBold" style={styles.actionLinkText}>
                      View Reminders →
                    </ThemedText>
                  </View>
                </ThemedView>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  scrollContent: {
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.half,
  },
  heroCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroHeader: {
    gap: Spacing.half,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  submitButton: {
    borderRadius: Spacing.three,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonContent: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  samplePromptsContainer: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  sampleLabel: {
    fontWeight: '600',
  },
  sampleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chipButton: {
    borderRadius: Spacing.two,
  },
  chipContent: {
    borderRadius: Spacing.two,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sectionHeader: {
    gap: Spacing.half,
    marginTop: Spacing.two,
  },
  quickActionsGrid: {
    gap: Spacing.three,
  },
  quickActionsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCardWrapper: {
    borderRadius: Spacing.three,
  },
  actionCardWrapperWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    maxWidth: 440,
  },
  actionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  actionCardWide: {
    height: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    marginTop: Spacing.one,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.75,
  },
});
