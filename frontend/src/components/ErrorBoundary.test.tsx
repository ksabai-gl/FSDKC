// Pipeline run: 20260611T131110_0vf8xp — covers code-gen finding AC-C04 (error boundary).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import ErrorBoundary from './ErrorBoundary';

function Boom({ message = 'kaboom' }: { message?: string }): ReactElement {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // The boundary logs caught errors; silence to keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('renders the default fallback with the error message on throw', () => {
    render(
      <ErrorBoundary>
        <Boom message="render failed" />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('render failed')).toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={(error) => <div>custom: {error.message}</div>}>
        <Boom message="x" />
      </ErrorBoundary>
    );
    expect(screen.getByText('custom: x')).toBeInTheDocument();
  });

  it('recovers via reset once the child stops throwing', async () => {
    const user = userEvent.setup();

    function Toggle() {
      const [ok, setOk] = useState(false);
      return (
        <ErrorBoundary
          fallback={(_error, reset) => (
            <button
              type="button"
              onClick={() => {
                setOk(true);
                reset();
              }}
            >
              retry
            </button>
          )}
        >
          {ok ? <p>recovered</p> : <Boom />}
        </ErrorBoundary>
      );
    }

    render(<Toggle />);
    await user.click(screen.getByRole('button', { name: 'retry' }));
    expect(screen.getByText('recovered')).toBeInTheDocument();
  });
});
