import { render } from '@testing-library/react-native';
import { MessageBubble } from '../components/MessageBubble';

describe('MessageBubble', () => {
  it('renders a sent message without sender label', () => {
    const message = {
      id: '1',
      conversationId: 'conv-1',
      sender: 'Alice',
      body: 'Oi',
      direction: 'sent' as const,
      createdAt: '2026-06-04T12:00:00.000Z',
    };

    const { queryByText, getByText } = render(<MessageBubble message={message} />);
    expect(getByText('Oi')).toBeTruthy();
    expect(queryByText('Alice')).toBeNull();
  });

  it('renders a received message with sender label', () => {
    const message = {
      id: '2',
      conversationId: 'conv-1',
      sender: 'Bob',
      body: 'Olá',
      direction: 'received' as const,
      createdAt: '2026-06-04T12:01:00.000Z',
    };

    const { getByText } = render(<MessageBubble message={message} />);
    expect(getByText('Olá')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });
});
