import React from 'react';

export function EmptyRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={100} className="table-empty-row">
        {label}
      </td>
    </tr>
  );
}
