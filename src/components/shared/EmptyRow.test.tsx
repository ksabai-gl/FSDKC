import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyRow } from './EmptyRow';

describe('EmptyRow', () => {
  it('renders the provided empty-state label', () => {
    render(
      <table>
        <tbody>
          <EmptyRow label="No discovery jobs found." />
        </tbody>
      </table>
    );
    expect(screen.getByText('No discovery jobs found.')).toBeInTheDocument();
  });
});