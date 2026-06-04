import { useEffect, useRef, useState } from 'react';
import { mqttService } from '../services/mqttService';
import { conversationRepository } from '../repositories/conversationRepository';
import { messageRepository } from '../repositories/messageRepository';
import {
  AppError,
  ConnectionStatus,
  Conversation,
  Message,
  MqttPayload,
  Settings,
} from '../types';

export interface UseMqttResult {
  status: ConnectionStatus;
  sendMessage: (
    conversation: Conversation,
    body: string,
    sender: string
  ) => Promise<Message>;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
}

export function useMqtt(
  settings: Settings | null,
  topics: string[],
  onReceivedMessage?: (message: Message) => void
): UseMqttResult {
  const [status, setStatus] = useState<ConnectionStatus>(mqttService.getStatus());
  const previousTopicsRef = useRef<string[]>([]);

  useEffect(() => {
    const unsubscribe = mqttService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!settings) {
      mqttService.disconnect();
      setStatus('disconnected');
      previousTopicsRef.current = [];
      return;
    }

    const connect = async () => {
      try {
        await mqttService.connect({
          host: settings.brokerHost,
          port: settings.brokerPort,
          useSsl: settings.useSsl,
          clientId: settings.clientId,
        });
      } catch {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
    };
  }, [settings]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    const subscribeChanges = () => {
      const currentTopics = previousTopicsRef.current;
      const addedTopics = topics.filter((topic) => !currentTopics.includes(topic));
      const removedTopics = currentTopics.filter((topic) => !topics.includes(topic));

      addedTopics.forEach((topic) => mqttService.subscribe(topic));
      removedTopics.forEach((topic) => mqttService.unsubscribe(topic));
      previousTopicsRef.current = topics;
    };

    if (status === 'connected') {
      subscribeChanges();
    }
  }, [settings, status, topics]);

  useEffect(() => {
    if (!settings) {
      return;
    }

    const unsubscribe = mqttService.onMessage(async (topic, payload) => {
      if (payload.clientId === settings.clientId) {
        return;
      }

      const conversation = await conversationRepository.findByTopic(topic);
      if (!conversation) {
        return;
      }

      const message = await messageRepository.create({
        conversationId: conversation.id,
        sender: payload.sender,
        body: payload.body,
        direction: 'received',
      });

      onReceivedMessage?.(message);
    });

    return unsubscribe;
  }, [settings, onReceivedMessage]);

  const sendMessage = async (
    conversation: Conversation,
    body: string,
    sender: string
  ): Promise<Message> => {
    const trimmedBody = body.trim();
    if (!settings) {
      throw new Error('Sem configuração de cliente');
    }
    if (!trimmedBody) {
      throw new Error('Mensagem vazia');
    }

    const message = await messageRepository.create({
      conversationId: conversation.id,
      sender,
      body: trimmedBody,
      direction: 'sent',
    });

    const payload: MqttPayload = {
      clientId: settings.clientId,
      sender,
      body: trimmedBody,
      sentAt: new Date().toISOString(),
    };

    mqttService.publish(conversation.topic, payload);
    return message;
  };

  const subscribe = (topic: string): void => {
    mqttService.subscribe(topic);
  };

  const unsubscribe = (topic: string): void => {
    mqttService.unsubscribe(topic);
  };

  return {
    status,
    sendMessage,
    subscribe,
    unsubscribe,
  };
}
