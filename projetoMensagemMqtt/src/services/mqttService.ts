import mqtt, { type MqttClient } from 'mqtt';
import {
  AppError,
  ConnectionStatus,
  MqttConnectConfig,
  MqttPayload,
} from '../types';

function createAppError(code: AppError['code'], message: string): Error & AppError {
  return Object.assign(new Error(message), { code, message });
}

function isMqttPayload(value: unknown): value is MqttPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).clientId === 'string' &&
    typeof (value as any).sender === 'string' &&
    typeof (value as any).body === 'string' &&
    typeof (value as any).sentAt === 'string'
  );
}

let client: MqttClient | null = null;
let status: ConnectionStatus = 'disconnected';
let connectPromise: Promise<void> | null = null;
const messageListeners: Array<(topic: string, payload: MqttPayload) => void> = [];
const statusListeners: Array<(status: ConnectionStatus) => void> = [];

function notifyStatus() {
  statusListeners.forEach((listener) => listener(status));
}

function cleanupClientEvents(currentClient: MqttClient) {
  currentClient.removeAllListeners('connect');
  currentClient.removeAllListeners('error');
  currentClient.removeAllListeners('reconnect');
  currentClient.removeAllListeners('close');
  currentClient.removeAllListeners('message');
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

export const mqttService: MqttService = {
  async connect(config) {
    if (connectPromise) {
      return connectPromise;
    }

    if (client) {
      cleanupClientEvents(client);
      client.end(true);
      client = null;
    }

    status = 'connecting';
    notifyStatus();

    const scheme = config.useSsl ? 'wss' : 'ws';
    const url = `${scheme}://${config.host}:${config.port}/mqtt`;

    try {
      client = mqtt.connect(url, {
        clientId: config.clientId,
        reconnectPeriod: 5000,
      });
    } catch {
      status = 'error';
      notifyStatus();
      return Promise.reject(createAppError('CONNECTION_FAILED', 'Failed to connect'));
    }

    connectPromise = new Promise<void>((resolve, reject) => {
      let settled = false;

      const handleConnect = () => {
        status = 'connected';
        notifyStatus();

        if (!settled) {
          settled = true;
          resolve();
        }
      };

      const handleError = () => {
        status = 'error';
        notifyStatus();

        if (!settled) {
          settled = true;
          reject(createAppError('CONNECTION_FAILED', 'Failed to connect'));
          connectPromise = null;
        }
      };

      const handleReconnect = () => {
        status = 'connecting';
        notifyStatus();
      };

      const handleClose = () => {
        status = 'disconnected';
        notifyStatus();
      };

      const handleMessage = (topic: string, payload: Buffer | Uint8Array) => {
        try {
          const payloadText = payload.toString();
          const parsed = JSON.parse(payloadText);

          if (isMqttPayload(parsed)) {
            messageListeners.forEach((listener) => listener(topic, parsed));
          }
        } catch {
          // ignore invalid payloads
        }
      };

      if (client) {
        client.on('connect', handleConnect);
        client.on('error', handleError);
        client.on('reconnect', handleReconnect);
        client.on('close', handleClose);
        client.on('message', handleMessage);
      }
    });

    return connectPromise;
  },

  disconnect() {
    if (client) {
      cleanupClientEvents(client);
      client.end(true);
      client = null;
    }

    status = 'disconnected';
    connectPromise = null;
    notifyStatus();
  },

  subscribe(topic) {
    if (client) {
      client.subscribe(topic);
    }
  },

  unsubscribe(topic) {
    if (client) {
      client.unsubscribe(topic);
    }
  },

  publish(topic, payload) {
    if (client) {
      client.publish(topic, JSON.stringify(payload));
    }
  },

  onMessage(cb) {
    messageListeners.push(cb);
    return () => {
      const index = messageListeners.indexOf(cb);
      if (index !== -1) {
        messageListeners.splice(index, 1);
      }
    };
  },

  getStatus() {
    return status;
  },

  onStatusChange(cb) {
    statusListeners.push(cb);
    return () => {
      const index = statusListeners.indexOf(cb);
      if (index !== -1) {
        statusListeners.splice(index, 1);
      }
    };
  },
};
