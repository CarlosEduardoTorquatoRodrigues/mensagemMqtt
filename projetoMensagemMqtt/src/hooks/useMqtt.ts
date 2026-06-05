import { useCallback, useEffect, useRef, useState } from 'react';
import { mqttService } from '../services/mqttService';
import { ConnectionStatus, MqttPayload, Settings } from '../types';

export interface UseMqttResult {
  status: ConnectionStatus;
  subscribe: (topic: string) => void;
  unsubscribe: (topic: string) => void;
  sendMessage: (topic: string, payload: MqttPayload) => void;
}

export function useMqtt(
  settings: Settings | null,
  topics: string[] = [],
  onMessage: (topic: string, payload: MqttPayload) => void,
): UseMqttResult {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!settings) {
      mqttService.disconnect();
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    const statusCancel = mqttService.onStatusChange((nextStatus) => {
      setStatus(nextStatus);
    });

    const messageCancel = mqttService.onMessage((topic, payload) => {
      if (payload.clientId === settings.clientId) {
        return;
      }
      onMessageRef.current(topic, payload);
    });

    mqttService
      .connect({
        host: settings.brokerHost,
        port: settings.brokerPort,
        useSsl: settings.useSsl,
        clientId: settings.clientId,
      })
      .catch(() => {
        setStatus('error');
      });

    return () => {
      messageCancel();
      statusCancel();
    };
  }, [
    settings?.brokerHost,
    settings?.brokerPort,
    settings?.useSsl,
    settings?.clientId,
  ]);

  useEffect(() => {
    if (!settings || topics.length === 0) {
      return;
    }

    topics.forEach((topic) => mqttService.subscribe(topic));

    return () => {
      topics.forEach((topic) => mqttService.unsubscribe(topic));
    };
  }, [settings?.clientId, JSON.stringify(topics)]);

  const subscribe = useCallback((topic: string) => {
    mqttService.subscribe(topic);
  }, []);

  const unsubscribe = useCallback((topic: string) => {
    mqttService.unsubscribe(topic);
  }, []);

  const sendMessage = useCallback((topic: string, payload: MqttPayload) => {
    mqttService.publish(topic, payload);
  }, []);

  return {
    status,
    subscribe,
    unsubscribe,
    sendMessage,
  };
}
