import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api('/admin/audit-logs').then((data) => setLogs(data.logs));
  }, []);

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>Audit logs</h2>
        <p>Recent admin actions for videos, users, and transaction decisions.</p>
      </section>
      <section className="panel">
        <div className="admin-list">
          {logs.map((log) => (
            <article className="admin-row transaction-row" key={log._id}>
              <div>
                <strong>{log.action}</strong>
                <span>{log.actor?.email || 'Unknown admin'}</span>
              </div>
              <div>
                <strong>{log.targetType}</strong>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <pre className="log-details">{JSON.stringify(log.details || {}, null, 2)}</pre>
            </article>
          ))}
          {!logs.length && <p className="muted">No audit logs yet.</p>}
        </div>
      </section>
    </div>
  );
}
