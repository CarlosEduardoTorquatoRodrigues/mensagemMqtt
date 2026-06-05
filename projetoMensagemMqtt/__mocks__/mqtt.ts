import { EventEmitter } from 'events';

const mockClient = Object.assign(new EventEmitter(), {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn(),
  end: jest.fn(),
  removeAllListeners: jest.fn(),
});

const connect = jest.fn(() => mockClient as any);
(connect as any).connect = connect;

export default connect;
export { mockClient };
