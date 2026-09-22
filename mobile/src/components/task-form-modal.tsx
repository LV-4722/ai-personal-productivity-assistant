import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { CreateTaskInput, Task, TaskPriority } from '@/types/task';

type TaskFormModalProps = {
  visible: boolean;
  task: Task | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: CreateTaskInput) => Promise<void>;
};

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

function dateInputValue(dueDate: string | null): string {
  if (!dueDate) {
    return '';
  }

  const date = new Date(dueDate);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function TaskFormModal({
  visible,
  task,
  isSaving,
  error,
  onClose,
  onSave,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const theme = useTheme();
  const { isWide } = useResponsive();

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setPriority(task?.priority ?? 'MEDIUM');
    setDueDate(dateInputValue(task?.due_date ?? null));
    setValidationError(null);
  }, [task, visible]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedDueDate = dueDate.trim();

    if (!trimmedTitle) {
      setValidationError('Title is required.');
      return;
    }

    if (trimmedDueDate && !isValidDateInput(trimmedDueDate)) {
      setValidationError('Due date must use the YYYY-MM-DD format.');
      return;
    }

    setValidationError(null);
    await onSave({
      title: trimmedTitle,
      description: description.trim() || null,
      priority,
      due_date: trimmedDueDate ? `${trimmedDueDate}T00:00:00.000Z` : null,
    });
  };

  const displayedError = validationError ?? error;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={() => {
        if (!isSaving) {
          onClose();
        }
      }}>
      <View style={[styles.backdrop, isWide && styles.backdropWide]}>
        <ThemedView type="background" style={[styles.modal, isWide && styles.modalWide]}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">{task ? 'Edit task' : 'New task'}</ThemedText>

            <View style={styles.field}>
              <ThemedText type="smallBold">Title</ThemedText>
              <TextInput
                autoFocus
                editable={!isSaving}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
                value={title}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Description</ThemedText>
              <TextInput
                editable={!isSaving}
                multiline
                onChangeText={setDescription}
                placeholder="Optional details"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  styles.descriptionInput,
                  { borderColor: theme.backgroundSelected, color: theme.text },
                ]}
                textAlignVertical="top"
                value={description}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Priority</ThemedText>
              <View style={styles.priorityOptions}>
                {PRIORITIES.map((option) => {
                  const isSelected = option === priority;

                  return (
                    <Pressable
                      disabled={isSaving}
                      key={option}
                      onPress={() => setPriority(option)}
                      style={styles.priorityOption}>
                      <ThemedView
                        type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                        style={styles.priorityOptionContent}>
                        <ThemedText type="smallBold">{option}</ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Due date</ThemedText>
              <TextInput
                editable={!isSaving}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
                value={dueDate}
              />
            </View>

            {displayedError ? (
              <ThemedText type="small" style={styles.errorText}>
                {displayedError}
              </ThemedText>
            ) : null}

            <View style={styles.actions}>
              <Pressable disabled={isSaving} onPress={onClose} style={styles.actionButton}>
                <ThemedView type="backgroundElement" style={styles.actionContent}>
                  <ThemedText type="smallBold">Cancel</ThemedText>
                </ThemedView>
              </Pressable>
              <Pressable disabled={isSaving} onPress={() => void handleSave()} style={styles.actionButton}>
                <ThemedView type="backgroundSelected" style={styles.actionContent}>
                  <ThemedText type="smallBold">{isSaving ? 'Saving...' : 'Save task'}</ThemedText>
                </ThemedView>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropWide: {
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modal: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    maxHeight: '90%',
    paddingHorizontal: Spacing.four,
    width: '100%',
  },
  modalWide: {
    maxWidth: 600,
    borderRadius: Spacing.four,
  },
  content: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  descriptionInput: {
    minHeight: 96,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  priorityOption: {
    flex: 1,
  },
  priorityOptionContent: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#D92D20',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
  actionButton: {
    borderRadius: Spacing.two,
  },
  actionContent: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
