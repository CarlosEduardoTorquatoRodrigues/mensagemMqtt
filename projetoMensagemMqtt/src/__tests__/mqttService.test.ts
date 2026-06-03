const EventEmitter = require('events');

type MqttPayload = import('../types').MqttPayload;

const mockPublish = jest.fn();
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockEnd = jest.fn();

class MockClient extends EventEmitter {
  publish = mockPublish;
  subscribe = mockSubscribe;
  unsubscribe = mockUnsubscribe;
  end = mockEnd;
}

const mockConnect = jest.fn((url: string) => {
  const client = new MockClient();
  process.nextTick(() => client.emit('connect'));
  return client;
});

jest.mock('mqtt', () => {
  const module: any = {
    connect: mockConnect,
    MqttClient: MockClient,
  };
  module.default = module;
  return module;
});

const { MqttServiceImpl } = require('../services/mqttService');

describe('MqttService', () => {
  beforeEach(() => {
    mockConnect.mockClear();
    mockPublish.mockClear();
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    mockEnd.mockClear();
  });

  afterEach(() => {
    const service = new MqttServiceImpl();
    service.disconnect();
  });

  it('connects successfully and returns connected status', async () => {
    const service = new MqttServiceImpl();
    await service.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-1',
    });

    expect(service.getStatus()).toBe('connected');
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it('rejects with CONNECTION_FAILED on initial connection error', async () => {
    mockConnect.mockImplementationOnce(() => {
      const client = new MockClient();
      process.nextTick(() => client.emit('error', new Error('failed')));
      return client;
    });

    const service = new MqttServiceImpl();

    await expect(
      service.connect({
        host: 'broker.hivemq.com',
        port: 8884,
        useSsl: true,
        clientId: 'client-2',
      }),
    ).rejects.toMatchObject({ code: 'CONNECTION_FAILED' });
  });

  it('subscribes and unsubscribes using the MQTT client', async () => {
    const service = new MqttServiceImpl();
    await service.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-3',
    });

    service.subscribe('sala/futebol');
    service.unsubscribe('sala/futebol');

    expect(mockSubscribe).toHaveBeenCalledWith('sala/futebol');
    expect(mockUnsubscribe).toHaveBeenCalledWith('sala/futebol');
  });

  it('publishes payload serialized as JSON', async () => {
    const service = new MqttServiceImpl();
    await service.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-4',
    });

    const payload: MqttPayload = {
      clientId: 'client-4',
      sender: 'Alice',
      body: 'Olá',
      sentAt: new Date().toISOString(),
    };

    service.publish('sala/futebol', payload);

    expect(mockPublish).toHaveBeenCalledWith('sala/futebol', JSON.stringify(payload));
  });

  it('calls onMessage callback with parsed payload and ignores invalid JSON', async () => {
    const service = new MqttServiceImpl();
    await service.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-5',
    });

    const messageCallback = jest.fn();
    service.onMessage(messageCallback);

    const client = mockConnect.mock.results[0].value as MockClient;
    client.emit('message', 'sala/futebol', JSON.stringify({
      clientId: 'client-5',
      sender: 'Alice',
      body: 'Olá',
      sentAt: new Date().toISOString(),
    }));

    expect(messageCallback).toHaveBeenCalledTimes(1);

    messageCallback.mockClear();
    client.emit('message', 'sala/futebol', 'invalid-json');

    expect(messageCallback).not.toHaveBeenCalled();
  });

  it('notifies status changes and cancels status listeners', async () => {
    const service = new MqttServiceImpl();
    const statusCallback = jest.fn();
    const unsubscribe = service.onStatusChange(statusCallback);

    await service.connect({
      host: 'broker.hivemq.com',
      port: 8884,
      useSsl: true,
      clientId: 'client-6',
    });

    expect(statusCallback).toHaveBeenLastCalledWith('connected');
    expect(statusCallback).toHaveBeenCalledTimes(2);

    unsubscribe();
    const client = mockConnect.mock.results[0].value as MockClient;
    client.emit('close');

    expect(statusCallback).toHaveBeenCalledTimes(2);
  });
});
