import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { TaskFormModal } from '@/components/task-form-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createTask, deleteTask, getTasks, updateTask } from '@/services/task-api';
import { CreateTaskInput, Task } from '@/types/task';

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);

  if (Number.isNaN(date.getTime())) {
    return dueDate;
  }

  return date.toLocaleDateString();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mutatingTaskId, setMutatingTaskId] = useState<number | null>(null);
  const hasLoadedTasksRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const theme = useTheme();

  const refreshTasks = useCallback(async () => {
    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;
    const isInitialLoad = !hasLoadedTasksRef.current;

    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setListError(null);

    try {
      setTasks(await getTasks());
      hasLoadedTasksRef.current = true;
    } catch (error) {
      setListError(errorMessage(error, 'Unable to load tasks.'));
    } finally {
      isRefreshingRef.current = false;

      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshTasks();
    }, [refreshTasks]),
  );

  const openCreateForm = () => {
    setActionError(null);
    setEditingTask(null);
    setIsFormVisible(true);
  };

  const openEditForm = (task: Task) => {
    setActionError(null);
    setEditingTask(task);
    setIsFormVisible(true);
  };

  const closeForm = () => {
    if (isSubmitting) {
      return;
    }

    setIsFormVisible(false);
    setEditingTask(null);
    setActionError(null);
  };

  const handleFormSave = async (input: CreateTaskInput) => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editingTask) {
        await updateTask(editingTask.id, input);
      } else {
        await createTask(input);
      }

      setIsFormVisible(false);
      setEditingTask(null);
      await refreshTasks();
    } catch (error) {
      setActionError(errorMessage(error, 'Unable to save task.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompleted = async (task: Task) => {
    setMutatingTaskId(task.id);
    setActionError(null);

    try {
      await updateTask(task.id, { completed: !task.completed });
      await refreshTasks();
    } catch (error) {
      setActionError(errorMessage(error, 'Unable to update task.'));
    } finally {
      setMutatingTaskId(null);
    }
  };

  const deleteSelectedTask = async (task: Task) => {
    setMutatingTaskId(task.id);
    setActionError(null);

    try {
      await deleteTask(task.id);
      await refreshTasks();
    } catch (error) {
      setActionError(errorMessage(error, 'Unable to delete task.'));
    } finally {
      setMutatingTaskId(null);
    }
  };

  const handleDelete = (task: Task) => {
    Alert.alert('Delete task?', `Delete “${task.title}”? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteSelectedTask(task);
        },
      },
    ]);
  };

  const renderTask = ({ item }: { item: Task }) => {
    const isMutating = mutatingTaskId === item.id;
    const status = item.completed ? 'Completed' : 'Pending';

    return (
      <ThemedView
        type="backgroundElement"
        style={[styles.taskCard, item.completed && styles.completedTaskCard]}>
        <View style={styles.taskHeader}>
          <ThemedText style={[styles.taskTitle, item.completed && styles.completedTaskTitle]}>
            {item.title}
          </ThemedText>
          <ThemedView type="backgroundSelected" style={styles.priorityBadge}>
            <ThemedText type="code">{item.priority}</ThemedText>
          </ThemedView>
        </View>

        {item.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {item.description}
          </ThemedText>
        ) : null}

        <ThemedText type="small" themeColor="textSecondary">
          {status}
          {item.due_date ? ` · Due ${formatDueDate(item.due_date)}` : ''}
        </ThemedText>

        <View style={styles.taskActions}>
          <Pressable
            disabled={isMutating}
            onPress={() => void handleToggleCompleted(item)}
            style={styles.taskActionButton}>
            <ThemedView type="backgroundSelected" style={styles.taskActionContent}>
              <ThemedText type="smallBold">
                {isMutating ? 'Saving...' : item.completed ? 'Mark pending' : 'Complete'}
              </ThemedText>
            </ThemedView>
          </Pressable>
          <Pressable
            disabled={isMutating}
            onPress={() => openEditForm(item)}
            style={styles.taskActionButton}>
            <ThemedView type="backgroundSelected" style={styles.taskActionContent}>
              <ThemedText type="smallBold">Edit</ThemedText>
            </ThemedView>
          </Pressable>
          <Pressable
            disabled={isMutating}
            onPress={() => handleDelete(item)}
            style={styles.taskActionButton}>
            <ThemedView type="backgroundSelected" style={styles.taskActionContent}>
              <ThemedText type="smallBold">Delete</ThemedText>
            </ThemedView>
          </Pressable>
        </View>
      </ThemedView>
    );
  };

  const showInitialError = Boolean(listError && tasks.length === 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <ThemedText type="subtitle">Tasks</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Your current task list
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel="Refresh tasks"
              disabled={isLoading || isRefreshing}
              onPress={() => void refreshTasks()}
              style={styles.addButton}>
              <ThemedView type="backgroundSelected" style={styles.addButtonContent}>
                <ThemedText type="smallBold">{isRefreshing ? 'Refreshing...' : 'Refresh'}</ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable onPress={openCreateForm} style={styles.addButton}>
              <ThemedView type="backgroundSelected" style={styles.addButtonContent}>
                <ThemedText type="smallBold">Add task</ThemedText>
              </ThemedView>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centeredState}>
            <ThemedText>Loading tasks…</ThemedText>
          </View>
        ) : showInitialError ? (
          <View style={styles.centeredState}>
            <ThemedText type="small" style={styles.errorText}>
              {listError}
            </ThemedText>
            <Pressable onPress={() => void refreshTasks()} style={styles.retryButton}>
              <ThemedView type="backgroundElement" style={styles.retryButtonContent}>
                <ThemedText type="smallBold">Try again</ThemedText>
              </ThemedView>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => String(item.id)}
            onRefresh={() => void refreshTasks()}
            refreshing={isRefreshing}
            contentContainerStyle={[
              styles.listContent,
              tasks.length === 0 && styles.emptyListContent,
            ]}
            ListHeaderComponent={
              actionError || listError ? (
                <ThemedView type="backgroundElement" style={styles.errorBanner}>
                  <ThemedText type="small" style={styles.errorText}>
                    {actionError ?? listError}
                  </ThemedText>
                </ThemedView>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.centeredState}>
                <ThemedText>No tasks yet.</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Add your first task to get started.
                </ThemedText>
              </View>
            }
            style={{ backgroundColor: theme.background }}
          />
        )}
      </SafeAreaView>

      <TaskFormModal
        error={actionError}
        isSaving={isSubmitting}
        onClose={closeForm}
        onSave={handleFormSave}
        task={editingTask}
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  addButton: { borderRadius: Spacing.two },
  headerActions: { flexDirection: 'row', gap: Spacing.two },
  addButtonContent: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  listContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  emptyListContent: { flexGrow: 1 },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  taskCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  completedTaskCard: { opacity: 0.65 },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  taskTitle: { flex: 1, fontWeight: 700 },
  completedTaskTitle: { textDecorationLine: 'line-through' },
  priorityBadge: {
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  taskActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  taskActionButton: { borderRadius: Spacing.one },
  taskActionContent: {
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  errorBanner: { borderRadius: Spacing.two, padding: Spacing.two },
  errorText: { color: '#D92D20', textAlign: 'center' },
  retryButton: { borderRadius: Spacing.two },
  retryButtonContent: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
