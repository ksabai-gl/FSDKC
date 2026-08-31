import React from 'react';
import { useDiscoveryJobsQuery } from '../../hooks/useDiscoveryJobsQuery';
import { DiscoveryJobRow } from './DiscoveryJobRow';
import { TableLoadingState } from '../shared/TableLoadingState';
import { TableErrorState } from '../shared/TableErrorState';
import { EmptyRow } from '../shared/EmptyRow';

/**
 * Discovery Jobs table.
 *
 * Fix for SCRUM-91: previously this component mapped directly over
 * `jobsQuery.data` without checking `jobsQuery.isError`. When the API
 * request failed, `jobsQuery.data` was `undefined`, causing the table
 * to silently render empty with no indication of failure. This mirrors
 * the error-state pattern already used by the Dashboard KPI cards.
 */
export function DiscoveryJobsTable() {
  const jobsQuery = useDiscoveryJobsQuery();

  if (jobsQuery.isLoading) {
    return <TableLoadingState label="Loading discovery jobs..." />;
  }

  if (jobsQuery.isError) {
    return (
      <TableErrorState
        label="Failed to load discovery jobs"
        detail={jobsQuery.error instanceof Error ? jobsQuery.error.message : undefined}
        onRetry={() => jobsQuery.refetch()}
      />
    );
  }

  const jobs = jobsQuery.data ?? [];

  return (
    <table>
      <tbody>
        {jobs.length === 0 ? (
          <EmptyRow label="No discovery jobs found." />
        ) : (
          jobs.map((job) => <DiscoveryJobRow key={job.id} job={job} />)
        )}
      </tbody>
    </table>
  );
}
