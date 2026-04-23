jest.mock('react-globe.gl', () => ({
  __esModule: true,
  default: function MockGlobe() {
    return null;
  },
}));

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Supply Chain Dashboard');
});
