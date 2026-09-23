import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskFormModal } from '@/components/task-form-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { createTask, getTasks, updateTask } from '@/services/task-api';
import { CreateTaskInput, Task } from '@/types/task';

const SUGGESTION_CHIPS = [
  'Plan my day',
  'Pending tasks',
  'Create a task',
  'Order food',
];

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  }
  if (hour >= 17 && hour < 22) {
    return 'Good evening';
  }
  return 'Good night';
}

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isWide } = useResponsive();
  const [prompt, setPrompt] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      // Retain existing task state if fetch fails temporarily
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchTasks();
    }, [fetchTasks]),
  );

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

  const handleToggleTaskCompletion = async (task: Task) => {
    const updatedCompleted = !task.completed;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: updatedCompleted } : t)),
    );
    try {
      await updateTask(task.id, { completed: updatedCompleted });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)),
      );
    }
  };

  const handleCreateTask = async (input: CreateTaskInput) => {
    setIsSavingTask(true);
    try {
      await createTask(input);
      setIsFormVisible(false);
      await fetchTasks();
    } finally {
      setIsSavingTask(false);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const todayTasks = tasks.slice(0, 3);
  const pendingCount = pendingTasks.length;

  const taskSummaryText =
    pendingCount > 0
      ? `You have ${pendingCount} task${pendingCount === 1 ? '' : 's'} to take care of today.`
      : 'Your day is clear. What would you like to accomplish?';

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
            {/* Header Dynamic Greeting */}
            <View style={styles.header}>
              <ThemedText type="title">{getTimeBasedGreeting()}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {taskSummaryText}
              </ThemedText>
            </View>

            {/* AI Assistant Hero Section */}
            <ThemedView type="backgroundElement" style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <ThemedText type="subtitle">What can I help you with?</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Ask me anything about your tasks, schedule or plans.
                </ThemedText>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  multiline
                  onChangeText={setPrompt}
                  onSubmitEditing={() => handleAskAssistant()}
                  placeholder="Ask your assistant..."
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

              {/* Redesigned suggestion chips */}
              <View style={styles.samplePromptsContainer}>
                <View style={styles.sampleChipsRow}>
                  {SUGGESTION_CHIPS.map((sample, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleAskAssistant(sample)}
                      style={({ pressed }) => [
                        styles.chipButton,
                        pressed && styles.pressed,
                      ]}>
                      <ThemedView type="backgroundSelected" style={styles.chipContent}>
                        <ThemedText type="small">{sample}</ThemedText>
                      </ThemedView>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ThemedView>

            {/* Today Section */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleGroup}>
                <ThemedText type="subtitle">Today</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {pendingCount > 0
                    ? `${pendingCount} task${pendingCount === 1 ? '' : 's'} remaining`
                    : 'No tasks remaining'}
                </ThemedText>
              </View>
              <Pressable
                onPress={handleNavigateManageTasks}
                style={({ pressed }) => pressed && styles.pressed}>
                <ThemedText type="smallBold" style={styles.actionLinkText}>
                  See all →
                </ThemedText>
              </Pressable>
            </View>

            <ThemedView type="backgroundElement" style={styles.todayCard}>
              {todayTasks.length === 0 ? (
                <View style={styles.emptyTodayState}>
                  <ThemedText type="smallBold">No tasks for today</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Ask the assistant to create one.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.todayTaskList}>
                  {todayTasks.map((t) => (
                    <View key={t.id} style={styles.todayTaskRow}>
                      <Pressable
                        onPress={() => void handleToggleTaskCompletion(t)}
                        style={styles.checkboxContainer}>
                        <View
                          style={[
                            styles.checkboxCircle,
                            { borderColor: theme.textSecondary },
                            t.completed && styles.checkboxCircleCompleted,
                          ]}>
                          {t.completed && <ThemedText style={styles.checkmarkText}>✓</ThemedText>}
                        </View>
                      </Pressable>
                      <View style={styles.todayTaskContent}>
                        <ThemedText
                          type="default"
                          style={[t.completed && styles.completedTaskText]}>
                          {t.title}
                        </ThemedText>
                      </View>
                      {t.priority === 'HIGH' && (
                        <View style={styles.highPriorityBadge}>
                          <ThemedText type="smallBold" style={styles.highPriorityBadgeText}>
                            HIGH
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ThemedView>

            {/* Quick Actions Section */}
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle">Quick Actions</ThemedText>
            </View>

            <View style={[styles.compactQuickActionsGrid, isWide && styles.compactQuickActionsGridWide]}>
              {/* + New task */}
              <Pressable
                onPress={() => setIsFormVisible(true)}
                style={({ pressed }) => [
                  styles.compactActionChip,
                  isWide && styles.compactActionChipWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView type="backgroundElement" style={styles.compactActionContent}>
                  <ThemedText type="smallBold">+ New task</ThemedText>
                </ThemedView>
              </Pressable>

              {/* 🍔 Order food */}
              <Pressable
                onPress={handleNavigateOrderFood}
                style={({ pressed }) => [
                  styles.compactActionChip,
                  isWide && styles.compactActionChipWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView type="backgroundElement" style={styles.compactActionContent}>
                  <ThemedText type="smallBold">🍔 Order food</ThemedText>
                </ThemedView>
              </Pressable>

              {/* ✨ Plan my day */}
              <Pressable
                onPress={() => handleAskAssistant('Plan my day')}
                style={({ pressed }) => [
                  styles.compactActionChip,
                  isWide && styles.compactActionChipWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView type="backgroundElement" style={styles.compactActionContent}>
                  <ThemedText type="smallBold">✨ Plan my day</ThemedText>
                </ThemedView>
              </Pressable>

              {/* ✓ View tasks */}
              <Pressable
                onPress={handleNavigateManageTasks}
                style={({ pressed }) => [
                  styles.compactActionChip,
                  isWide && styles.compactActionChipWide,
                  pressed && styles.pressed,
                ]}>
                <ThemedView type="backgroundElement" style={styles.compactActionContent}>
                  <ThemedText type="smallBold">✓ View tasks</ThemedText>
                </ThemedView>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <TaskFormModal
        error={null}
        isSaving={isSavingTask}
        onClose={() => setIsFormVisible(false)}
        onSave={handleCreateTask}
        task={null}
        visible={isFormVisible}
      />
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
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  header: {
    gap: Spacing.one,
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
    marginTop: Spacing.half,
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
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  sectionHeaderTitleGroup: {
    gap: 2,
  },
  sectionHeader: {
    marginTop: Spacing.two,
  },
  todayCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  emptyTodayState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  todayTaskList: {
    gap: Spacing.three,
  },
  todayTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  checkboxContainer: {
    padding: 2,
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleCompleted: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todayTaskContent: {
    flex: 1,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  highPriorityBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highPriorityBadgeText: {
    color: '#EF4444',
    fontSize: 10,
  },
  compactQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  compactQuickActionsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compactActionChip: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Spacing.three,
  },
  compactActionChipWide: {
    flexBasis: '23%',
    flexGrow: 1,
  },
  compactActionContent: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLinkText: {
    color: '#2563EB',
  },
  pressed: {
    opacity: 0.75,
  },
});
