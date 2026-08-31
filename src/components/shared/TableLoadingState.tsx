import React from 'react';

export function TableLoadingState({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={100} className="table-loading-state">
        {label}
      </td>
    </tr>
  );
}
