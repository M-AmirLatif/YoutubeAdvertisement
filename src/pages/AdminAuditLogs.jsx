import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatAction, formatActor, formatDetails, formatTargetType } from '../utils/adminFormatting.js';

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
            <article className="history-row audit-row" key={log._id}>
              <div>
                <strong>{formatAction(log.action)}</strong>
                <span>{formatActor(log.actor)}</span>
              </div>
              <div>
                <strong>{formatTargetType(log.targetType)}</strong>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div className="audit-details">
                <strong>Summary</strong>
                <span>{formatDetails(log.details)}</span>
              </div>
            </article>
          ))}
          {!logs.length && <p className="muted">No audit logs yet.</p>}
        </div>
      </section>
    </div>
  );
}
