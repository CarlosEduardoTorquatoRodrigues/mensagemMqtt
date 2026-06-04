import { useEffect, useRef, useState } from 'react';
import { MqttServiceImpl } from '../services/mqttService';
import {
  ConnectionStatus,
  MqttConnectConfig,
  MqttPayload,
} from '../types';

type MessageHandler = (topic: string, payload: MqttPayload) => void;

const service = new MqttServiceImpl();

export function useMqtt() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const handlersRef = useRef(new Set<MessageHandler>());
  const statusDisposeRef = useRef<() => void | null>(null);

  useEffect(() => {
    statusDisposeRef.current = service.onStatusChange((s) => setStatus(s));

    const disposeMsg = service.onMessage((topic, payload) => {
      handlersRef.current.forEach((h) => h(topic, payload));
    });

    return () => {
      disposeMsg();
      if (statusDisposeRef.current) {
        statusDisposeRef.current();
      }
      service.disconnect();
    };
  }, []);

  async function connect(config: MqttConnectConfig) {
    try {
      await service.connect(config);
      // status is updated via onStatusChange listener
    } catch (e) {
      // nunca derrubar o app: apenas refletir status 'error'
      setStatus('error');
    }
  }

  function subscribe(topic: string) {
    try {
      service.subscribe(topic);
    } catch {
      // ignore
    }
  }

  function unsubscribe(topic: string) {
    try {
      service.unsubscribe(topic);
    } catch {
      // ignore
    }
  }

  function sendMessage(topic: string, payload: MqttPayload) {
    try {
      service.publish(topic, payload);
    } catch {
      // ignore
    }
  }

  function addMessageListener(cb: MessageHandler) {
    handlersRef.current.add(cb);
    return () => handlersRef.current.delete(cb);
  }

  return {
    status,
    connect,
    subscribe,
    unsubscribe,
    sendMessage,
    addMessageListener,
  } as const;
}
