import React from 'react';
import { render } from '@testing-library/react-native';
import StatusIndicator from '../components/StatusIndicator';

test('renders correct label for each status', () => {
  const { getByText, rerender } = render(<StatusIndicator status="connected" />);
  expect(getByText('connected')).toBeTruthy();

  rerender(<StatusIndicator status="connecting" />);
  expect(getByText('connecting')).toBeTruthy();

  rerender(<StatusIndicator status="error" />);
  expect(getByText('error')).toBeTruthy();
});
