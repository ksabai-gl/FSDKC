import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export interface CreateDiscoveryJobPayload {
  name: string;
  target: string;
  [key: string]: unknown;
}

async function createDiscoveryJob(payload: CreateDiscoveryJobPayload): Promise<unknown> {
  const response = await fetch('/api/discovery-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Failed to create discovery job (status ${response.status})`;
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // response body was not JSON; keep default message
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * Hook wrapping the Create Discovery Job mutation.
 *
 * Fix for SCRUM-90: previously only `isPending` was consumed by callers,
 * so a failed request produced no visible error. This hook now exposes
 * `submitError` (a user-friendly message) and resets it on every new
 * submit attempt so stale errors never linger after a later success.
 */
export function useCreateDiscoveryJob(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createDiscoveryJob,
    onSuccess: () => {
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['discoveryJobs'] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create discovery job. Please try again.';
      setSubmitError(message);
    },
  });

  const submit = useCallback(
    (payload: CreateDiscoveryJobPayload) => {
      setSubmitError(null);
      mutation.mutate(payload);
    },
    [mutation]
  );

  return {
    submit,
    isPending: mutation.isPending,
    isError: mutation.isError,
    submitError,
  };
}
