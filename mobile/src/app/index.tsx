import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getTasks } from '@/services/task-api';
import { Task } from '@/types/task';

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);

  if (Number.isNaN(date.getTime())) {
    return dueDate;
  }

  return date.toLocaleDateString();
}

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setTasks(await getTasks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load tasks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const renderTask = ({ item }: { item: Task }) => {
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

        <ThemedText type="small" themeColor="textSecondary">
          {status}
          {item.due_date ? ` · Due ${formatDueDate(item.due_date)}` : ''}
        </ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Tasks</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Your current task list
          </ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.centeredState}>
            <ThemedText>Loading tasks…</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <ThemedText type="small" style={styles.errorText}>
              {error}
            </ThemedText>
            <Pressable onPress={() => void loadTasks()} style={styles.retryButton}>
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
            contentContainerStyle={[
              styles.listContent,
              tasks.length === 0 && styles.emptyListContent,
            ]}
            ListEmptyComponent={
              <View style={styles.centeredState}>
                <ThemedText>No tasks yet.</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Create a task from the backend to see it here.
                </ThemedText>
              </View>
            }
            style={{ backgroundColor: theme.background }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  listContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  emptyListContent: {
    flexGrow: 1,
  },
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
  completedTaskCard: {
    opacity: 0.65,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  taskTitle: {
    flex: 1,
    fontWeight: 700,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
  },
  priorityBadge: {
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  errorText: {
    color: '#D92D20',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: Spacing.two,
  },
  retryButtonContent: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
