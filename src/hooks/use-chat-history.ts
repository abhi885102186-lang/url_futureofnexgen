
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@/components/chat/chat-view';
import { devStorage } from './use-chat-history.dev';

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
};

const MAX_CONVERSATIONS = 20; // Keep a reasonable limit to avoid storage issues

// Use dev storage in development, otherwise use localStorage
const storage = process.env.NODE_ENV === 'development' ? devStorage : localStorage;


const useChatHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedHistory = storage.getItem('chatHistory');
      if (savedHistory) {
        const parsedHistory: Conversation[] = JSON.parse(savedHistory);
        parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
        setConversations(parsedHistory);
      }
    } catch (error) {
      console.error("Failed to load chat history from storage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveConversation = useCallback((messages: Message[], id: string | null): string | null => {
    if (messages.length === 0) return null;

    // Prune large data from messages before saving.
    // Only keep image/doc on the very last user message to avoid bloating localStorage.
    const lastUserMessageIndex = messages.findLastIndex(m => m.sender === 'user');
    const messagesToSave = messages.map((msg, index) => {
        if (msg.image && index !== lastUserMessageIndex) {
            // Create a new object without the image property
            const { image, ...rest } = msg;
            return { ...rest, text: `${msg.text} [Image attached]` };
        }
        if (msg.document && index !== lastUserMessageIndex) {
            const { document, ...rest } = msg;
            return { ...rest, text: `${msg.text} [Document: ${msg.document.name}]` };
        }
        return msg;
    });

    let newConversationId: string | null = null;
    
    setConversations(prev => {
        let updatedHistory: Conversation[];
        if (id) {
            updatedHistory = prev.map(c =>
                c.id === id ? { ...c, messages: messagesToSave, timestamp: Date.now(), title: messages[0].text.substring(0, 50) } : c
            );
        } else {
            newConversationId = crypto.randomUUID();
            const newConversation: Conversation = {
                id: newConversationId,
                title: messages[0].text.substring(0, 50),
                messages: messagesToSave,
                timestamp: Date.now(),
            };
            updatedHistory = [newConversation, ...prev];
        }

        updatedHistory.sort((a, b) => b.timestamp - a.timestamp);

        // Only prune if we are in production
        if (process.env.NODE_ENV !== 'development' && updatedHistory.length > MAX_CONVERSATIONS) {
            updatedHistory = updatedHistory.slice(0, MAX_CONVERSATIONS);
        }

        try {
            storage.setItem('chatHistory', JSON.stringify(updatedHistory));
        } catch (error: any) {
            if (process.env.NODE_ENV !== 'development' && error.name === 'QuotaExceededError') {
                console.error("Error saving to localStorage due to quota. Pruning history further.", error);
                // Aggressively prune history and try saving again.
                const prunedHistory = updatedHistory.slice(0, Math.max(0, updatedHistory.length - 5));
                try {
                   storage.setItem('chatHistory', JSON.stringify(prunedHistory));
                   return prunedHistory;
                } catch (finalError) {
                   console.error("Failed to save even after aggressive pruning.", finalError);
                }
            } else {
              console.error("Failed to save chat history", error);
            }
        }
        
        return updatedHistory;
    });

    return newConversationId;
  }, []);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find(convo => convo.id === id);
  }, [conversations]);

  return { conversations, saveConversation, getConversation, isLoaded };
};

export default useChatHistory;
