import mqtt, { MqttClient } from 'mqtt';
import {
  AppError,
  ConnectionStatus,
  MqttConnectConfig,
  MqttPayload,
} from '../types';

function createAppError(code: AppError['code'], message: string) {
  return Object.assign(new Error(message), { code });
}

export interface MqttService {
  connect(config: MqttConnectConfig): Promise<void>;
  disconnect(): void;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  publish(topic: string, payload: MqttPayload): void;
  onMessage(cb: (topic: string, payload: MqttPayload) => void): () => void;
  getStatus(): ConnectionStatus;
  onStatusChange(cb: (status: ConnectionStatus) => void): () => void;
}

function buildUrl(config: MqttConnectConfig): string {
  const protocol = config.useSsl ? 'wss' : 'ws';
  return `${protocol}://${config.host}:${config.port}/mqtt`;
}

const statusHandlers = new Set<(status: ConnectionStatus) => void>();
const messageHandlers = new Set<(topic: string, payload: MqttPayload) => void>();
let client: MqttClient | null = null;
let currentStatus: ConnectionStatus = 'disconnected';
let connectPromise: Promise<void> | null = null;
let connectSettled = false;

function notifyStatus(status: ConnectionStatus) {
  currentStatus = status;
  statusHandlers.forEach((handler) => handler(status));
}

function resetClient() {
  if (!client) {
    return;
  }

  try {
    client.removeAllListeners();
    client.end(true);
  } catch {
    // ignore cleanup failures
  }

  client = null;
}

export class MqttServiceImpl implements MqttService {
  connect(config: MqttConnectConfig): Promise<void> {
    if (client && currentStatus === 'connected') {
      return Promise.resolve();
    }

    if (connectPromise) {
      return connectPromise;
    }

    connectSettled = false;
    notifyStatus('connecting');

    connectPromise = new Promise<void>((resolve, reject) => {
      let resolved = false;
      let rejected = false;

      try {
        resetClient();
        const url = buildUrl(config);
        client = mqtt.connect(url, {
          clientId: config.clientId,
          reconnectPeriod: 5000,
        });

        const handleConnect = () => {
          if (resolved || rejected) {
            return;
          }
          resolved = true;
          connectSettled = true;
          notifyStatus('connected');
          resolve();
        };

        const handleError = () => {
          if (!resolved && !rejected) {
            rejected = true;
            connectSettled = true;
            notifyStatus('error');
            reject(createAppError('CONNECTION_FAILED', 'Failed to connect to MQTT broker.'));
          } else {
            notifyStatus('error');
          }
        };

        const handleReconnect = () => {
          notifyStatus('connecting');
        };

        const handleClose = () => {
          if (!connectSettled) {
            return;
          }
          notifyStatus('disconnected');
        };

        const handleMessage = (topic: string, messageBytes: Buffer | string) => {
          let parsed: MqttPayload;

          try {
            const message = typeof messageBytes === 'string' ? messageBytes : messageBytes.toString();
            parsed = JSON.parse(message) as MqttPayload;
          } catch {
            return;
          }

          messageHandlers.forEach((handler) => handler(topic, parsed));
        };

        client.on('connect', handleConnect);
        client.on('reconnect', handleReconnect);
        client.on('close', handleClose);
        client.on('error', handleError);
        client.on('message', handleMessage);
      } catch {
        rejected = true;
        connectSettled = true;
        notifyStatus('error');
        reject(createAppError('CONNECTION_FAILED', 'Failed to create MQTT client.'));
      }
    }).finally(() => {
      connectPromise = null;
    });

    return connectPromise;
  }

  disconnect(): void {
    if (!client) {
      return;
    }

    resetClient();
    notifyStatus('disconnected');
  }

  subscribe(topic: string): void {
    if (!client) {
      return;
    }

    client.subscribe(topic);
  }

  unsubscribe(topic: string): void {
    if (!client) {
      return;
    }

    client.unsubscribe(topic);
  }

  publish(topic: string, payload: MqttPayload): void {
    if (!client) {
      return;
    }

    client.publish(topic, JSON.stringify(payload));
  }

  onMessage(cb: (topic: string, payload: MqttPayload) => void): () => void {
    messageHandlers.add(cb);

    return () => {
      messageHandlers.delete(cb);
    };
  }

  getStatus(): ConnectionStatus {
    return currentStatus;
  }

  onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    statusHandlers.add(cb);

    return () => {
      statusHandlers.delete(cb);
    };
  }
}
