import React, { useState } from 'react';
import { useCreateDiscoveryJob } from './useCreateDiscoveryJob';

interface CreateDiscoveryJobFormProps {
  onClose: () => void;
}

/**
 * Create Discovery Job form.
 *
 * Fix for SCRUM-90: a failed create request previously produced no
 * visible feedback (only `isPending` was read on the submit button).
 * This component now renders an inline error alert whenever the
 * mutation fails, using `isError` / `submitError` from the hook.
 */
export function CreateDiscoveryJobForm({ onClose }: CreateDiscoveryJobFormProps) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');

  const { submit, isPending, isError, submitError } = useCreateDiscoveryJob(onClose);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit({ name, target });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="discovery-job-name">Job Name</label>
      <input
        id="discovery-job-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label htmlFor="discovery-job-target">Target</label>
      <input
        id="discovery-job-target"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        required
      />

      {isError && (
        <div
          role="alert"
          data-testid="create-discovery-job-error"
          style={{ color: '#b00020', marginTop: 8, marginBottom: 8 }}
        >
          {submitError ?? 'Failed to create discovery job. Please try again.'}
        </div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating…' : 'Create Discovery Job'}
      </button>
      <button type="button" onClick={onClose} disabled={isPending}>
        Cancel
      </button>
    </form>
  );
}
