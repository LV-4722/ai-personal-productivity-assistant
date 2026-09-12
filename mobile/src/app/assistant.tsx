import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendAssistantMessage } from '@/services/assistant-api';
import { AssistantResponse } from '@/types/assistant';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hi! I can help you manage your tasks. Try asking me to create, update, complete, or list a task.',
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to reach the assistant.';
}

function formatAssistantResponse(response: AssistantResponse): string {
  const details: string[] = [response.message];

  if (response.task) {
    const task = response.task;
    details.push(
      `Task: ${task.title} · ${task.priority} · ${task.completed ? 'Completed' : 'Pending'}${
        task.due_date ? ` · Due ${new Date(task.due_date).toLocaleString()}` : ''
      }`,
    );
  }

  if (response.tasks) {
    details.push(
      response.tasks.length === 0
        ? 'No matching tasks.'
        : response.tasks.map((task) => `• ${task.title} (${task.priority})`).join('\n'),
    );
  }

  return details.join('\n\n');
}

export default function AssistantScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const theme = useTheme();

  const sendMessage = async () => {
    const text = input.trim();

    if (!text || isSending) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text },
    ]);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const response = await sendAssistantMessage(text);

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: formatAssistantResponse(response),
        },
      ]);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
        <ThemedView
          type={isUser ? 'backgroundSelected' : 'backgroundElement'}
          style={styles.messageBubble}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {isUser ? 'You' : 'Assistant'}
          </ThemedText>
          <ThemedText style={styles.messageText}>{item.text}</ThemedText>
        </ThemedView>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.container}>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Assistant</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Ask naturally about your tasks.
            </ThemedText>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            style={styles.messagesList}
          />

          {error ? (
            <ThemedView type="backgroundElement" style={styles.errorBanner}>
              <ThemedText type="small" style={styles.errorText}>
                {error}
              </ThemedText>
            </ThemedView>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              editable={!isSending}
              multiline
              onChangeText={setInput}
              placeholder="Ask about your tasks..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
              value={input}
            />
            <Pressable disabled={isSending || !input.trim()} onPress={() => void sendMessage()}>
              <ThemedView type="backgroundSelected" style={styles.sendButton}>
                <ThemedText type="smallBold">{isSending ? 'Sending...' : 'Send'}</ThemedText>
              </ThemedView>
            </Pressable>
          </View>
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
  header: { gap: Spacing.half, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  messagesList: { flex: 1 },
  messagesContent: { gap: Spacing.two, paddingHorizontal: Spacing.four, paddingBottom: Spacing.three },
  messageRow: { alignItems: 'flex-start' },
  userMessageRow: { alignItems: 'flex-end' },
  messageBubble: { borderRadius: Spacing.three, gap: Spacing.one, maxWidth: '88%', padding: Spacing.three },
  messageText: { flexShrink: 1 },
  errorBanner: { borderRadius: Spacing.two, marginHorizontal: Spacing.four, padding: Spacing.two },
  errorText: { color: '#D92D20' },
  composer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  input: { borderRadius: Spacing.two, borderWidth: 1, flex: 1, maxHeight: 120, minHeight: 44, padding: Spacing.two },
  sendButton: { borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
});
