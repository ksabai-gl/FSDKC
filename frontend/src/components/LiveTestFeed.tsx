import type { TestEvent } from '../types';

interface Props {
  events: TestEvent[];
  isRunning: boolean;
  progress: number;
  title?: string;
}

export default function LiveTestFeed({ events, isRunning, progress, title = 'Live Test Feed' }: Props) {
  if (events.length === 0 && !isRunning) {
    return (
      <div className="live-feed empty">
        Start a test to see real-time events from MongoDB
      </div>
    );
  }

  return (
    <div className="live-feed">
      <div className="live-feed-header">
        <strong>{title}</strong>
        {isRunning && <span className="live-pulse">LIVE</span>}
      </div>

      {progress > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="live-events">
        {events.map((doc, i) => (
          <div key={doc._id ?? i} className={`live-event live-event-${doc.event?.type ?? 'step'}`}>
            <span className="live-event-time">
              {doc.created_at ? new Date(doc.created_at).toLocaleTimeString() : ''}
            </span>
            <span className="live-event-msg">
              {doc.event?.message ?? doc.event?.event ?? JSON.stringify(doc.event)}
            </span>
            {doc.event?.transcript && (
              <div className="live-transcript">"{doc.event.transcript}"</div>
            )}
            {doc.event?.progress != null && (
              <span className="live-progress">{doc.event.progress}%</span>
            )}
          </div>
        ))}
        {isRunning && <div className="live-event live-event-pending">Waiting for next event…</div>}
      </div>
    </div>
  );
}
