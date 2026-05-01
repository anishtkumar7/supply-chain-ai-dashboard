jest.mock('react-globe.gl', () => ({
  __esModule: true,
  default: function MockGlobe() {
    return null;
  },
}));

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders RIVIT login branding', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: /RIVIT Manufacturing/i })).toBeInTheDocument();
  expect(screen.getByText(/Connect every role in your manufacturing operation/i)).toBeInTheDocument();
});
