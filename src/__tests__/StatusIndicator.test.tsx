import { render } from '@testing-library/react-native';
import { StatusIndicator } from '../components/StatusIndicator';

describe('StatusIndicator', () => {
  it('renders connected status', () => {
    const { getByText } = render(<StatusIndicator status="connected" />);
    expect(getByText('Conectado')).toBeTruthy();
  });

  it('renders connecting status', () => {
    const { getByText } = render(<StatusIndicator status="connecting" />);
    expect(getByText('Conectando')).toBeTruthy();
  });

  it('renders error status', () => {
    const { getByText } = render(<StatusIndicator status="error" />);
    expect(getByText('Erro')).toBeTruthy();
  });
});
