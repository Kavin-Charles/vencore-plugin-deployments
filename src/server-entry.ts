import { Router, type Response } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '@vencore/db';
import { createDeploymentsRouter } from './routes/deployments';

function serveUi(res: Response) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Deployments</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f7f6f2;color:#1a1814;font-size:13px;height:100vh;display:flex;flex-direction:column}
header{padding:14px 20px;background:#fff;border-bottom:1px solid #e4e0d8;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
h1{font-size:16px;font-weight:600;letter-spacing:-.3px}
.count{font-size:12px;color:#9e998f}
.content{padding:20px;flex:1;overflow-y:auto}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e4e0d8}
th{padding:9px 14px;text-align:left;font-size:10px;font-weight:600;color:#9e998f;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e4e0d8}
td{padding:10px 14px;border-bottom:1px solid #e4e0d8;vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f7f6f2}
.status{font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;text-transform:capitalize}
.status.success{background:#d8f3dc;color:#2d6a4f}
.status.failed,.status.error{background:#fee2e2;color:#991b1b}
.status.running{background:#dbeafe;color:#1e3a8a}
.status.pending{background:#fef3c7;color:#92400e}
.status.cancelled{background:#f0ede6;color:#6b665c}
.commit{font-family:monospace;font-size:11px;color:#6b665c;background:#f0ede6;padding:1px 6px;border-radius:4px}
.env{font-size:11px;padding:1px 7px;border-radius:4px;background:#f0ede6;color:#6b665c}
.empty{padding:40px;text-align:center;color:#9e998f}
.ts{font-size:11px;color:#9e998f}
</style>
</head>
<body>
<header>
  <h1>Deployments</h1>
  <span class="count" id="count"></span>
</header>
<div class="content" id="content"><div class="empty">Loading…</div></div>
<script>
const BASE = '/api/plugins/route/com.vencore.deployments';
let TOKEN = null;

window.addEventListener('message', e => {
  if (e.data?.type === 'AUTH_TOKEN') { TOKEN = e.data.token; boot(); }
});

async function boot() {
  const r = await fetch(BASE + '?limit=50', {
    credentials: 'include',
    headers: TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}
  });
  const json = await r.json();
  const deps = json.data ?? [];
  document.getElementById('count').textContent = deps.length + ' deployments';
  const content = document.getElementById('content');
  if (!deps.length) { content.innerHTML = '<div class="empty">No deployments yet.</div>'; return; }

  content.innerHTML = '<table>' +
    '<thead><tr><th>Status</th><th>Name</th><th>Environment</th><th>Commit</th><th>Source</th><th>Started</th></tr></thead>' +
    '<tbody>' + deps.map(d => {
      const ts = new Date(d.started_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
      const commit = d.git_commit ? '<span class="commit">' + d.git_commit.slice(0,7) + '</span>' : '—';
      const name = d.name || (d.git_branch ? esc(d.git_branch) : '—');
      return '<tr>' +
        '<td><span class="status ' + esc(d.status) + '">' + esc(d.status) + '</span></td>' +
        '<td>' + esc(name) + '</td>' +
        '<td>' + (d.environment ? '<span class="env">' + esc(d.environment) + '</span>' : '—') + '</td>' +
        '<td>' + commit + '</td>' +
        '<td>' + esc(d.source) + '</td>' +
        '<td class="ts">' + ts + '</td>' +
      '</tr>';
    }).join('') +
    '</tbody></table>';
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.parent.postMessage({ type: 'PLUGIN_READY' }, '*');
</script>
</body>
</html>`);
}

export function createRouter(db: Kysely<Database>) {
  const router = Router();
  router.get('/ui', (_req, res) => serveUi(res));
  router.use('/', createDeploymentsRouter(db));
  return router;
}
