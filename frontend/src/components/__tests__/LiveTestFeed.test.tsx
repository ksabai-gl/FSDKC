import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiveTestFeed from '../LiveTestFeed';
import type { TestEvent } from '../../types';

describe('LiveTestFeed', () => {
  const mockEvents: TestEvent[] = [
    {
      _id: 'evt1',
      session_id: 'sess-123',
      module: 'discovery',
      reference_id: 1,
      event: {
        type: 'step',
        message: 'Call initiated',
        progress: 10,
      },
      created_at: '2026-06-11T10:00:00Z',
    },
    {
      _id: 'evt2',
      event: {
        type: 'step',
        message: 'Prompt detected',
        transcript: 'Welcome to support.',
        progress: 50,
      },
      created_at: '2026-06-11T10:00:05Z',
    },
  ];

  describe('empty state', () => {
    it('shows empty state when no events and not running', () => {
      render(<LiveTestFeed events={[]} isRunning={false} progress={0} />);
      expect(screen.getByText(/Start a test to see real-time events/)).toBeInTheDocument();
    });

    it('has empty class on container', () => {
      render(<LiveTestFeed events={[]} isRunning={false} progress={0} />);
      expect(document.querySelector('.live-feed.empty')).toBeInTheDocument();
    });
  });

  describe('running state', () => {
    it('shows LIVE indicator when running', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={true} progress={50} />);
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('shows waiting message when running', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={true} progress={50} />);
      expect(screen.getByText('Waiting for next event…')).toBeInTheDocument();
    });

    it('does not show LIVE indicator when not running', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={100} />);
      expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
    });
  });

  describe('progress bar', () => {
    it('renders progress bar when progress > 0', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={true} progress={50} />);
      expect(document.querySelector('.progress-bar')).toBeInTheDocument();
    });

    it('sets correct width on progress fill', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={true} progress={75} />);
      const fill = document.querySelector('.progress-fill') as HTMLElement;
      expect(fill.style.width).toBe('75%');
    });

    it('does not render progress bar when progress is 0', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={0} />);
      expect(document.querySelector('.progress-bar')).not.toBeInTheDocument();
    });
  });

  describe('event rendering', () => {
    it('renders all events', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={100} />);
      expect(screen.getByText('Call initiated')).toBeInTheDocument();
      expect(screen.getByText('Prompt detected')).toBeInTheDocument();
    });

    it('renders event timestamps', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={100} />);
      const timeElements = document.querySelectorAll('.live-event-time');
      expect(timeElements.length).toBe(2);
    });

    it('renders transcript when present', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={100} />);
      expect(screen.getByText('"Welcome to support."')).toBeInTheDocument();
    });

    it('renders progress percentage when present', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={100} />);
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('title', () => {
    it('uses default title', () => {
      render(<LiveTestFeed events={mockEvents} isRunning={false} progress={100} />);
      expect(screen.getByText('Live Test Feed')).toBeInTheDocument();
    });

    it('uses custom title when provided', () => {
      render(
        <LiveTestFeed
          events={mockEvents}
          isRunning={false}
          progress={100}
          title="Discovery — Live IVR Test"
        />
      );
      expect(screen.getByText('Discovery — Live IVR Test')).toBeInTheDocument();
    });
  });

  describe('event with minimal data', () => {
    it('handles event without message (falls back to event.event)', () => {
      const minimalEvents: TestEvent[] = [
        {
          _id: 'evt1',
          event: {
            event: 'call_connected',
          },
        },
      ];
      render(<LiveTestFeed events={minimalEvents} isRunning={false} progress={100} />);
      expect(screen.getByText('call_connected')).toBeInTheDocument();
    });

    it('handles event with no recognizable message (JSON stringifies)', () => {
      const unknownEvents: TestEvent[] = [
        {
          _id: 'evt1',
          event: {
            custom_field: 'test',
          },
        },
      ];
      render(<LiveTestFeed events={unknownEvents} isRunning={false} progress={100} />);
      expect(screen.getByText(/custom_field/)).toBeInTheDocument();
    });
  });
});
