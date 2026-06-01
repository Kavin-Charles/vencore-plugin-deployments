import type { PluginManifest } from '@vantage/plugin-types';

export const manifest: PluginManifest = {
  id: 'com.vantage.deployments',
  name: 'Deployments',
  version: '1.0.0',
  description: 'Track CI/CD deployments per server. Ingest from webhooks, agents, or manually.',
  permissions: ['servers:read'],
  tables: [],
  migrations: [
    {
      version: '1.0.0',
      up: `
        CREATE TABLE IF NOT EXISTS deployments (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID NOT NULL,
          server_id   UUID,
          name        VARCHAR,
          environment VARCHAR,
          status      VARCHAR NOT NULL DEFAULT 'pending',
          source      VARCHAR NOT NULL DEFAULT 'manual',
          started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          finished_at TIMESTAMPTZ,
          duration_s  INTEGER,
          git_commit  VARCHAR(40),
          git_branch  VARCHAR(255),
          git_tag     VARCHAR(255),
          git_message TEXT,
          git_author  VARCHAR(255),
          meta        JSONB,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS deployments_workspace_id_idx
          ON deployments (workspace_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS deployments_server_id_idx
          ON deployments (server_id);
      `,
      down: `DROP TABLE IF EXISTS deployments;`,
    },
  ],
};
