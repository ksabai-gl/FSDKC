// Vitest global setup. Pipeline run: 20260611T131110_0vf8xp
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
