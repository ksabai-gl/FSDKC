import React from 'react';

/**
 * Shared error-state component for tables backed by async queries.
 * Introduced for SCRUM-91 to give Discovery Jobs (and future tables)
 * a consistent way to surface failed API requests instead of
 * rendering an empty table.
 */
export function TableErrorState({
  label,
  detail,
  onRetry,
}: {
  label: string;
  detail?: string;
  onRetry: () => void;
}) {
  return (
    <tr>
      <td colSpan={100} role="alert" className="table-error-state">
        <div className="table-error-state__message">{label}</div>
        {detail ? <div className="table-error-state__detail">{detail}</div> : null}
        <button type="button" onClick={onRetry} className="table-error-state__retry">
          Retry
        </button>
      </td>
    </tr>
  );
}
