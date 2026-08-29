import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import MongoStatus from '../MongoStatus';
import { server, mockMongoHealth } from '../../../test/setup';
import { http, HttpResponse } from 'msw';

describe('MongoStatus', () => {
  describe('loading state', () => {
    it('shows loading text initially', () => {
      render(<MongoStatus />);
      expect(screen.getByText('MongoDB…')).toBeInTheDocument();
    });

    it('has loading class', () => {
      render(<MongoStatus />);
      expect(document.querySelector('.mongo-loading')).toBeInTheDocument();
    });
  });

  describe('connected state', () => {
    it('shows connected status with database name', async () => {
      render(<MongoStatus />);

      await waitFor(() => {
        expect(screen.getByText(/MongoDB ●/)).toBeInTheDocument();
      });
    });

    it('shows document count', async () => {
      render(<MongoStatus />);

      await waitFor(() => {
        expect(screen.getByText(/150 docs/)).toBeInTheDocument();
      });
    });

    it('has connected class', async () => {
      render(<MongoStatus />);

      await waitFor(() => {
        expect(document.querySelector('.mongo-connected')).toBeInTheDocument();
      });
    });

    it('shows database name from response', async () => {
      render(<MongoStatus />);

      await waitFor(() => {
        expect(screen.getByText(/klearcom/)).toBeInTheDocument();
      });
    });
  });

  describe('disconnected state', () => {
    it('shows offline status when not connected', async () => {
      server.use(
        http.get('*/api/mongodb/status', () => {
          return HttpResponse.json({ connected: false });
        })
      );

      render(<MongoStatus />);

      await waitFor(() => {
        expect(screen.getByText('MongoDB offline')).toBeInTheDocument();
      });
    });

    it('has disconnected class', async () => {
      server.use(
        http.get('*/api/mongodb/status', () => {
          return HttpResponse.json({ connected: false });
        })
      );

      render(<MongoStatus />);

      await waitFor(() => {
        expect(document.querySelector('.mongo-disconnected')).toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('shows offline status on network error', async () => {
      server.use(
        http.get('*/api/mongodb/status', () => {
          return HttpResponse.error();
        })
      );

      render(<MongoStatus />);

      await waitFor(() => {
        expect(screen.getByText('MongoDB offline')).toBeInTheDocument();
      });
    });
  });

  describe('tooltip', () => {
    it('has title attribute with mode info', async () => {
      render(<MongoStatus />);

      await waitFor(() => {
        const span = document.querySelector('.mongo-connected');
        expect(span).toHaveAttribute('title', 'klearcom (standalone)');
      });
    });
  });

  describe('zero documents', () => {
    it('handles zero document count gracefully', async () => {
      server.use(
        http.get('*/api/mongodb/status', () => {
          return HttpResponse.json({
            connected: true,
            database: 'klearcom',
            mode: 'standalone',
            collections: {
              transcripts: 0,
              test_events: 0,
              diagnostics: 0,
            },
          });
        })
      );

      render(<MongoStatus />);

      await waitFor(() => {
        expect(screen.getByText(/0 docs/)).toBeInTheDocument();
      });
    });
  });
});
