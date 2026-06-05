import { mqttService } from '../services/mqttService';
import mqtt from 'mqtt';

jest.mock('mqtt');

const { mockClient } = jest.requireMock('mqtt') as { mockClient: any };

beforeEach(() => {
  jest.clearAllMocks();
  mockClient.removeAllListeners();
});

afterEach(() => {
  mqttService.disconnect();
});

describe('MqttService', () => {
  it('connect resolves on connect and updates status', async () => {
    const connectPromise = mqttService.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-1',
    });

    mockClient.emit('connect');

    await expect(connectPromise).resolves.toBeUndefined();
    expect(mqtt).toHaveBeenCalledWith('wss://broker.hivemq.com:8884/mqtt', {
      clientId: 'client-1',
      reconnectPeriod: 5000,
    });
    expect(mqttService.getStatus()).toBe('connected');
  });

  it('connect rejects with CONNECTION_FAILED on initial error', async () => {
    const connectPromise = mqttService.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-2',
    });

    mockClient.emit('error', new Error('failed to connect'));

    await expect(connectPromise).rejects.toMatchObject({ code: 'CONNECTION_FAILED' });
    expect(mqttService.getStatus()).toBe('error');
  });

  it('subscribe and unsubscribe call client methods', async () => {
    const connectPromise = mqttService.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: false,
      clientId: 'client-3',
    });
    mockClient.emit('connect');
    await connectPromise;

    mqttService.subscribe('topic/1');
    mqttService.unsubscribe('topic/1');

    expect(mockClient.subscribe).toHaveBeenCalledWith('topic/1');
    expect(mockClient.unsubscribe).toHaveBeenCalledWith('topic/1');
  });

  it('publish serializes payload as JSON', async () => {
    const payload = {
      clientId: 'client-4',
      sender: 'Rafael',
      body: 'Hello',
      sentAt: '2026-06-03T14:22:05.123Z',
    };

    const connectPromise = mqttService.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: false,
      clientId: 'client-4',
    });
    mockClient.emit('connect');
    await connectPromise;

    mqttService.publish('sala/futebol', payload);

    expect(mockClient.publish).toHaveBeenCalledWith('sala/futebol', JSON.stringify(payload));
  });

  it('onMessage delivers parsed payload and ignores invalid JSON', async () => {
    const callback = jest.fn();
    mqttService.onMessage(callback);

    const payload = {
      clientId: 'client-5',
      sender: 'Rafael',
      body: 'Oi',
      sentAt: '2026-06-03T14:22:05.123Z',
    };

    mockClient.emit('message', 'sala/futebol', Buffer.from(JSON.stringify(payload)));
    expect(callback).toHaveBeenCalledWith('sala/futebol', payload);

    callback.mockClear();
    mockClient.emit('message', 'sala/futebol', Buffer.from('not-json'));
    expect(callback).not.toHaveBeenCalled();
  });

  it('onStatusChange notifies status updates and cancel works', async () => {
    const listener = jest.fn();
    const cancel = mqttService.onStatusChange(listener);

    const connectPromise = mqttService.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: false,
      clientId: 'client-6',
    });
    mockClient.emit('connect');
    await connectPromise;

    expect(listener).toHaveBeenCalled();

    cancel();
    mqttService.disconnect();

    expect(listener).toHaveBeenCalled();
  });
});
