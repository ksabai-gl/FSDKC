import React, { useEffect, useState } from 'react';
import Table from '../common/Table';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import JobRow from './JobRow';

/**
 * DiscoveryJobsTable
 *
 * Fixes SCRUM-91: previously, a failed API request left `jobs` as an empty
 * array with no distinguishing error state, so the table silently rendered
 * as "No jobs found" even when the request actually failed (e.g. HTTP 401).
 * This version tracks a dedicated `error` state and renders a clear error
 * message with a retry action instead of a misleading empty table.
 */
function DiscoveryJobsTable() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadJobs = () => {
      setLoading(true);
      setError(null);

      fetch('/api/discovery/jobs')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Discovery jobs request failed: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then((data) => {
          if (!cancelled) {
            setJobs(Array.isArray(data) ? data : []);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            // eslint-disable-next-line no-console
            console.error('[DiscoveryJobsTable] failed to load jobs:', err);
            setError(err.message || 'Unable to load discovery jobs');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    };

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorState
        message={`Discovery jobs could not be loaded: ${error}`}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <Table>
      {jobs.length === 0 ? (
        <EmptyState message="No jobs found" />
      ) : (
        jobs.map((job) => <JobRow key={job.id} job={job} />)
      )}
    </Table>
  );
}

export default DiscoveryJobsTable;
