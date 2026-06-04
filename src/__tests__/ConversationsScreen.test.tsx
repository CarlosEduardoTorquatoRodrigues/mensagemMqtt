import { fireEvent, render } from '@testing-library/react-native';
import { ConversationsScreen } from '../screens/ConversationsScreen';

const defaultProps = {
  conversations: [],
  status: 'connected' as const,
  onOpenSettings: jest.fn(),
  onOpenConversation: jest.fn(),
  onCreateConversation: jest.fn(async () => ({ id: 'id', name: 'Sala', topic: 'topico', createdAt: '2026-06-04T12:00:00.000Z' })),
  onDeleteConversation: jest.fn(async () => {}),
};

describe('ConversationsScreen', () => {
  it('shows empty state when there are no conversations', () => {
    const { getByText } = render(<ConversationsScreen {...defaultProps} />);
    expect(getByText('Nenhuma conversa encontrada.')).toBeTruthy();
  });

  it('renders a list of conversations', () => {
    const items = [
      { id: '1', name: 'Sala 1', topic: 'mensagemmqtt/sala1', createdAt: '2026-06-04T12:00:00.000Z' },
    ];

    const { getByText } = render(<ConversationsScreen {...defaultProps} conversations={items} />);
    expect(getByText('Sala 1')).toBeTruthy();
    expect(getByText('mensagemmqtt/sala1')).toBeTruthy();
  });
});
