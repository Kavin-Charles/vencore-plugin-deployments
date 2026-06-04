// Marks 'running' deployments older than 24 h as 'cancelled'.
// Prevents zombie records from staying in the running state if CI never calls PATCH.
import type { Kysely } from 'kysely';
import type { Database } from '@vencore/db';

const INTERVAL_MS = 60 * 60 * 1_000; // 1 hour
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1_000; // 24 hours

async function cleanStale(db: Kysely<Database>): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
  const result = await db
    .updateTable('deployments')
    .set({ status: 'cancelled' })
    .where('status', '=', 'running')
    .where('started_at', '<', cutoff)
    .returning(['id'])
    .execute();

  if (result.length > 0) {
    console.info(`[stale-deployments] cancelled ${result.length} stale running deployments`);
  }
}

export function startStaleDeploymentsCleaner(db: Kysely<Database>): void {
  void cleanStale(db).catch(err => console.error('[stale-deployments] initial run failed', err));
  setInterval(() => {
    void cleanStale(db).catch(err => console.error('[stale-deployments] run failed', err));
  }, INTERVAL_MS);
  console.info('stale-deployments cleaner started (1-h interval)');
}
