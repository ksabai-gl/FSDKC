import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableLoadingState } from './TableLoadingState';

describe('TableLoadingState', () => {
  it('renders the provided label', () => {
    render(
      <table>
        <tbody>
          <TableLoadingState label="Loading discovery jobs..." />
        </tbody>
      </table>
    );
    expect(screen.getByText('Loading discovery jobs...')).toBeInTheDocument();
  });
});